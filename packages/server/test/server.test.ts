import { type Booking, busyOfBookings, sampleEventTypes, sampleSchedule } from '@reboschedule/core';
import { describe, expect, it } from 'vitest';
import { type Calendar, createBookingHandler, type Payments } from '../src';

const NOW = Date.parse('2026-11-01T20:00:00Z'); // Sunday noon, in Tijuana

/** An application that keeps its bookings in memory, as one would in its database. */
function setUp() {
  const bookings: Booking[] = [];
  const told: string[] = [];
  const types = sampleEventTypes('es');
  const [, visit] = types;
  // The owner's appointments take all their time; a court, a room, a shift, only its own places.
  const owners = (id: string) => ['call', 'visit'].includes(id);
  const calendar = (type = visit): Calendar => ({
    type,
    schedule: sampleSchedule(),
    organizer: { name: 'Laura Méndez', email: 'laura@example.com' },
    busy: () =>
      bookings
        .filter((b) => b.status === 'confirmed' && (owners(type.id) ? owners(b.type) : b.type === type.id))
        .map((b) => (owners(type.id) ? { start: b.start, end: b.end } : { start: b.start, end: b.end, resource: b.resource })),
  });
  const handle = createBookingHandler({
    secret: 'a-secret-long-enough-for-this',
    base: 'https://example.com',
    locale: 'es',
    now: () => NOW,
    load: (slug) => {
      const type = types.find((t) => t.slug === slug);
      return type ? calendar(type) : null;
    },
    find: (id) => {
      const booking = bookings.find((b) => b.id === id);
      const type = booking && types.find((t) => t.id === booking.type);
      return booking && type ? { booking, calendar: calendar(type) } : null;
    },
    onBooked: (b, { manage }) => {
      bookings.push(b);
      told.push(`booked ${manage}`);
    },
    onCancelled: (b) => {
      bookings.splice(
        bookings.findIndex((x) => x.id === b.id),
        1,
        b,
      );
      told.push('cancelled');
    },
  });
  const ask = (path: string, init?: RequestInit) => handle(new Request(`https://example.com/s${path}`, init));
  const book = (body: unknown, slug = '/visita') => ask(`${slug}/book`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
  return { bookings, told, ask, book };
}

describe('the routes of booking', () => {
  it('give the times free, and the kind without where it is', async () => {
    const { ask } = setUp();
    const answer = await (await ask('/visita/slots?from=2026-11-03&to=2026-11-03')).json();
    expect(answer.timeZone).toBe('America/Tijuana');
    expect(answer.slots.length).toBeGreaterThan(0);
    // Each on the 3rd as the owner's clock says it: those of the afternoon are the 4th in UTC.
    expect(answer.slots.every((s: { start: string }) => new Date(s.start).toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' }) === '2026-11-03')).toBe(true);
    expect(answer.type.place).toEqual({ kind: 'in-person', value: '' });
    expect((await ask('/nope/slots')).status).toBe(404);
  });

  it('book a time free, tell it with its own signed address, and give where it is to who booked it', async () => {
    const { ask, book, told, bookings } = setUp();
    const { slots } = await (await ask('/visita/slots?from=2026-11-03&to=2026-11-03')).json();
    const answer = await book({ start: slots[0].start, name: 'Ana', email: 'ana@example.com', timeZone: 'Europe/Madrid', answers: { phone: '664 123 4567' } });
    expect(answer.status).toBe(201);
    const done = await answer.json();
    expect(done.booking).toMatchObject({ name: 'Ana', status: 'confirmed', timeZone: 'Europe/Madrid' });
    expect(done.type.place.value).toContain('dirección');
    expect(done.manage).toMatch(/^https:\/\/example\.com\/s\/b\/[\w-]+\.[\w-]+$/);
    expect(told).toEqual([`booked ${done.manage}`]);
    expect(bookings).toHaveLength(1);
  });

  it('never book one time twice: the second is told it is taken', async () => {
    const { ask, book } = setUp();
    const { slots } = await (await ask('/visita/slots?from=2026-11-03&to=2026-11-03')).json();
    const who = { start: slots[0].start, name: 'Ana', email: 'ana@example.com', answers: { phone: '1' } };
    expect((await book(who)).status).toBe(201);
    const again = await book({ ...who, name: 'Beto', email: 'beto@example.com' });
    expect(again.status).toBe(409);
    expect((await again.json()).problems[0]).toMatchObject({ code: 'taken', message: 'Ese horario ya no está libre: elige otro.' });
    // The time kept free around it goes too.
    const left = await (await ask('/visita/slots?from=2026-11-03&to=2026-11-03')).json();
    expect(left.slots.some((s: { start: string }) => s.start === slots[0].start)).toBe(false);
  });

  it('refuse a booking without what it needs, said in words', async () => {
    const { ask, book } = setUp();
    const { slots } = await (await ask('/visita/slots')).json();
    const answer = await book({ start: slots[0].start, name: '', email: 'x', answers: {} });
    expect(answer.status).toBe(422);
    expect((await answer.json()).problems.map((p: { code: string }) => p.code)).toEqual(['no-name', 'bad-email', 'missing-answer']);
  });

  it('give a booking by its address: to see, to save to a calendar, to cancel; never by one made up', async () => {
    const { ask, book, told } = setUp();
    const { slots } = await (await ask('/visita/slots')).json();
    const done = await (await book({ start: slots[0].start, name: 'Ana', email: 'ana@example.com', answers: { phone: '1' } })).json();
    const path = new URL(done.manage).pathname.slice(2);
    expect((await (await ask(path)).json()).booking.id).toBe(done.booking.id);
    const ics = await ask(`${path}/ics`);
    expect(ics.headers.get('content-type')).toContain('text/calendar');
    expect(await ics.text()).toContain('METHOD:REQUEST');
    const cancelled = await (await ask(`${path}/cancel`, { method: 'POST' })).json();
    expect(cancelled.booking.status).toBe('cancelled');
    expect(told.at(-1)).toBe('cancelled');
    expect(await (await ask(`${path}/ics`)).text()).toContain('METHOD:CANCEL');
    expect((await ask(`${path.slice(0, -3)}xyz`)).status).toBe(404);
    // Cancelled, its time is free again.
    const free = await (await ask('/visita/slots')).json();
    expect(free.slots[0].start).toBe(slots[0].start);
  });

  it('refuses a secret too short', () => {
    expect(() => createBookingHandler({ secret: 'short', base: 'x', load: () => null, find: () => null, onBooked: () => undefined })).toThrow();
  });

  it('give each court to whoever books, for the length they chose, until none is left', async () => {
    const { ask, book, bookings } = setUp();
    const { slots } = await (await ask('/cancha/slots?from=2026-11-03&to=2026-11-03&length=90')).json();
    const { start, end } = slots[0];
    expect(Date.parse(end) - Date.parse(start)).toBe(90 * 60_000);
    const who = { start, length: 90, name: 'Ana', email: 'ana@example.com', answers: { phone: '664' } };
    const asked = await book({ ...who, resource: 'court-3' }, '/cancha');
    expect(asked.status).toBe(201);
    expect((await asked.json()).booking).toMatchObject({ resource: 'court-3', end });
    expect((await book({ ...who, resource: 'court-3' }, '/cancha')).status).toBe(409);
    for (const next of ['court-1', 'court-2', 'court-4', 'court-5']) expect((await (await book(who, '/cancha')).json()).booking.resource).toBe(next);
    expect((await book(who, '/cancha')).status).toBe(409);
    expect(bookings).toHaveLength(5);
    // A court does not take the owner's time.
    expect((await (await ask('/visita/slots?from=2026-11-03&to=2026-11-03')).json()).slots.length).toBeGreaterThan(0);
  });

  it('price each court as it is asked, and keep on the booking what the server quoted', async () => {
    const { ask, book } = setUp();
    const any = (await (await ask('/cancha/slots?from=2026-11-03&to=2026-11-03&length=120')).json()).slots;
    expect(any[0].price).toEqual({ amount: 700, currency: 'MXN' });
    const covered = (await (await ask('/cancha/slots?from=2026-11-03&to=2026-11-03&length=120&resource=court-5')).json()).slots;
    expect(covered.every((s: { resources: string[] }) => s.resources.includes('court-5'))).toBe(true);
    expect(covered[0].price).toEqual({ amount: 900, currency: 'MXN' });
    const asked = await book(
      { start: covered[0].start, length: 120, resource: 'court-5', name: 'Ana', email: 'ana@example.com', answers: { phone: '664' }, price: { amount: 1, currency: 'MXN' } },
      '/cancha',
    );
    expect((await asked.json()).booking.price).toEqual({ amount: 900, currency: 'MXN' });
  });

  it('take two guards to a shift, and no third', async () => {
    const { ask, book } = setUp();
    const { slots } = await (await ask('/guardia/slots?from=2026-11-03&to=2026-11-03')).json();
    expect(slots[0].free).toBe(2);
    const who = (name: string) => ({ start: slots[0].start, name, email: `${name}@example.com` });
    expect((await book(who('ana'), '/guardia')).status).toBe(201);
    expect((await (await ask('/guardia/slots?from=2026-11-03&to=2026-11-03')).json()).slots[0].free).toBe(1);
    expect((await book(who('beto'), '/guardia')).status).toBe(201);
    expect((await book(who('carla'), '/guardia')).status).toBe(409);
  });
});

describe('when the application fails', () => {
  it('answers 500, and goes on', async () => {
    const handle = createBookingHandler({
      secret: 'a-secret-long-enough-for-this',
      base: 'https://example.com',
      load: () => {
        throw new Error('the database is away');
      },
      find: () => null,
      onBooked: () => {},
    });
    const quiet = console.error;
    console.error = () => {};
    const answer = await handle(new Request('https://example.com/s/visita/slots'));
    console.error = quiet;
    expect(answer.status).toBe(500);
    expect((await handle(new Request('https://example.com/s/b/nope'))).status).toBe(404);
  });
});

describe('every week, and what is told', () => {
  it('books a series as far as the kind lets, says the times not free, and hands the messages to send', async () => {
    const shift = { ...sampleEventTypes('es').find((t) => t.id === 'shift')!, capacity: 1, series: 3 };
    const bookings: Booking[] = [];
    const told: { subject: string; series: number; method: string }[] = [];
    const calendar: Calendar = {
      type: shift,
      schedule: sampleSchedule(),
      organizer: { name: 'Inmobiliaria Rebo', email: 'o@x.co' },
      busy: () => bookings.filter((b) => b.status === 'confirmed').map((b) => ({ start: b.start, end: b.end, resource: b.resource })),
    };
    const handle = createBookingHandler({
      secret: 'a-secret-long-enough-for-this',
      base: 'https://example.com',
      locale: 'es',
      now: () => NOW,
      load: () => calendar,
      find: (id) => {
        const booking = bookings.find((b) => b.id === id);
        return booking ? { booking, calendar } : null;
      },
      onBooked: (_, { series, notice }) => {
        bookings.push(...series);
        told.push({ subject: notice.subject, series: series.length, method: notice.method });
      },
      onCancelled: (b, _, notice) => {
        bookings.splice(
          bookings.findIndex((x) => x.id === b.id),
          1,
          b,
        );
        told.push({ subject: notice.subject, series: 0, method: notice.method });
      },
    });
    const ask = (path: string, init?: RequestInit) => handle(new Request(`https://example.com/s${path}`, init));
    const { slots } = await (await ask('/guardia/slots?from=2026-11-03&to=2026-11-03')).json();
    // Someone has the second Tuesday already.
    bookings.push({
      id: 'x',
      type: 'shift',
      resource: '',
      start: '2026-11-10T17:00:00.000Z',
      end: '2026-11-10T22:00:00.000Z',
      name: 'B',
      email: 'b@x.co',
      timeZone: 'America/Tijuana',
      answers: {},
      status: 'confirmed',
      created: '',
    });
    const answer = await ask('/guardia/book', {
      method: 'POST',
      body: JSON.stringify({ start: slots[0].start, name: 'Ana', email: 'ana@x.co', repeat: { every: 1, count: 10 } }),
    });
    expect(answer.status).toBe(201);
    const body = await answer.json();
    // Three at most, as the kind says; the second Tuesday is not free.
    expect(body.series.map((b: Booking) => b.start)).toEqual(['2026-11-03T17:00:00.000Z', '2026-11-17T17:00:00.000Z']);
    expect(body.skipped).toEqual(['2026-11-10T17:00:00.000Z']);
    expect(new Set(body.series.map((b: Booking) => b.series)).size).toBe(1);
    expect(told[0]).toMatchObject({ series: 2, method: 'REQUEST' });
    expect(told[0].subject).toMatch(/^Confirmada: Guardia en oficina · martes, 3 de noviembre/);
    // Cancelled by whoever booked it, its message says so.
    await ask(`${body.manage.replace('https://example.com/s', '')}/cancel`, { method: 'POST' });
    expect(told[1]).toMatchObject({ method: 'CANCEL' });
    expect(told[1].subject).toMatch(/^Cancelada: /);
  });
});

describe('stays and tickets', () => {
  const base = sampleEventTypes('es')[0];
  const make = (type: Calendar['type'], schedule = sampleSchedule()) => {
    const bookings: Booking[] = [];
    const calendar: Calendar = { type, schedule, organizer: { name: 'O', email: 'o@x.co' }, busy: () => busyOfBookings(bookings) };
    const handle = createBookingHandler({
      secret: 'a-secret-long-enough-for-this',
      base: 'https://example.com',
      now: () => NOW,
      load: () => calendar,
      find: () => null,
      onBooked: (_, { series }) => void bookings.push(...series),
    });
    const ask = (path: string, body?: unknown) =>
      handle(new Request(`https://example.com/s/x${path}`, body ? { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } } : undefined));
    return { ask, bookings };
  };

  it('give the nights free of each cabin, and book a stay of them', async () => {
    const cabin = {
      ...base,
      stay: { unit: 'night' as const, min: 2, max: 5, checkIn: '15:00', checkOut: '12:00' },
      notice: 0,
      price: { amount: 1000, currency: 'MXN', per: 'night' as const },
      resources: [{ id: 'pino', name: 'Pino', image: '', values: {}, price: null }],
    };
    const { ask, bookings } = make(cabin);
    const { nights } = await (await ask('/stays?from=2026-11-04&to=2026-11-06')).json();
    expect(nights.map((n: { day: string }) => n.day)).toEqual(['2026-11-04', '2026-11-05', '2026-11-06']);
    const made = await ask('/book', { arrive: '2026-11-04', leave: '2026-11-06', name: 'Ana', email: 'a@x.co' });
    expect(made.status).toBe(201);
    expect((await made.json()).booking.price).toEqual({ amount: 2000, currency: 'MXN' });
    expect((await ask('/book', { arrive: '2026-11-05', leave: '2026-11-07', name: 'B', email: 'b@x.co' })).status).toBe(409);
    expect((await ask('/book', { arrive: '2026-11-08', leave: '2026-11-09', name: 'B', email: 'b@x.co' })).status).toBe(422);
    expect(bookings).toHaveLength(1);
  });

  it('sell places of a zone, as many as are left', async () => {
    const concert = {
      ...base,
      whole: true,
      notice: 0,
      hours: null,
      price: { amount: 500, currency: 'MXN', per: 'place' as const },
      resources: [{ id: 'general', name: 'General', image: '', values: {}, price: null, capacity: 5 }],
    };
    const schedule = { ...sampleSchedule(), dates: { '2026-11-07': [{ from: '20:00', to: '23:00' }] } };
    const { ask } = make(concert, schedule);
    const [show] = (await (await ask('/slots?from=2026-11-07&to=2026-11-07&places=4')).json()).slots;
    expect(show.price).toEqual({ amount: 2000, currency: 'MXN' });
    expect((await ask('/book', { start: show.start, places: 4, name: 'A', email: 'a@x.co' })).status).toBe(201);
    expect((await (await ask('/slots?from=2026-11-07&to=2026-11-07&places=2')).json()).slots).toEqual([]);
    expect((await ask('/book', { start: show.start, places: 2, name: 'B', email: 'b@x.co' })).status).toBe(409);
    expect((await ask('/book', { start: show.start, places: 1, name: 'B', email: 'b@x.co' })).status).toBe(201);
  });
});

describe('held while it is paid for', () => {
  const base = sampleEventTypes('es')[0];
  const cabin = {
    ...base,
    stay: { unit: 'night' as const, min: 1, max: 5, checkIn: '15:00', checkOut: '12:00' },
    notice: 0,
    price: { amount: 1000, currency: 'MXN', per: 'night' as const },
    resources: [{ id: 'pino', name: 'Pino', image: '', values: {}, price: null }],
  };
  const make = () => {
    const bookings: Booking[] = [];
    const told: string[] = [];
    let clock = NOW;
    const keep = (b: Booking) => {
      const at = bookings.findIndex((x) => x.id === b.id);
      if (at < 0) bookings.push(b);
      else bookings[at] = b;
    };
    const calendar: Calendar = { type: cabin, schedule: sampleSchedule(), organizer: { name: 'O', email: 'o@x.co' }, busy: () => busyOfBookings(bookings, clock) };
    const payments: Payments = {
      provider: 'test',
      checkout: async (charge) => {
        told.push(`checkout ${charge.total.amount} ${charge.notify}`);
        return { id: 'cs_1', url: 'https://pay.example/cs_1' };
      },
      notified: async (request) => (await request.json()) as { booking: string; paid: string },
      refund: async (b) => void told.push(`refund ${b.payment?.paid}`),
    };
    const handle = createBookingHandler({
      secret: 'a-secret-long-enough-for-this',
      base: 'https://example.com',
      now: () => clock,
      payments,
      load: () => calendar,
      find: (id) => {
        const booking = bookings.find((b) => b.id === id);
        return booking ? { booking, calendar } : null;
      },
      onHeld: (b) => keep(b),
      onBooked: (b) => (keep(b), void told.push('booked')),
      onCancelled: (b) => (keep(b), void told.push('cancelled')),
    });
    const post = (path: string, body: unknown) => handle(new Request(`https://example.com/s${path}`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }));
    const stay = (name: string) => post('/x/book', { arrive: '2026-11-04', leave: '2026-11-06', name, email: `${name}@x.co` });
    return { bookings, told, post, stay, later: (minutes: number) => void (clock += minutes * 60_000) };
  };

  it('needs `onHeld` to take payments', () => {
    expect(() => createBookingHandler({ secret: 'a-secret-long-enough-for-this', base: 'https://x.co', payments: {} as Payments, load: () => null, find: () => null, onBooked: () => {} })).toThrow(
      /onHeld/,
    );
  });

  it('holds the place while it is paid for, and confirms it when the provider says so', async () => {
    const { bookings, told, post, stay } = make();
    const held = await stay('ana');
    expect(held.status).toBe(202);
    const body = await held.json();
    expect(body.pay).toBe('https://pay.example/cs_1');
    expect(body.booking).toMatchObject({ status: 'held', payment: { provider: 'test', id: 'cs_1' } });
    expect(told[0]).toBe('checkout 2000 https://example.com/s/paid');
    // Held, nobody else takes it.
    expect((await stay('beto')).status).toBe(409);
    expect(await (await post('/paid', { booking: body.booking.id, paid: 'pi_1' })).json()).toEqual({ status: 'confirmed' });
    expect(bookings[0]).toMatchObject({ status: 'confirmed', payment: { paid: 'pi_1' } });
    expect(bookings[0].held).toBeUndefined();
    expect(told).toContain('booked');
  });

  it('frees the place when the hold runs out; paid after, confirmed if still free, refunded if taken', async () => {
    const { bookings, told, post, stay, later } = make();
    const first = (await (await stay('ana')).json()).booking;
    later(11);
    const second = (await (await stay('beto')).json()).booking;
    expect(second.status).toBe('held');
    expect(await (await post('/paid', { booking: first.id, paid: 'pi_late' })).json()).toEqual({ status: 'refunded' });
    expect(told).toContain('refund pi_late');
    expect(bookings.find((b) => b.id === first.id)?.status).toBe('cancelled');
    later(11);
    // Nobody took Beto's place after his ran out: his payment, late, still books it.
    expect(await (await post('/paid', { booking: second.id, paid: 'pi_2' })).json()).toEqual({ status: 'confirmed' });
  });

  it('books with no hold what costs nothing', async () => {
    const { post } = make();
    cabin.price.amount = 0;
    try {
      expect((await post('/x/book', { arrive: '2026-11-04', leave: '2026-11-05', name: 'a', email: 'a@x.co' })).status).toBe(201);
    } finally {
      cabin.price.amount = 1000;
    }
  });
});
