// A server of booking in the page, for the demos: the routes the widget asks
// (`/slots`, `/book`) answered as `@reboschedule/server` answers them, by
// the same engine, every week too; what the owner does from the calendar
// (give a gap, every week too, change who has it, move it, delete it, it
// alone or its series); the messages each of these would send whoever booked;
// and the owner's own calendar, read as busy, when it is connected. Kept in
// the browser that tries it, each demo apart, until it is begun again.

import type { BusyEvent } from '@reboschedule/calendars';
import type { Payments } from '@reboschedule/server';
import { type BookingHandler, type Calendar, createBookingHandler } from '@reboschedule/server/handler';
import {
  type Booking,
  bookingProblems,
  cancelBooking,
  changeBooking,
  describeBookingProblem,
  type EventType,
  type Locale,
  makeBooking,
  makeSeries,
  nightsOf,
  busyOfBookings,
  takes,
  moveBooking,
  type Attendance,
  checkIn,
  type Coupon,
  type Entry,
  markAttendance,
  type Offer,
  quoteOf,
  remindersDue,
  type Waiting,
  type Notice,
  noticeOf,
  type Organizer,
  planSeries,
  priceSlots,
  type Quote,
  type Repeat,
  readBookingRequest,
  readEventType,
  assignRoster,
  type Booking as Turn,
  coverBooking,
  type Member,
  type Schedule,
  type SeriesTime,
  type SwapRequest,
  swapBookings,
  turnBooking,
  type RosterTurn,
  newId,
  type Slot,
  slotsOf,
} from '@reboschedule/core';

export interface DemoData {
  organizer: Organizer;
  schedule: Schedule;
  types: EventType[];
  /** What is booked when the demo begins: its days from today, so it is always as full. */
  seed: () => Booking[];
  /** Rules of its own for what a booking costs, as an application gives `createBookingHandler`. */
  quote?: Quote;
  /** The owner's own calendar (their Google, as its secret address gives it), read as busy while it is connected. */
  away?: () => BusyEvent[];
  /** A roster: the members of each group, the days each cannot when it begins, and the changes they asked of each other. */
  roster?: { members: Member[]; unavailable: () => Record<string, string[]>; swaps: () => SwapRequest[] };
  /** A poster for each kind, by its id: a film's, a night's. */
  posters?: Record<string, string>;
  /** The discount codes it takes. */
  coupons?: Coupon[];
  /** Whether each booking has its entry code, a QR shown at the door. */
  tickets?: boolean;
  /** Whether what costs is paid when booked: held some minutes while it is, as the server holds it with `payments`. */
  pays?: boolean;
}

/** How many minutes a booking is held while it is paid for, in the demos. */
export const HOLD = 10;

/** A message as the demo shows it: of a booking (with its own address, when it has one), or to someone waiting. */
export type Told = (Notice & { manage?: string }) | Offer;

export interface Details {
  name: string;
  email: string;
  answers: Record<string, string>;
  resource?: string;
  repeat?: Repeat;
}

/** Whether a kind takes the owner's own time: not a thing booked, nor a place among several, nor open hours of its own. */
const owners = (type: EventType | undefined) => !!type && !type.resources.length && type.capacity === 1 && type.hours === null;

export class DemoStore {
  /** A new list each time anything changes, never the same one changed: what React compares. */
  bookings: Booking[];
  /** The messages whoever booked (or waits) would have been sent, the newest first; with the booking's own address, when it has one. */
  notices: Told[];
  /** Whoever waits for a time that is full. */
  waiting: Waiting[];
  /** Whether the owner's own calendar is read as busy. */
  connected: boolean;
  /** The days each member of a roster cannot, and the changes they asked. */
  unavailable: Record<string, string[]>;
  swaps: SwapRequest[];
  /** Changes each time something is booked, changed or deleted: what React watches. */
  version = 0;
  private listeners = new Set<() => void>();
  /** The demo as it began, to begin again. */
  private readonly first: DemoData;

  constructor(
    readonly key: string,
    public data: DemoData,
    readonly locale: Locale,
  ) {
    this.first = data;
    this.bookings = this.read<Booking[]>(key) ?? data.seed();
    this.notices = this.read<Told[]>(`${key}-notices`) ?? [];
    this.waiting = this.read<Waiting[]>(`${key}-waiting`) ?? [];
    this.connected = this.read<boolean>(`${key}-connected`) ?? true;
    this.unavailable = this.read<Record<string, string[]>>(`${key}-unavailable`) ?? data.roster?.unavailable() ?? {};
    this.swaps = this.read<SwapRequest[]>(`${key}-swaps`) ?? data.roster?.swaps() ?? [];
    // The kinds as the owner left them, in the settings.
    const types = this.read<unknown[]>(`${key}-types`);
    // Kept before a kind had its room laid out, it is taken as the demo has it now; what it did not have yet (a deposit, its refunds), as the demo has it.
    if (types)
      this.data = {
        ...data,
        types: types.map(readEventType).map((t) => {
          const now = data.types.find((x) => x.id === t.id);
          return now?.seating && !t.seating ? now : { ...now, ...t };
        }),
      };
  }

