import { type Booking, busyOfBookings, claimsOf, type Coupon, sampleEventTypes, sampleSchedule, type Waiting } from '@reboschedule/core';
import { describe, expect, it } from 'vitest';
import { type Calendar, createBookingHandler, type Payments } from '../src';

const NOW = Date.parse('2026-11-01T20:00:00Z'); // Sunday noon, in Tijuana
const base = sampleEventTypes('es')[0];

/** A cinema of one row of four seats, three shows a day; and an application that keeps all in memory. */
function setUp(over: Partial<Calendar['type']> = {}, extra: { payments?: boolean; keep?: boolean } = {}) {
  const shows = [
    { from: '16:00', to: '18:00' },
    { from: '19:00', to: '21:00' },
  ];
  const type: Calendar['type'] = {
    ...base,
    slug: 'cine',
    whole: true,
    notice: 0,
    capacity: 1,
    hours: { 0: shows, 1: shows, 2: shows, 3: shows, 4: shows, 5: shows, 6: shows },
    price: { amount: 100, currency: 'MXN', per: 'place' },
    resources: ['A1', 'A2', 'A3', 'A4'].map((id) => ({ id, name: id, image: '', values: {}, price: null })),
    ...over,
  };
  const bookings: Booking[] = [];
  const waiting: Waiting[] = [];
  const told: string[] = [];
  let clock = NOW;
  const upsert = (b: Booking) => {
    const at = bookings.findIndex((x) => x.id === b.id);
    if (at < 0) bookings.push(b);
    else bookings[at] = b;
  };
  const calendar: Calendar = { type, schedule: sampleSchedule(), organizer: { name: 'Cine', email: 'c@x.co' }, busy: () => busyOfBookings(bookings, clock) };
  const coupons: Coupon[] = [
    { code: 'DIEZ', label: '10%', percent: 10 },
    { code: 'DOSXUNO', label: '2×1', take: 2, pay: 1, days: [2] },
  ];
  const payments: Payments = {
    provider: 'test',
    checkout: async (charge) => (told.push(`charge ${charge.total.amount}`), { id: 'cs', url: 'https://pay/cs' }),
    notified: async (r) => (await r.json()) as { booking: string; paid: string },
    refund: async (_, amount) => void told.push(`refund ${amount.amount}`),
  };
  // A lock of the application: one keeps at a time, checking again inside.
  let lock = Promise.resolve();
  const handle = createBookingHandler({
    secret: 'a-secret-long-enough-for-this',
    base: 'https://example.com',
    now: () => clock,
    ...(extra.payments ? { payments, onHeld: (_: Booking, { series }: { series: Booking[] }) => series.forEach(upsert) } : {}),
    ...(extra.keep
      ? {
          keep: (made: Booking[], { check }: { check: () => Promise<boolean> }) => {
            const turn = lock.then(async () => {
              if (!(await check())) return false;
              made.forEach(upsert);
              return true;
            });
            lock = turn.then(() => undefined);
            return turn;
          },
        }
      : {}),
    coupons: (code) => coupons.find((c) => c.code === code),
    load: () => calendar,
    find: (id) => {
      const booking = bookings.find((b) => b.id === id);
      return booking ? { booking, calendar } : null;
    },
    onBooked: (b, { notice }) => (upsert(b), void told.push(notice.text)),
    onCancelled: (b, _, notice) => (upsert(b), void told.push(notice.text)),
    onMoved: (b, { notice }) => (upsert(b), void told.push(notice.subject)),
    waitlist: {
      list: (_, start) => waiting.filter((w) => w.start === start),
      onAdded: (w) => void waiting.push(w),
      onOffered: (w, offer) => (
        waiting.splice(
          waiting.findIndex((x) => x.id === w.id),
          1,
          w,
        ),
        void told.push(offer.subject)
      ),
    },
  });
  const ask = (path: string, body?: unknown) =>
    handle(new Request(`https://example.com/s${path}`, body ? { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } } : undefined));
  // Tuesday 3 November, the show at four in Tijuana.
  const show = '2026-11-04T00:00:00.000Z';
  const buy = (seats: string[], more: object = {}) => ask('/cine/book', { start: show, seats, name: 'Ana', email: 'ana@x.co', ...more });
  return { handle, ask, buy, show, bookings, waiting, told, calendar, later: (h: number) => void (clock += h * 3_600_000), type };
}

