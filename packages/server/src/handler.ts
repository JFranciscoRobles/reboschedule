// The routes booking needs of a server, as a function from a Request to a
// Response (a route of Next.js, a Worker, Bun, `node:http` by `nodeHandler`,
// even a page, its fetch its own): the times free of a kind of appointment; a
// booking, checked again against the times free as they are when it comes
// (someone may have taken it a second before), kept at once by the
// application if it says how (`keep`), held while it is paid for if payments
// are taken; each booking's own address, signed, to see it, to save it to a
// calendar, to move it and to cancel it (what is given back, given back),
// with no account; and the list of whoever waits for a time that is full,
// the first told when a place of it is free. Nothing is kept here: the
// application says what it has (`load`, `find`) and is told what changes.
// Signed by Web Crypto: the same in Node, Workers, Bun and a browser.

import {
  type Booking,
  type BookingProblem,
  bookingProblems,
  type Busy,
  cancelBooking,
  clockAt,
  type Coupon,
  confirmBooking,
  couponFits,
  depositOf,
  describeBookingProblem,
  type EventType,
  googleCalendarUrl,
  holdBooking,
  icsOf,
  lengthOf,
  type Locale,
  makeBooking,
  makeSeries,
  makeStay,
  moveBooking,
  movableUntil,
  type Notice,
  nightsOf,
  noticeOf,
  type Offer,
  type Organizer,
  offerOf,
  planSeries,
  priceSlots,
  type Quote,
  readBookingRequest,
  readWaiting,
  refundOf,
  runOut,
  type Schedule,
  slotsOf,
  stayProblems,
  stayResource,
  stayTimes,
  addDays,
  unitsOf,
  type Waiting,
  withCoupon,
} from '@reboschedule/core';
import type { Payments } from './payments';

/** What the application has of a kind of appointment: it, the owner's hours and name, and what is taken. */
export interface Calendar {
  type: EventType;
  schedule: Schedule;
  organizer: Organizer;
  /** What is taken from `from` to `to` (ISO): appointments, the owner's own calendar. */
  busy(from: string, to: string): Busy[] | Promise<Busy[]>;
}