  private read<T>(key: string): T | null {
    try {
      const kept = localStorage.getItem(key);
      return kept ? (JSON.parse(kept) as T) : null;
    } catch {
      return null;
    }
  }

  private changed() {
    this.version++;
    try {
      localStorage.setItem(this.key, JSON.stringify(this.bookings));
      localStorage.setItem(`${this.key}-types`, JSON.stringify(this.data.types));
      localStorage.setItem(`${this.key}-notices`, JSON.stringify(this.notices.slice(0, 40)));
      localStorage.setItem(`${this.key}-waiting`, JSON.stringify(this.waiting));
      localStorage.setItem(`${this.key}-connected`, JSON.stringify(this.connected));
      localStorage.setItem(`${this.key}-unavailable`, JSON.stringify(this.unavailable));
      localStorage.setItem(`${this.key}-swaps`, JSON.stringify(this.swaps));
    } catch {
      // A private window, or more than it holds: kept while the page is open.
    }
    for (const listen of this.listeners) listen();
  }

  subscribe = (listen: () => void) => {
    this.listeners.add(listen);
    return () => void this.listeners.delete(listen);
  };

  /** All as it was when the demo began. */
  reset() {
    this.bookings = this.data.seed();
    this.data = { ...this.data, types: this.first.types };
    this.notices = [];
    this.waiting = [];
    this.connected = true;
    this.unavailable = this.data.roster?.unavailable() ?? {};
    this.swaps = this.data.roster?.swaps() ?? [];
    this.changed();
  }

  // ——— A roster ———

  members = () => this.data.roster?.members ?? [];
  memberOf = (id?: string) => this.members().find((m) => m.id === id);

  /** A member who can, or cannot, a day. */
  setUnavailable(member: string, day: string, cannot: boolean) {
    const days = new Set(this.unavailable[member] ?? []);
    if (cannot) days.add(day);
    else days.delete(day);
    this.unavailable = { ...this.unavailable, [member]: [...days].sort() };
    this.changed();
  }

  /** The turns of a month nobody has yet, from today, given as evenly as can be: how many were given, and those no one could cover. */
  autoAssign(month: string, from?: string) {
    const type = this.data.types[0];
    const { bookings, unfilled } = assignRoster({ type, schedule: this.data.schedule, month, members: this.members(), unavailable: this.unavailable, bookings: this.bookings, from });
    this.bookings = [...this.bookings, ...bookings];
    this.changed();
    return { given: bookings.length, unfilled };
  }