describe('codes', () => {
  it('take a percent off, or the cheapest of each two on the days they are for; refuse one that is not', async () => {
    const { buy } = setUp();
    expect((await (await buy(['A1', 'A2'], { coupon: 'diez' })).json()).booking).toMatchObject({ price: { amount: 180 }, discount: { code: 'DIEZ', amount: 20 } });
    // A Tuesday: two for one.
    expect((await (await buy(['A3', 'A4'], { coupon: 'DOSXUNO' })).json()).booking.price.amount).toBe(100);
    const bad = await buy(['A1'], { coupon: 'NADA' });
    expect(bad.status).toBe(409); // taken already, and the code too
    expect((await bad.json()).problems.map((p: { code: string }) => p.code)).toContain('bad-coupon');
  });

  it('are said by the times, when asked', async () => {
    const { ask } = setUp();
    const answer = await (await ask('/cine/slots?coupon=diez&from=2026-11-03&to=2026-11-03')).json();
    expect(answer).toMatchObject({ coupons: true, coupon: { code: 'DIEZ', percent: 10 } });
  });
});

describe('a deposit, and what is given back', () => {
  it('charges the deposit, keeps what is due, and gives back what the rules say for how long before', async () => {
    const { buy, ask, bookings, told, later } = setUp(
      {
        deposit: 30,
        refunds: [
          { hours: 48, percent: 100 },
          { hours: 24, percent: 50 },
        ],
      },
      { payments: true },
    );
    const held = await (await buy(['A1', 'A2'])).json();
    expect(told).toContain('charge 60');
    expect(held.booking.due).toEqual({ amount: 140, currency: 'MXN' });
    await ask('/paid', { booking: held.booking.id, paid: 'pi_1' });
    expect(bookings[0]).toMatchObject({ status: 'confirmed', payment: { paid: 'pi_1', amount: 60 } });
    expect(told.some((t) => t.includes('Por pagar allá') || t.includes('Left to pay there'))).toBe(true);
    // Two days and four hours before: all of it; a day and a half before: half.
    later(16);
    const manage = held.manage.replace('https://example.com/s', '');
    expect((await (await ask(manage)).json()).refund).toEqual({ amount: 30, currency: 'MXN' });
    await ask(`${manage}/cancel`, {});
    expect(told).toContain('refund 30');
    expect(bookings[0]).toMatchObject({ status: 'cancelled', refunded: { amount: 30 } });
  });
});

describe('moved by whoever booked it', () => {
  it('to another show, the same seats, until the kind lets them; not after', async () => {
    const { buy, ask, bookings, told, later } = setUp({ reschedule: 3 });
    const made = await (await buy(['A2'])).json();
    expect(made.moveUntil).toBe('2026-11-03T21:00:00.000Z');
    const manage = made.manage.replace('https://example.com/s', '');
    const moved = await ask(`${manage}/move`, { start: '2026-11-04T03:00:00.000Z' });
    expect(moved.status).toBe(200);
    expect(bookings[0]).toMatchObject({ start: '2026-11-04T03:00:00.000Z', seats: ['A2'], sequence: 1 });
    expect(told.at(-1)).toMatch(/^Cambió|^Moved/);
    later(60);
    expect((await ask(`${manage}/move`, { start: '2026-11-04T00:00:00.000Z' })).status).toBe(422);
  });

  it('never with a code to a day it is not good for', async () => {
    const { buy, ask } = setUp({ reschedule: 3 });
    const made = await (await buy(['A1', 'A2'], { coupon: 'DOSXUNO' })).json();
    const manage = made.manage.replace('https://example.com/s', '');
    // Tuesday's two for one, to Wednesday: refused; to the other show of Tuesday: moved.
    expect((await ask(`${manage}/move`, { start: '2026-11-05T00:00:00.000Z' })).status).toBe(422);
    expect((await ask(`${manage}/move`, { start: '2026-11-04T03:00:00.000Z' })).status).toBe(200);
  });

  it('never where the kind does not let them', async () => {
    const { buy, ask } = setUp();
    const made = await (await buy(['A2'])).json();
    expect(made.moveUntil).toBeNull();
    expect((await ask(`${made.manage.replace('https://example.com/s', '')}/move`, { start: '2026-11-04T03:00:00.000Z' })).status).toBe(404);
  });
});