export interface BookingHandlerOptions {
  /** Long, random, the same in every process: what each booking's address is signed with. Sixteen characters at least. */
  secret: string;
  /** Where the server is seen from outside: `https://example.com`. */
  base: string;
  /** The path its routes are under; `/s` unless said. */
  prefix?: string;
  /** A kind of appointment by its slug, with what it needs; none if there is no such. */
  load(slug: string): Calendar | null | undefined | Promise<Calendar | null | undefined>;
  /** A booking by its id, with its kind's calendar; none if there is no such. */
  find(id: string): { booking: Booking; calendar: Calendar } | null | undefined | Promise<{ booking: Booking; calendar: Calendar } | null | undefined>;
  /**
   * What is booked (or held), kept at once with checking it is still free: in a transaction or a lock of the
   * application's own, `check()` asks the times again as they are kept now, or a unique index of `claimsOf` refuses
   * the second. False, it was taken a moment ago: answered as taken. Not given, what is booked is only told.
   */
  keep?(bookings: Booking[], context: { calendar: Calendar; check: () => Promise<boolean> }): boolean | Promise<boolean>;
  /**
   * Told each booking made: its calendar, its own address, its invitation, the message to send whoever booked it
   * (`notice`), and, when it was booked every week, all of its `series` (keep them all) and the times `skipped`.
   */
  onBooked(booking: Booking, done: { calendar: Calendar; manage: string; ics: string; notice: Notice; series: Booking[]; skipped: string[] }): void | Promise<void>;
  /** Told each booking cancelled by whoever booked it, as it is now (what was given back in `refunded`), with the message that says so. */
  onCancelled?(booking: Booking, calendar: Calendar, notice: Notice): void | Promise<void>;
  /** Told each booking moved by whoever booked it, as it is now and as it was. Given, they may move it, until `reschedule` hours before. */
  onMoved?(booking: Booking, done: { calendar: Calendar; before: Booking; notice: Notice; manage: string }): void | Promise<void>;
  locale?: Locale;
  /** What a booking costs by rules of the application's own (an evening that costs more, a member's price); the kind's price unless given. */
  quote?: Quote;
  /** A discount by its code, for a kind; none if there is no such. */
  coupons?(code: string, type: EventType): Coupon | null | undefined | Promise<Coupon | null | undefined>;
  /**
   * Who takes the payments. Given, a booking with a price is held (its place kept `hold` minutes), told to `onHeld`,
   * and answered with where to pay it; told to `onBooked` when the provider says it was paid, at `/paid`.
   */
  payments?: Payments;
  /** How many minutes a booking held keeps its place; ten unless said. */
  hold?: number;
  /** Told each booking held while it is paid for (and the rest of its series, held too): keep them, as they take their places until `held`. */
  onHeld?(booking: Booking, done: { calendar: Calendar; manage: string; pay: string; series: Booking[] }): void | Promise<void>;
  /** Whoever waits for a time that is full: those of a kind at a time, the first first; told of each who asks, and of each told a place is free (mark them `offered`). */
  waitlist?: {
    list(type: EventType, start: string): Waiting[] | Promise<Waiting[]>;
    onAdded(waiting: Waiting, calendar: Calendar): void | Promise<void>;
    onOffered(waiting: Waiting, offer: Offer, calendar: Calendar): void | Promise<void>;
  };
  /** Whether each booking has its entry code, a QR to show at the door: in its message, at its address. Read with `readTicket`, let in with `checkIn`. */
  tickets?: boolean;
  /** Where whoever books a kind does it, for the messages of the waitlist; `base` unless said. */
  page?(type: EventType): string;
  /** Now, as milliseconds; the clock's unless said. */
  now?: () => number;
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const encoder = new TextEncoder();
const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const fromBase64url = (text: string) => {
  try {
    const raw = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder().decode(Uint8Array.from(raw, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
};
/** Two marks the same, in as long whatever they differ in. */
const same = (a: string, b: string) => a.length === b.length && [...a].reduce((n, c, i) => n | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

/** A kind of appointment as anyone may see it: all but where it is, which is told to who books it. */
export const publicType = (t: EventType) => ({ ...t, place: { kind: t.place.kind, value: t.place.kind === 'custom' ? t.place.value : '' } });

/** What is taken, all but what a booking itself takes: to move it. */
function withoutOwn(busy: Busy[], booking: Booking): Busy[] {
  const own = (x: Busy) => x.start === booking.start && x.end === booking.end;
  let seats = new Set(booking.seats ?? []);
  let one = !booking.seats?.length;
  return busy.filter((x) => {
    if (!own(x)) return true;
    if (x.resource !== undefined && seats.has(x.resource)) {
      seats = new Set([...seats].filter((s) => s !== x.resource));
      return false;
    }
    if (one && (x.resource ?? '') === booking.resource && (x.places ?? 1) === (booking.places ?? 1)) {
      one = false;
      return false;
    }
    return true;
  });
}

export type BookingHandler = ((request: Request) => Promise<Response>) & {
  /** A booking's own addresses: to see it, move it, cancel it; its invitation. */
  addresses(booking: Booking): Promise<{ manage: string; ics: string }>;
  /** The reminder of a booking, with its own address: for the application to send the day before, and mark `reminded`. */
  reminder(booking: Booking, calendar: Calendar): Promise<Notice>;
  /** Whoever waits for a time told a place of it is free, if one is: after a hold ran out, for one. */
  offer(calendar: Calendar, start: string): Promise<Offer | null>;
  /** A booking's entry code: signed apart from its address, so whoever sees it at the door may not cancel it. */
  ticketOf(booking: Booking): Promise<string>;
  /** The booking's id of an entry code, if it is one this server signed; none otherwise. */
  readTicket(code: string): Promise<string | null>;
};

export function createBookingHandler(options: BookingHandlerOptions): BookingHandler {
  if (options.secret.length < 16) throw new Error('The secret of the booking handler has to be sixteen characters at least.');
  if (options.payments && !options.onHeld) throw new Error('A booking handler that takes payments needs `onHeld`, to keep what is held while it is paid for.');
  const prefix = options.prefix ?? '/s';
  const root = `${options.base.replace(/\/$/, '')}${prefix}`;
  const now = options.now ?? Date.now;
  const locale = options.locale ?? 'en';
  const key = crypto.subtle.importKey('raw', encoder.encode(options.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mark = async (id: string, what = 'booking') => base64url(new Uint8Array(await crypto.subtle.sign('HMAC', await key, encoder.encode(`${what}:${id}`)))).slice(0, 22);
  const ticketOf = async (booking: Booking) => `RS1.${base64url(encoder.encode(booking.id))}.${await mark(booking.id, 'ticket')}`;
  const readTicket = async (code: string) => {
    const [head, raw, m] = code.trim().split('.');
    const id = head === 'RS1' && raw && m ? fromBase64url(raw) : null;
    return id && same(m, await mark(id, 'ticket')) ? id : null;
  };
  const tokenOf = async (id: string) => `${base64url(encoder.encode(id))}.${await mark(id)}`;
  const read = async (token: string) => {
    const [raw, m] = token.split('.');
    const id = raw && m ? fromBase64url(raw) : null;
    return id && same(m, await mark(id)) ? id : null;
  };
  const addresses = async (booking: Booking) => {
    const token = await tokenOf(booking.id);
    return { manage: `${root}/b/${token}`, ics: `${root}/b/${token}/ics` };
  };
  const problemsOf = (problems: BookingProblem[], type: EventType) => problems.map((p) => ({ ...p, message: describeBookingProblem(p, locale, type) }));
  const taken = (type: EventType) => json({ error: 'problems', problems: problemsOf([{ code: 'taken' }], type) }, 409);
  /** Until when whoever booked may move it themselves, if the application lets them. */
  const moveUntil = (booking: Booking, type: EventType) => (options.onMoved ? movableUntil(booking, type) : null);
  const shown = async (booking: Booking, c: Calendar) => ({
    booking,
    type: booking.status === 'held' ? publicType(c.type) : c.type,
    organizer: { name: c.organizer.name },
    ...(await addresses(booking)),
    google: googleCalendarUrl(booking, c.type, c.organizer),
    // Where its kind's times are, to move it; until when; what cancelling it now gives back.
    endpoint: `${root}/${encodeURIComponent(c.type.slug)}`,
    moveUntil: moveUntil(booking, c.type),
    refund: refundOf(booking, c.type, now()),
    // Held, where to pay it and until when; nothing of where it is until it is paid. Confirmed, its entry code.
    ...(booking.status === 'held' ? { pay: booking.payment?.url, until: booking.held } : {}),
    ...(options.tickets && booking.status === 'confirmed' ? { ticket: await ticketOf(booking) } : {}),
  });
  const notify = async (kind: Notice['kind'], booking: Booking, c: Calendar, before?: Booking) => {
    const { manage } = await addresses(booking);
    const ticket = options.tickets && booking.status === 'confirmed' && kind !== 'cancelled' ? await ticketOf(booking) : undefined;
    return noticeOf(kind, booking, c.type, c.organizer, { locale, manage, before, movable: !!moveUntil(booking, c.type), ticket });
  };

  /** What is taken, from yesterday to the horizon. */
  const busyOf = (c: Calendar) => {
    const t = now();
    return c.busy(new Date(t - 86_400_000).toISOString(), new Date(t + (c.type.horizon + 2) * 86_400_000).toISOString());
  };
  /** The times free of a calendar from `from` to `to` (days as the owner's clock says them), for a length of those it has. */
  const freeOf = async (c: Calendar, options: { from?: string; to?: string; length?: number; places?: number } = {}) => slotsOf(c.type, c.schedule, { ...options, busy: await busyOf(c), now: now() });
  const dayOf = (iso: string, c: Calendar) => clockAt(Date.parse(iso), c.schedule.timeZone).day;

  /** Whether a booking would have its place as what is taken is now (all but `except`, when it is moved): nobody took it meanwhile. */
  async function stillFree(booking: Booking, c: Calendar, except?: Booking) {
    const all = await busyOf(c);
    const busy = except ? withoutOwn(all, except) : all;
    if (c.type.stay) {
      const nights = nightsOf(c.type, c.schedule, { busy, now: now() });
      return stayResource(c.type, nights, dayOf(booking.start, c), dayOf(booking.end, c), booking.resource) === booking.resource;
    }
    const length = (Date.parse(booking.end) - Date.parse(booking.start)) / 60_000;
    const free = slotsOf(c.type, c.schedule, { busy, now: now(), length, places: booking.seats ? 1 : booking.places, notice: 0 });
    const slot = free.find((x) => Date.parse(x.start) === Date.parse(booking.start));
    if (!slot) return false;
    const wanted = booking.seats ?? (c.type.resources.length ? [booking.resource] : []);
    return wanted.every((id) => slot.resources?.includes(id));
  }

  /** Kept by the application at once, if it says how: false if it was taken a moment ago. */
  const kept = async (bookings: Booking[], c: Calendar, except?: Booking) =>
    !options.keep || (await options.keep(bookings, { calendar: c, check: async () => (await Promise.all(bookings.map((b) => stillFree(b, c, except)))).every(Boolean) }));

  /** A booking made: kept, told, and answered; or, when it costs and payments are taken, held while it is paid for (its deposit, if the kind asks one). */
  async function done(calendar: Calendar, made: Booking[], skipped: string[]): Promise<Response> {
    const amount = made.reduce((n, b) => n + (b.price?.amount ?? 0), 0);
    if (options.payments && amount > 0) {
      const held = made.map((b) => {
        const deposit = b.price ? depositOf(calendar.type, b.price) : null;
        return { ...holdBooking(b, options.hold ?? 10, now()), ...(deposit?.due ? { due: deposit.due } : {}) };
      });
      if (!(await kept(held, calendar))) return taken(calendar.type);
      const total = held.reduce((n, b) => n + (b.price ? depositOf(calendar.type, b.price).now.amount : 0), 0);
      const back = (await addresses(held[0])).manage;
      const begun = await options.payments.checkout({
        booking: held[0],
        bookings: held,
        total: { amount: Math.round(total * 100) / 100, currency: held[0].price?.currency ?? 'MXN' },
        type: calendar.type,
        organizer: calendar.organizer,
        until: held[0].held!,
        back,
        notify: `${root}/paid`,
      });
      const series = held.map((b) => ({ ...b, payment: { provider: options.payments!.provider, id: begun.id, url: begun.url } }));
      await options.onHeld!(series[0], { calendar, manage: back, pay: begun.url, series });
      return json({ ...(await shown(series[0], calendar)), series, skipped }, 202);
    }
    if (!(await kept(made, calendar))) return taken(calendar.type);
    const [booking] = made;
    const addressed = await addresses(booking);
    await options.onBooked(booking, { calendar, ...addressed, notice: await notify('booked', booking, calendar), series: made, skipped });
    return json({ ...(await shown(booking, calendar)), series: made, skipped }, 201);
  }

  /** The provider says a booking was paid: confirmed and told; or, if its hold ran out and its place was taken, cancelled and refunded. */
  async function paid(request: Request): Promise<Response> {
    const said = await options.payments?.notified(request);
    if (!said) return json({ ignored: true });
    const found = await options.find(said.booking);
    if (!found) return json({ error: 'not-found' }, 404);
    const { booking, calendar } = found;
    if (booking.status !== 'held') return json({ status: booking.status });
    const amount = Math.round(((booking.price?.amount ?? 0) - (booking.due?.amount ?? 0)) * 100) / 100;
    const payment = booking.payment ? { ...booking.payment, paid: said.paid, amount } : undefined;
    if (runOut(booking, now()) && !(await stillFree(booking, calendar))) {
      const cancelled = cancelBooking({ ...booking, ...(payment ? { payment } : {}) });
      const refunded = { amount, currency: booking.price?.currency ?? 'MXN' };
      await options.payments?.refund?.(cancelled, refunded);
      const gone = { ...cancelled, refunded };
      await options.onCancelled?.(gone, calendar, await notify('cancelled', gone, calendar));
      return json({ status: 'refunded' });
    }
    const confirmed = { ...confirmBooking(booking, said.paid), ...(payment ? { payment } : {}) };
    const addressed = await addresses(confirmed);
    await options.onBooked(confirmed, { calendar, ...addressed, notice: await notify('booked', confirmed, calendar), series: [confirmed], skipped: [] });
    return json({ status: 'confirmed' });
  }

  /** Whether a time has room for whoever waits: so many places of a zone, or so many seats of the room. */
  async function room(calendar: Calendar, w: { start: string; places: number; resource?: string }) {
    const day = dayOf(w.start, calendar);
    const at = (slots: { start: string }[]) => slots.find((s) => Date.parse(s.start) === Date.parse(w.start)) as (typeof slots)[number] & { free: number; resources?: string[] };
    const zone = at(await freeOf(calendar, { from: day, to: day, places: w.places }));
    if (zone && (!w.resource || zone.resources?.includes(w.resource))) return true;
    const seats = at(await freeOf(calendar, { from: day, to: day }));
    return !w.resource && !!seats && seats.free >= w.places;
  }

  /** Whoever waits for a time told, the first who fits, that a place of it is free. */
  async function offer(calendar: Calendar, start: string): Promise<Offer | null> {
    if (!options.waitlist) return null;
    const waiting = (await options.waitlist.list(calendar.type, start)).filter((w) => !w.offered);
    for (const w of waiting) {
      if (!(await room(calendar, w))) continue;
      const told = offerOf(w, calendar.type, calendar.organizer, { locale, link: options.page?.(calendar.type) ?? options.base, timeZone: calendar.schedule.timeZone });
      await options.waitlist.onOffered({ ...w, offered: new Date(now()).toISOString() }, told, calendar);
      return told;
    }
    return null;
  }

  // What fails in a route (the application's `load`, a calendar that does not answer) is a 500, and said, not the end of the server.
  async function handle(request: Request): Promise<Response> {
    try {
      return await route(request);
    } catch (error) {
      console.error('[reboschedule]', error);
      return json({ error: 'failed' }, 500);
    }
  }

  async function route(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const at = url.pathname.indexOf(`${prefix}/`);
    const parts = (at >= 0 ? url.pathname.slice(at + prefix.length) : url.pathname).split('/').filter(Boolean).map(decodeURIComponent);

    // What the provider of payments says was paid.
    if (parts[0] === 'paid' && !parts[1] && request.method === 'POST') return paid(request);

    // A booking's own address: /b/:token, /b/:token/ics, /b/:token/cancel, /b/:token/move.
    if (parts[0] === 'b' && parts[1]) {
      const id = await read(parts[1]);
      const found = id ? await options.find(id) : null;
      if (!found) return json({ error: 'not-found' }, 404);
      const { booking, calendar } = found;
      if (parts[2] === 'ics' && request.method === 'GET')
        return new Response(icsOf(booking, calendar.type, calendar.organizer), {
          headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="${calendar.type.slug}.ics"` },
        });
      if (parts[2] === 'cancel' && request.method === 'POST') {
        if (booking.status === 'cancelled') return json(await shown(booking, calendar));
        // Paid, what its kind's rules give back for how long before it is, given back.
        const refund = refundOf(booking, calendar.type, now());
        if (refund?.amount && options.payments?.refund) await options.payments.refund(booking, refund);
        const cancelled = { ...cancelBooking(booking), ...(refund ? { refunded: refund } : {}) };
        await options.onCancelled?.(cancelled, calendar, await notify('cancelled', cancelled, calendar));
        await offer(calendar, booking.start);
        return json(await shown(cancelled, calendar));
      }
      if (parts[2] === 'move' && request.method === 'POST') return move(booking, calendar, await request.json().catch(() => ({})));
      if (!parts[2] && request.method === 'GET') return json(await shown(booking, calendar));
      return json({ error: 'not-found' }, 404);
    }

    const calendar = parts[0] ? await options.load(parts[0]) : null;
    if (!calendar) return json({ error: 'not-found' }, 404);
    const day = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
    // A code asked of the times: whether it is good for this kind, as whoever books reads it.
    const couponAsked = async () => {
      const code = url.searchParams.get('coupon')?.trim().toUpperCase();
      const c = code && options.coupons ? await options.coupons(code, calendar.type) : null;
      return c && (!c.types?.length || c.types.includes(calendar.type.id)) ? c : null;
    };
    const head = async () => ({
      type: publicType(calendar.type),
      organizer: { name: calendar.organizer.name },
      timeZone: calendar.schedule.timeZone,
      coupons: !!options.coupons,
      coupon: await couponAsked(),
      waitlist: !!options.waitlist,
    });

    if (parts[1] === 'slots' && request.method === 'GET') {
      const length = Number(url.searchParams.get('length')) || undefined;
      const places = Number(url.searchParams.get('places')) || undefined;
      const from = day(url.searchParams.get('from'));
      const to = day(url.searchParams.get('to'));
      // The times of one resource, if it is asked, each priced as that one; else each as the first free.
      const resource = url.searchParams.get('resource') || undefined;
      const free = await freeOf(calendar, { from, to, length, places });
      const slots = priceSlots(resource ? free.filter((s) => s.resources?.includes(resource)) : free, calendar.type, {
        length: lengthOf(calendar.type, length),
        resource,
        quote: options.quote,
        places,
      });
      // The times that are full, to wait for one of them.
      const open = new Set(slots.map((s) => s.start));
      const full = options.waitlist
        ? slotsOf(calendar.type, calendar.schedule, { from, to, length, now: now() })
            .filter((s) => !open.has(s.start))
            .map((s) => s.start)
        : [];
      return json({ ...(await head()), slots, full });
    }

    // A kind of stays: its nights (or days) free, each with the resources that have it.
    if (parts[1] === 'stays' && request.method === 'GET' && calendar.type.stay) {
      const nights = nightsOf(calendar.type, calendar.schedule, { from: day(url.searchParams.get('from')), to: day(url.searchParams.get('to')), busy: await busyOf(calendar), now: now() });
      return json({ ...(await head()), nights });
    }

    // Someone waiting for a time that is full.
    if (parts[1] === 'wait' && request.method === 'POST' && options.waitlist) {
      const asked = await request.json().catch(() => ({}));
      const waiting = readWaiting(asked, calendar.type.id, now());
      if (!waiting) return json({ error: 'problems', problems: problemsOf([{ code: 'bad-email' }], calendar.type) }, 422);
      const d = dayOf(waiting.start, calendar);
      const times = slotsOf(calendar.type, calendar.schedule, { from: d, to: d, now: now() });
      if (!times.some((s) => Date.parse(s.start) === Date.parse(waiting.start))) return json({ error: 'not-found' }, 404);
      if (await room(calendar, waiting)) return json({ error: 'free' }, 409);
      await options.waitlist.onAdded(waiting, calendar);
      return json({ waiting }, 201);
    }

    if (parts[1] === 'book' && request.method === 'POST') {
      const asked = readBookingRequest(await request.json().catch(() => ({})));
      const coupon = asked.coupon && options.coupons ? await options.coupons(asked.coupon, calendar.type) : null;
      const start = calendar.type.stay ? stayTimes(calendar.type, calendar.schedule, asked.arrive ?? '', asked.leave ?? '')?.start : asked.start;
      const badCoupon = !!asked.coupon && (!coupon || !start || !couponFits(coupon, calendar.type, start, calendar.schedule));
      const discounted = (b: Booking) => (coupon && !badCoupon ? withCoupon(b, calendar.type, calendar.schedule, coupon) : b);

      if (calendar.type.stay) {
        const nights = nightsOf(calendar.type, calendar.schedule, { busy: await busyOf(calendar), now: now() });
        const problems: BookingProblem[] = [...stayProblems(asked, calendar.type, nights), ...(badCoupon ? [{ code: 'bad-coupon' as const }] : [])];
        if (problems.length) return json({ error: 'problems', problems: problemsOf(problems, calendar.type) }, problems.some((p) => p.code === 'taken') ? 409 : 422);
        return done(calendar, [discounted(makeStay(asked, calendar.type, calendar.schedule, nights, now(), options.quote))], []);
      }

      // The times free as they are now, for the length asked: another may have taken this one a moment ago.
      const free = await freeOf(calendar, { length: asked.length, places: asked.seats?.length ? 1 : asked.places });
      const problems: BookingProblem[] = [...bookingProblems(asked, calendar.type, free), ...(badCoupon ? [{ code: 'bad-coupon' as const }] : [])];
      if (problems.length) return json({ error: 'problems', problems: problemsOf(problems, calendar.type) }, problems[0].code === 'taken' ? 409 : 422);
      // Every week, as many times as the kind lets: those free are booked, those not are said.
      let series = [makeBooking(asked, calendar.type, now(), free, options.quote)];
      let skipped: string[] = [];
      if (asked.repeat && calendar.type.series > 1) {
        const repeat = { ...asked.repeat, count: Math.min(asked.repeat.count ?? calendar.type.series, calendar.type.series) };
        const plan = planSeries(calendar.type, calendar.schedule, { start: asked.start, repeat, length: asked.length, resource: asked.resource, busy: await busyOf(calendar), now: now() });
        series = makeSeries(asked, calendar.type, plan, now(), options.quote);
        skipped = plan.filter((p) => p.resource === null).map((p) => p.start);
      }
      return done(calendar, series.map(discounted), skipped);
    }

    return json({ error: 'not-found' }, 404);
  }

  /** A booking moved by whoever booked it, until its kind lets them: to another time (the same seats, if it has them), or another first day of the same nights; its price as it was. */
  async function move(booking: Booking, c: Calendar, given: unknown): Promise<Response> {
    const until = moveUntil(booking, c.type);
    if (!options.onMoved || !until) return json({ error: 'not-found' }, 404);
    if (now() > Date.parse(until)) return json({ error: 'problems', problems: problemsOf([{ code: 'too-late' }], c.type) }, 422);
    const asked = readBookingRequest(given);
    const busy = withoutOwn(await busyOf(c), booking);
    let moved: Booking | null = null;
    if (c.type.stay) {
      const n = unitsOf(c.type, dayOf(booking.start, c), dayOf(booking.end, c));
      const arrive = asked.arrive ?? '';
      const leave = addDays(arrive, c.type.stay.unit === 'day' ? n - 1 : n);
      const nights = nightsOf(c.type, c.schedule, { busy, now: now() });
      const resource = stayResource(c.type, nights, arrive, leave, booking.resource) ?? stayResource(c.type, nights, arrive, leave);
      const times = arrive ? stayTimes(c.type, c.schedule, arrive, leave) : null;
      if (resource !== null && times) moved = { ...booking, ...times, resource, sequence: (booking.sequence ?? 0) + 1 };
    } else {
      const length = (Date.parse(booking.end) - Date.parse(booking.start)) / 60_000;
      const free = slotsOf(c.type, c.schedule, { busy, now: now(), length, places: booking.seats ? 1 : booking.places });
      if (booking.seats?.length) {
        const slot = free.find((s) => Date.parse(s.start) === Date.parse(asked.start));
        if (slot && booking.seats.every((s) => slot.resources?.includes(s)))
          moved = { ...booking, start: new Date(Date.parse(slot.start)).toISOString(), end: new Date(Date.parse(slot.end)).toISOString(), sequence: (booking.sequence ?? 0) + 1 };
      } else moved = moveBooking(booking, asked.start, c.type, free);
    }
    if (!moved) return taken(c.type);
    // Not to a time already too close to change: the same hours before it as the kind gives.
    if (Date.parse(moved.start) - now() < (c.type.reschedule ?? 0) * 3_600_000) return json({ error: 'problems', problems: problemsOf([{ code: 'too-late' }], c.type) }, 422);
    // A code good only some days (a Tuesday's two for one) is not taken to a day it is not good for.
    const code = booking.discount && options.coupons ? await options.coupons(booking.discount.code, c.type) : null;
    if (code && !couponFits(code, c.type, moved.start, c.schedule)) return json({ error: 'problems', problems: problemsOf([{ code: 'bad-coupon' }], c.type) }, 422);
    if (!(await kept([moved], c, booking))) return taken(c.type);
    const { manage } = await addresses(moved);
    await options.onMoved(moved, { calendar: c, before: booking, notice: await notify('moved', moved, c, booking), manage });
    await offer(c, booking.start);
    return json(await shown(moved, c));
  }

  return Object.assign(handle, {
    addresses,
    reminder: (booking: Booking, calendar: Calendar) => notify('reminder', booking, calendar),
    offer,
    ticketOf,
    readTicket,
  });
}