  /** The turns of a month from a day, all let go: to give them again. */
  clearFrom(month: string, from: string) {
    const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: this.data.schedule.timeZone });
    this.bookings = this.bookings.filter((b) => !(b.status === 'confirmed' && dayOf(b.start).startsWith(month) && dayOf(b.start) >= from));
    this.changed();
  }

  /** A turn given by hand: to a member, from whoever had it, or let go. */
  assign(turn: RosterTurn, memberId: string) {
    const type = this.data.types[0];
    const had = this.bookings.find((b) => b.status === 'confirmed' && b.resource === turn.group && Date.parse(b.start) === Date.parse(turn.start));
    const member = this.memberOf(memberId);
    if (had && had.member === memberId) return;
    if (had) {
      const gone = cancelBooking(had);
      this.tell(noticeOf('cancelled', gone, type, this.data.organizer, { locale: this.locale }));
      this.bookings = this.bookings.filter((b) => b.id !== had.id);
    }
    if (member) {
      const given = had ? { ...coverBooking(had, member), status: 'confirmed' as const } : turnBooking(turn, member, type, this.data.schedule);
      this.bookings = [...this.bookings, given];
      this.tell(noticeOf('booked', given, type, this.data.organizer, { locale: this.locale }));
    }
    this.changed();
  }

  /** A change asked by one member of another: their turns swapped, or theirs covered. */
  ask(from: string, to: string | null, by: string, other: string) {
    this.swaps = [{ id: newId(), from, to, by, with: other, status: 'pending', created: new Date().toISOString() }, ...this.swaps];
    this.changed();
  }

  /** A change answered by whoever it was asked of: done if accepted, each told of the turn they now have and of the one they no longer do. */
  answer(id: string, accept: boolean) {
    const swap = this.swaps.find((x) => x.id === id);
    if (swap?.status !== 'pending') return;
    const type = this.data.types[0];
    const a = this.bookings.find((b) => b.id === swap.from && b.status === 'confirmed');
    const b = swap.to ? this.bookings.find((x) => x.id === swap.to && x.status === 'confirmed') : null;
    const other = this.memberOf(swap.with);
    if (accept && a && other && (swap.to === null || b)) {
      // Each turn as it was, and as it is now: two of them swapped, or one covered.
      const now = b ? swapBookings(a, b) : [coverBooking(a, other)];
      const changed = now.map((after): [Turn, Turn] => [after.id === a.id ? a : (b as Turn), after]);
      for (const [before, after] of changed) {
        this.bookings = this.bookings.map((x) => (x.id === after.id ? after : x));
        this.tell(noticeOf('cancelled', { ...before, status: 'cancelled', sequence: after.sequence }, type, this.data.organizer, { locale: this.locale }));
        this.tell(noticeOf('booked', after, type, this.data.organizer, { locale: this.locale }));
      }
    }
    this.swaps = this.swaps.map((x) => (x.id === id ? { ...x, status: accept ? 'accepted' : 'declined' } : x));
    this.changed();
  }

  /** A kind as the owner writes it in the settings. */
  setType(type: EventType) {
    this.data = { ...this.data, types: this.data.types.map((t) => (t.id === type.id ? type : t)) };
    this.changed();
  }

  /** The owner's own calendar connected, or not. */
  connect(on: boolean) {
    this.connected = on;
    this.changed();
  }

  /** What is busy in the owner's own calendar, while it is connected. */
  away(): BusyEvent[] {
    return this.connected && this.data.away ? this.data.away() : [];
  }

  typeOf = (id: string) => this.data.types.find((t) => t.id === id);

  /** What is taken for a kind, all but one booking (or its series) if said: the owner's appointments take all their time, their own calendar too; the others, only their own places. */
  busyOf(type: EventType, except?: (b: Booking) => boolean) {
    // Of other kinds too, those that take its resources: a barber's cut takes him for a beard trim as well.
    const shares = (b: Booking) => b.type === type.id || (type.resources.length > 0 && type.resources.some((r) => r.id === b.resource || b.seats?.includes(r.id)));
    // Held while it is paid for, its place is taken too, until its minutes run out.
    const mine = this.bookings.filter((b) => takes(b) && !except?.(b));
    if (!owners(type)) return busyOfBookings(mine.filter(shares));
    const booked = mine.filter((b) => owners(this.typeOf(b.type))).map((b) => ({ start: b.start, end: b.end }));
    return [...booked, ...this.away().map(({ start, end }) => ({ start, end }))];
  }

  /** The times free of a kind, for a length of those it has. */
  slots(type: EventType, length?: number, resource?: string, places?: number): Slot[] {
    const free = slotsOf(type, this.data.schedule, { busy: this.busyOf(type), length, places });
    return priceSlots(resource ? free.filter((s) => s.resources?.includes(resource)) : free, type, { length: length ?? type.duration, resource, quote: this.data.quote, places });
  }

  /** The nights (or days) free of a kind of stays. */
  nights(type: EventType) {
    return nightsOf(type, this.data.schedule, { busy: this.busyOf(type) });
  }

  /** Each time of a series and whether it is free; the owner gives turns with no notice and no horizon. */
  plan(type: EventType, start: string, repeat: Repeat, { length, resource, owner = false }: { length?: number; resource?: string; owner?: boolean } = {}): SeriesTime[] {
    return planSeries(type, this.data.schedule, { start, repeat, length, resource, busy: this.busyOf(type), owner });
  }

  private tell(notice: Told) {
    this.notices = [notice, ...this.notices];
    this.changed();
  }

  /** Booked from the widget, or given by the owner: checked against the times free now, as the server does; every week if asked and the kind lets it (the owner, always). */
  book(type: EventType, given: unknown, { owner = false }: { owner?: boolean } = {}) {
    const asked = readBookingRequest(given);
    const places = asked.seats?.length ? undefined : asked.places;
    const free = owner ? slotsOf(type, this.data.schedule, { busy: this.busyOf(type), length: asked.length, notice: 0, horizon: 400, places }) : this.slots(type, asked.length, undefined, places);
    const problems = bookingProblems(asked, type, free);
    if (problems.length) return { problems: problems.map((p) => ({ ...p, message: describeBookingProblem(p, this.locale, type) })) };
    let series = [makeBooking(asked, type, Date.now(), free, this.data.quote)];
    let skipped: string[] = [];
    if (asked.repeat && (owner || type.series > 1)) {
      const repeat = owner ? asked.repeat : { ...asked.repeat, count: Math.min(asked.repeat.count ?? type.series, type.series) };
      const plan = this.plan(type, asked.start, repeat, { length: asked.length, resource: asked.resource, owner });
      series = makeSeries(asked, type, plan, Date.now(), this.data.quote);
      skipped = plan.filter((p) => p.resource === null).map((p) => p.start);
    }
    this.bookings = [...this.bookings, ...series];
    this.tell(noticeOf('booked', series[0], type, this.data.organizer, { locale: this.locale, manage: '#' }));
    this.changed();
    return { booking: series[0], series, skipped };
  }

  /** Who has it, and what they answered, as the owner writes it. */
  change(id: string, details: Details): string[] | undefined {
    const at = this.bookings.findIndex((b) => b.id === id);
    if (at < 0) return [this.locale === 'es' ? 'Esa reserva ya no existe.' : 'That booking no longer exists.'];
    if (!details.name.trim()) return [describeBookingProblem({ code: 'no-name' }, this.locale)];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) return [describeBookingProblem({ code: 'bad-email' }, this.locale)];
    const before = this.bookings[at];
    const after = changeBooking(before, { name: details.name.trim(), email: details.email.trim(), answers: details.answers });
    this.bookings = this.bookings.map((x, i) => (i === at ? after : x));
    const type = this.typeOf(after.type);
    if (type) this.tell(noticeOf('changed', after, type, this.data.organizer, { locale: this.locale, before }));
    this.changed();
  }

  /** To another gap, if it is free without it. */
  move(id: string, start: string) {
    const booking = this.bookings.find((b) => b.id === id);
    const type = booking && this.typeOf(booking.type);
    if (!booking || !type) return false;
    const minutes = (Date.parse(booking.end) - Date.parse(booking.start)) / 60_000;
    const free = slotsOf(type, this.data.schedule, { busy: this.busyOf(type, (b) => b.id === id), length: minutes, notice: 0, horizon: 400 });
    const moved = moveBooking(booking, start, type, free);
    if (!moved) return false;
    this.bookings = this.bookings.map((x) => (x === booking ? moved : x));
    this.tell(noticeOf('moved', moved, type, this.data.organizer, { locale: this.locale, before: booking }));
    this.changed();
    return true;
  }

  /** Deleted: cancelled, its place left free; with the rest of its series, if asked. */
  remove(id: string, scope: 'one' | 'series' = 'one') {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) return;
    const gone = (b: Booking) => b.status !== 'cancelled' && (b.id === id || (scope === 'series' && !!booking.series && b.series === booking.series && b.start >= booking.start));
    this.bookings = this.bookings.map((b) => {
      if (!gone(b)) return b;
      const cancelled = cancelBooking(b);
      const type = this.typeOf(b.type);
      // Held and not paid, nothing was told of it, nor is of its end.
      if (type && b.status === 'confirmed') this.tell(noticeOf('cancelled', cancelled, type, this.data.organizer, { locale: this.locale }));
      return cancelled;
    });
    this.changed();
  }

  /** The kind's calendar, as the server is given it: what is taken of it now. */
  private calendarOf = (type: EventType): Calendar => ({ type, schedule: this.data.schedule, organizer: this.data.organizer, busy: () => this.busyOf(type) });

  /** Kept, or changed: a booking by its id. */
  private put(bookings: Booking[]) {
    for (const b of bookings) {
      const at = this.bookings.findIndex((x) => x.id === b.id);
      this.bookings = at < 0 ? [...this.bookings, b] : this.bookings.map((x, i) => (i === at ? b : x));
    }
    this.changed();
  }

  /** The server of booking itself, `@reboschedule/server`, answering in the page: the same routes, checks, holds, payments, codes and waitlist as on a server. Made when first asked. */
  private made?: BookingHandler;
  private get server(): BookingHandler {
    this.made ??= this.serve();
    return this.made;
  }
  private serve = () =>
    createBookingHandler({
      secret: 'the-demo-secret-of-this-page',
      base: 'https://demo.local',
      locale: this.locale,
      load: (slug) => {
        const type = this.data.types.find((t) => t.slug === slug);
        return type ? this.calendarOf(type) : null;
      },
      find: (id) => {
        const booking = this.bookings.find((b) => b.id === id);
        const type = booking && this.typeOf(booking.type);
        return booking && type ? { booking, calendar: this.calendarOf(type) } : null;
      },
      // In the page one thing happens at a time: checked again, and kept.
      keep: async (bookings, { check }) => {
        if (!(await check())) return false;
        this.put(bookings);
        return true;
      },
      onBooked: (_, { notice, series, manage }) => {
        this.put(series);
        this.tell({ ...notice, manage });
      },
      onHeld: (_, { series }) => this.put(series),
      onCancelled: (b, _, notice) => {
        // Held and not paid, nothing was told of it, nor is of its end.
        const was = this.bookings.find((x) => x.id === b.id);
        this.put([b]);
        if (was?.status === 'confirmed') this.tell(notice);
      },
      onMoved: (b, { notice, manage }) => {
        this.put([b]);
        this.tell({ ...notice, manage });
      },
      quote: (asked) => (this.data.quote ? this.data.quote(asked) : quoteOf(asked.type, asked)),
      coupons: (code) => this.data.coupons?.find((c) => c.code === code),
      ...(this.data.pays ? { payments: DEMO_PAYMENTS, hold: HOLD } : {}),
      tickets: !!this.data.tickets,
      waitlist: {
        list: (type, start) => this.waiting.filter((w) => w.type === type.id && Date.parse(w.start) === Date.parse(start)),
        onAdded: (w) => {
          this.waiting = [...this.waiting, w];
          this.changed();
        },
        onOffered: (w, offer) => {
          this.waiting = this.waiting.map((x) => (x.id === w.id ? w : x));
          this.tell(offer);
        },
      },
      page: () => (typeof location === 'undefined' ? 'https://demo.local' : location.href),
    });

  /** A ticket shown at the door: let in once, marked arrived; or refused, and why. */
  async checkIn(code: string): Promise<Entry | null> {
    const id = await this.server.readTicket(code);
    const booking = id ? this.bookings.find((b) => b.id === id) : undefined;
    if (!booking) return null;
    const entry = checkIn(booking, Date.now(), this.data.schedule.timeZone);
    if (entry.ok) this.put([entry.booking]);
    return entry;
  }

  /** A booking's entry code, as its message carries it. */
  ticketOf = (booking: Booking) => this.server.ticketOf(booking);

  /** Marked as come, or not come, by whoever looks after it; unmarked again with none. */
  attend(id: string, attended: Attendance | null) {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) return;
    const { attended: _, arrived: __, ...rest } = booking;
    this.put([attended ? markAttendance(booking, attended) : rest]);
  }

  /** A booking's own address, signed, as the server gives it. */
  addressOf = async (id: string) => {
    const booking = this.bookings.find((b) => b.id === id);
    return booking ? (await this.server.addresses(booking)).manage : null;
  };

  /** What happens by itself as time goes by: holds that ran out let go (whoever waits told), and the day before, the reminders. */
  private async sweep() {
    const now = Date.now();
    for (const b of this.bookings.filter((x) => x.status === 'held' && x.held && Date.parse(x.held) <= now)) {
      this.put([{ ...b, status: 'cancelled' }]);
      const type = this.typeOf(b.type);
      if (type) await this.server.offer(this.calendarOf(type), b.start);
    }
    // Those booked here, not those the demo begins with: a reminder the day before, with their own address.
    for (const b of remindersDue(
      this.bookings.filter((x) => !x.id.startsWith('seed')),
      now,
    )) {
      const type = this.typeOf(b.type);
      if (!type) continue;
      const reminded = { ...b, reminded: new Date(now).toISOString() };
      this.put([reminded]);
      this.tell({ ...(await this.server.reminder(reminded, this.calendarOf(type))), manage: (await this.server.addresses(reminded)).manage });
    }
  }

  /** The routes of booking, as the hooks ask them: `demo:/s/<slug>/slots`, a booking's own address, the payment's notice; answered by the server itself. */
  fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'demo://demo');
    // A moment, as a server's answer takes one: the widget shows that it waits.
    await new Promise((r) => setTimeout(r, url.pathname.endsWith('/paid') ? 700 : 160));
    await this.sweep();
    return this.server(new Request(`https://demo.local${url.pathname}${url.search}`, init));
  }) as typeof fetch;
}

/** Payments as the demos take them: a checkout of their own in the page (`Checkout`), its notice the booking paid. */
const DEMO_PAYMENTS: Payments = {
  provider: 'demo',
  checkout: async ({ booking }) => ({ id: booking.id, url: `#pay-${booking.id}` }),
  notified: async (request) => {
    const { booking } = (await request.json()) as { booking: string };
    return { booking, paid: `demo-${booking.slice(0, 8)}` };
  },
  refund: async () => {},
};