describe('the waitlist', () => {
  it('takes whoever asks for a full show, and tells the first when a place is free', async () => {
    const { buy, ask, show, waiting, told } = setUp();
    const made = await (await buy(['A1', 'A2', 'A3', 'A4'])).json();
    const { full } = await (await ask('/cine/slots?from=2026-11-03&to=2026-11-03')).json();
    expect(full).toContain(show);
    expect((await ask('/cine/wait', { start: show, places: 2, name: 'Beto', email: 'beto@x.co' })).status).toBe(201);
    expect((await ask('/cine/wait', { start: '2026-11-04T03:00:00.000Z', name: 'C', email: 'c@x.co' })).status).toBe(409); // that one is free
    await ask(`${made.manage.replace('https://example.com/s', '')}/cancel`, {});
    expect(waiting[0].offered).toBeTruthy();
    expect(told.at(-1)).toMatch(/Se liberó|A place is free/);
  });
});

describe('kept at once', () => {
  it('never sells one seat twice, however close two come', async () => {
    const { buy, bookings } = setUp({}, { keep: true });
    const answers = await Promise.all([buy(['A1']), buy(['A1']), buy(['A1'])]);
    expect(answers.map((a) => a.status).sort()).toEqual([201, 409, 409]);
    expect(bookings).toHaveLength(1);
  });

  it('gives keys a unique index refuses twice: each seat each five minutes, each night', () => {
    const { type } = setUp();
    const a = claimsOf({ seats: ['A1', 'A2'], resource: 'A1', start: '2026-11-04T00:00:00Z', end: '2026-11-04T02:00:00Z' } as Booking, { ...type, before: 0, after: 0 })!;
    expect(a).toHaveLength(48);
    expect(a).toContain('r:A2|2026-11-04T01:55:00.000Z');
    const cabin = { ...type, stay: { unit: 'night' as const, min: 1, max: 5, checkIn: '15:00', checkOut: '12:00' } };
    expect(claimsOf({ resource: 'pino', start: '2026-11-04T23:00:00Z', end: '2026-11-06T20:00:00Z' } as Booking, cabin, 'America/Tijuana')).toEqual([
      'r:pino|night|2026-11-04',
      'r:pino|night|2026-11-05',
    ]);
    expect(claimsOf({ resource: 'general', places: 4 } as Booking, { ...type, capacity: 100 })).toBeNull();
  });
});

describe('reminders', () => {
  it('are made with the booking’s own address, to move or cancel it', async () => {
    const { buy, handle, calendar } = setUp({ reschedule: 2 });
    const { booking } = await (await buy(['A1'])).json();
    const notice = await handle.reminder(booking, calendar);
    expect(notice.kind).toBe('reminder');
    expect(notice.text).toMatch(/cambiarla o cancelarla|move it or cancel it/);
    expect(notice.text).toContain('https://example.com/s/b/');
  });
});

describe('entry codes', () => {
  it('are signed apart from the booking’s address, and read back only if this server signed them', async () => {
    const { buy, handle } = setUp();
    const { booking, manage } = await (await buy(['A1'])).json();
    const code = await handle.ticketOf(booking);
    expect(code.startsWith('RS1.')).toBe(true);
    expect(manage).not.toContain(code.split('.')[2]);
    expect(await handle.readTicket(code)).toBe(booking.id);
    expect(await handle.readTicket(`${code.slice(0, -2)}xx`)).toBeNull();
  });
});
