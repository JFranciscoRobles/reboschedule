// @vitest-environment happy-dom
import { type Booking, type EventType, sampleEventTypes, sampleSchedule, type Schedule, type Slot, slotsOf } from '@reboschedule/core';
import { createBookingHandler } from '@reboschedule/server';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import {
  BookingCalendar,
  BookingDay,
  type BookingDetails,
  BookingList,
  BookingPanel,
  type BookingState,
  type DayState,
  type MonthState,
  useBooking,
  useDay,
  useMonth,
  BookingWidget,
  EventTypeEditor,
  ScheduleEditor,
} from '../src';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
});
async function mount(element: ReturnType<typeof createElement>) {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(element));
  return host;
}
// Several turns of the loop: the server signs with Web Crypto, which answers in more than one.
const settle = () =>
  act(async () => {
    for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0));
  });
const click = (el: Element | null | undefined) => act(async () => (el as HTMLElement).click());
const type = async (el: Element | null | undefined, value: string) => {
  const input = el as HTMLInputElement;
  const proto = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(input, value);
  await act(async () => void input.dispatchEvent(new Event('input', { bubbles: true })));
};

/** The real server, in memory: what the widget asks goes to its handler. */
function server(id = 'visit') {
  const bookings: Booking[] = [];
  const kind = sampleEventTypes('es').find((t) => t.id === id)!;
  const calendar = () => ({
    type: kind,
    schedule: sampleSchedule(),
    organizer: { name: 'Laura Méndez', email: 'laura@example.com' },
    busy: () => bookings.map((b) => ({ start: b.start, end: b.end, resource: kind.resources.length || kind.capacity > 1 ? b.resource : undefined })),
  });
  const handle = createBookingHandler({
    secret: 'a-secret-long-enough-for-this',
    base: 'https://example.com',
    locale: 'es',
    now: () => Date.parse('2026-11-01T20:00:00Z'),
    load: () => calendar(),
    find: (id) => {
      const booking = bookings.find((b) => b.id === id);
      return booking ? { booking, calendar: calendar() } : null;
    },
    onBooked: (b) => void bookings.push(b),
  });
  const fetch = ((url: string, init?: RequestInit) => handle(new Request(new URL(url, 'https://example.com'), init))) as typeof globalThis.fetch;
  return { bookings, fetch };
}

describe('booking', () => {
  it('shows the days with times, the times of a day in one’s own zone, and books one', async () => {
    const { fetch, bookings } = server();
    const booked: string[] = [];
    const h = await mount(createElement(BookingWidget, { endpoint: 'https://example.com/s/visita', locale: 'es', timeZone: 'America/Tijuana', fetch, onBooked: (b) => booked.push(b.manage) }));
    await settle();
    expect(h.querySelector('.rsb-head h2')?.textContent).toBe('Visita a una propiedad');
    const open = [...h.querySelectorAll<HTMLButtonElement>('.rsb-day')].filter((d) => !d.disabled);
    expect(open.length).toBeGreaterThan(5);
    await click(open[0]);
    const times = h.querySelectorAll('.rsb-time');
    expect(times.length).toBeGreaterThan(0);
    await click(times[0]);
    const inputs = h.querySelectorAll('.rsb-form input');
    await type(inputs[0], 'Ana López');
    await type(inputs[1], 'ana@example.com');
    await type(inputs[2], '664 123 4567');
    await act(async () => void h.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await settle();
    expect(h.querySelector('.rsb-confirm h3')?.textContent).toBe('Reservado');
    expect(h.querySelector('.rsb-where')?.textContent).toContain('dirección');
    expect(h.querySelector<HTMLAnchorElement>('a[href*="calendar.google.com"]')).toBeTruthy();
    expect(h.querySelector<HTMLAnchorElement>('a[href$="/ics"]')).toBeTruthy();
    expect(bookings).toHaveLength(1);
    expect(booked).toHaveLength(1);
  });

  it('books the court chosen first, for the length chosen, and says how many are left of any', async () => {
    const { fetch, bookings } = server('court');
    const h = await mount(createElement(BookingWidget, { endpoint: 'https://example.com/s/cancha', locale: 'es', timeZone: 'America/Tijuana', fetch }));
    await settle();
    const courts = [...h.querySelectorAll<HTMLButtonElement>('.rsb-which .rsb-option b')].map((b) => b.textContent);
    expect(courts).toEqual(['Cualquiera libre', 'Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4', 'Cancha 5']);
    // Each with its picture and what it says of itself.
    const fourth = [...h.querySelectorAll('.rsb-option')][4];
    expect(fourth.querySelector('img')).toBeTruthy();
    expect([...fourth.querySelectorAll('small')].map((x) => x.textContent)).toEqual(['Cristal', 'Techada', '$450 MXN / h']);
    await click([...h.querySelectorAll('.rsb-day')].find((d) => !(d as HTMLButtonElement).disabled));
    expect(h.querySelector('.rsb-time')?.textContent).toContain('quedan 5');
    await click([...h.querySelectorAll('.rsb-option')].find((o) => o.textContent?.startsWith('Cancha 4')));
    const lengths = [...h.querySelectorAll<HTMLButtonElement>('.rsb-lengths .rsb-chip')];
    expect(lengths.map((b) => b.textContent)).toEqual(['1 h', '1 h 30 min', '2 h']);
    await click(lengths[2]);
    await settle();
    await click([...h.querySelectorAll<HTMLButtonElement>('.rsb-day')].find((d) => !d.disabled));
    const first = h.querySelector('.rsb-time');
    // One court: no places to count.
    expect(first?.querySelector('small')).toBeNull();
    await click(first);
    expect(h.querySelector('.rsb-chosen')?.textContent).toContain('· Cancha 4');
    const inputs = h.querySelectorAll('.rsb-form input');
    await type(inputs[0], 'Ana López');
    await type(inputs[1], 'ana@example.com');
    await type(inputs[2], '664 123 4567');
    await act(async () => void h.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await settle();
    expect(bookings).toHaveLength(1);
    expect(bookings[0].resource).toBe('court-4');
    expect(Date.parse(bookings[0].end) - Date.parse(bookings[0].start)).toBe(120 * 60_000);
    expect(h.querySelector('.rsb-booked-thing')?.textContent).toBe('Cancha 4');
    expect(h.querySelector<HTMLImageElement>('.rsb-booked-thing img')?.src).toMatch(/^data:image\/svg\+xml,/);
  });

  it('says a time was taken a moment ago, and gives the times as they are now', async () => {
    const { fetch, bookings } = server();
    const h = await mount(createElement(BookingWidget, { endpoint: 'https://example.com/s/visita', locale: 'es', timeZone: 'America/Tijuana', fetch }));
    await settle();
    await click([...h.querySelectorAll<HTMLButtonElement>('.rsb-day')].find((d) => !d.disabled));
    await click(h.querySelector('.rsb-time'));
    // Someone else takes it first.
    const start = (await (await fetch('https://example.com/s/visita/slots')).json()).slots[0].start;
    bookings.push({
      id: 'x',
      type: 'visit',
      resource: '',
      start,
      end: new Date(Date.parse(start) + 3_600_000).toISOString(),
      name: 'B',
      email: 'b@x.co',
      timeZone: 'UTC',
      answers: {},
      status: 'confirmed',
      created: start,
    });
    const inputs = h.querySelectorAll('.rsb-form input');
    await type(inputs[0], 'Ana');
    await type(inputs[1], 'ana@example.com');
    await type(inputs[2], '1');
    await act(async () => void h.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await settle();
    expect(h.querySelector('.rsb-problems')?.textContent).toContain('ya no está libre');
    expect(h.querySelector('.rsb-form')).toBeNull();
  });
});

describe('the editors', () => {
  it('turns a day on and off, and copies a day’s hours to every day open', async () => {
    const changes: Schedule[] = [];
    let current = { ...sampleSchedule(), weekly: { ...sampleSchedule().weekly, 2: [{ from: '10:00', to: '12:00' }] } } as Schedule;
    const h = await mount(createElement(ScheduleEditor, { schedule: current, locale: 'es', onChange: (s) => changes.push((current = s)) }));
    await click(h.querySelectorAll('.rse-switch input')[6]); // Sunday on
    expect(changes.at(-1)?.weekly[0]).toEqual([{ from: '09:00', to: '17:00' }]);
    await click([...h.querySelectorAll('.rse-link')].find((b) => b.textContent === 'Copiar a todos los días'));
    expect(changes.at(-1)?.weekly[2]).toEqual(changes.at(-1)?.weekly[1]);
    expect(changes.at(-1)?.weekly[0]).toEqual([]);
  });

  it('chooses how long a kind lasts, the time kept free, where, and what is asked', async () => {
    const changes: EventType[] = [];
    const h = await mount(createElement(EventTypeEditor, { type: sampleEventTypes('es')[0], locale: 'es', onChange: (t) => changes.push(t) }));
    await click([...h.querySelectorAll('.rse-chip')].find((b) => b.textContent === '1 h'));
    expect(changes.at(-1)).toMatchObject({ duration: 60, increment: 60 });
    await click([...h.querySelectorAll('.rse-chip')].find((b) => b.textContent === 'En persona'));
    expect(changes.at(-1)?.place.kind).toBe('in-person');
    await click([...h.querySelectorAll('.rse-action')].find((b) => b.textContent?.includes('Agregar una pregunta')));
    expect(changes.at(-1)?.questions).toHaveLength(2);
  });

  it('lists what is booked: the coming ones first, then the past and cancelled', async () => {
    const types = sampleEventTypes('es');
    const b = (id: string, start: string, status: 'confirmed' | 'cancelled' = 'confirmed'): Booking => ({
      id,
      type: 'call',
      resource: '',
      start,
      end: start.replace('T17', 'T18'),
      name: id,
      email: `${id}@x.co`,
      timeZone: 'UTC',
      answers: {},
      status,
      created: start,
    });
    const h = await mount(
      createElement(BookingList, {
        bookings: [b('later', '2026-11-05T17:00:00Z'), b('soon', '2026-11-03T17:00:00Z'), b('gone', '2026-11-04T17:00:00Z', 'cancelled')],
        types,
        locale: 'es',
        timeZone: 'America/Tijuana',
        now: Date.parse('2026-11-01T00:00:00Z'),
      }),
    );
    expect([...h.querySelectorAll('.rse-booking b')].map((x) => x.textContent)).toEqual(['soon', 'later', 'gone']);
    expect(h.querySelector('.rse-booking[data-cancelled] .rse-tag')?.textContent).toBe('Cancelada');
  });
});

describe('the calendar', () => {
  const types = sampleEventTypes('es');
  const schedule = sampleSchedule();
  const now = Date.parse('2026-11-04T20:00:00Z'); // Wednesday noon, in Tijuana
  const at = (id: string, name: string, start: string, end: string, type = 'shift'): Booking => ({
    id,
    type,
    resource: '',
    start,
    end,
    name,
    email: `${id}@x.co`,
    timeZone: 'America/Tijuana',
    answers: {},
    status: 'confirmed',
    created: start,
  });
  // Thursday the 5th: two in the morning (9 to 14), one in the afternoon (14 to 19).
  const shifts = [
    at('a', 'Ana', '2026-11-05T17:00:00.000Z', '2026-11-05T22:00:00.000Z'),
    at('b', 'Beto', '2026-11-05T17:00:00.000Z', '2026-11-05T22:00:00.000Z'),
    at('c', 'Carla', '2026-11-05T22:00:00.000Z', '2026-11-06T03:00:00.000Z'),
  ];

  it('shows each day its shifts, who has the first turn and who the second, and the places free', async () => {
    const h = await mount(createElement(BookingCalendar, { bookings: shifts, types, schedule, type: 'shift', locale: 'es', now }));
    expect(h.querySelector('h2')?.textContent).toBe('Noviembre de 2026');
    const day = [...h.querySelectorAll('.rsc-day')].find((d) => d.querySelector('.rsc-date')?.textContent?.endsWith('5'))!;
    const turns = [...day.querySelectorAll('.rsc-turn')].map((t) => [...t.children].map((c) => c.textContent));
    expect(turns).toEqual([
      ['Turno 1 9:00', 'Ana', 'Beto'],
      ['Turno 2 14:00', 'Carla', '1 libre'],
    ]);
    // Gone by and nobody had them: nothing.
    const before = [...h.querySelectorAll('.rsc-day')].find((d) => d.querySelector('.rsc-date')?.textContent?.endsWith(' 3'))!;
    expect(before.querySelectorAll('.rsc-turn')).toHaveLength(0);
  });

  it('shows every kind as times and names, the rest of a full day when asked', async () => {
    const many = [...shifts, at('d', 'Diego', '2026-11-05T23:00:00.000Z', '2026-11-05T23:30:00.000Z', 'call')];
    const seen: string[] = [];
    const h = await mount(createElement(BookingCalendar, { bookings: many, types, schedule, locale: 'es', now, onSelect: (b: Booking) => seen.push(b.name) }));
    const day = [...h.querySelectorAll('.rsc-day')].find((d) => d.querySelector('.rsc-date')?.textContent?.endsWith('5'))!;
    expect([...day.querySelectorAll('.rsc-name')].map((n) => n.textContent)).toEqual(['Ana', 'Beto', 'Carla']);
    await click(day.querySelector('.rsc-more'));
    expect([...day.querySelectorAll('.rsc-name')].map((n) => n.textContent)).toEqual(['Ana', 'Beto', 'Carla', 'Diego']);
    await click([...day.querySelectorAll('.rsc-name')].at(-1));
    expect(seen).toEqual(['Diego']);
  });

  it('shows the gaps, each place free of a shift, and books the one chosen', async () => {
    const shift = types.find((t) => t.id === 'shift')!;
    const slots = slotsOf(shift, schedule, { now, busy: shifts.map((b) => ({ start: b.start, end: b.end, resource: '' })) });
    const picked: Slot[] = [];
    const h = await mount(createElement(BookingCalendar, { bookings: shifts, types, schedule, type: 'shift', locale: 'es', now, slots, onPick: (g: Slot) => picked.push(g) }));
    const day = [...h.querySelectorAll('.rsc-day')].find((d) => d.querySelector('.rsc-date')?.textContent?.endsWith('5'))!;
    const turns = [...day.querySelectorAll('.rsc-turn')].map((t) => [...t.children].map((c) => c.textContent));
    expect(turns).toEqual([
      ['Turno 1 9:00', 'Ana', 'Beto'],
      ['Turno 2 14:00', 'Carla', '+ Libre'],
    ]);
    await click(day.querySelector('.rsc-gap'));
    expect(picked.map((g) => g.start)).toEqual(['2026-11-05T22:00:00.000Z']);
  });

  it('shows each day how many times it has free, and those of the day chosen below', async () => {
    const court = types.find((t) => t.id === 'court')!;
    const slots = slotsOf(court, schedule, { now, from: '2026-11-05', to: '2026-11-05' });
    const picked: Slot[] = [];
    const h = await mount(createElement(BookingCalendar, { bookings: [], types, schedule, type: 'court', locale: 'es', now, slots, onPick: (g: Slot) => picked.push(g) }));
    const day = [...h.querySelectorAll('.rsc-day')].find((d) => d.querySelector('.rsc-date')?.textContent?.endsWith('5'))!;
    expect(day.querySelector('.rsc-gap')?.textContent).toBe(`${slots.length} huecos`);
    await click(day.querySelector('.rsc-gap'));
    const times = [...h.querySelectorAll('.rsc-panel .rsc-time')];
    expect(times).toHaveLength(slots.length);
    expect(times[0].textContent).toBe('7:00quedan 5');
    await click(times[0]);
    expect(picked[0].start).toBe(slots[0].start);
  });
});

describe('the panel of a booking', () => {
  const shift = sampleEventTypes('es').find((t) => t.id === 'shift')!;
  const booking: Booking = {
    id: 'a',
    type: 'shift',
    resource: '',
    start: '2026-11-05T17:00:00.000Z',
    end: '2026-11-05T22:00:00.000Z',
    name: 'Ana',
    email: 'ana@x.co',
    timeZone: 'America/Tijuana',
    answers: {},
    status: 'confirmed',
    created: '2026-11-01T00:00:00.000Z',
  };
  const submit = (h: HTMLElement) => act(async () => void h.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

  it('gives a gap to someone, and says what went wrong', async () => {
    const saved: BookingDetails[] = [];
    const h = await mount(
      createElement(BookingPanel, {
        type: shift,
        slot: { start: booking.start, end: booking.end, free: 1 },
        timeZone: 'America/Tijuana',
        locale: 'es',
        onSave: (d: BookingDetails) => (saved.push(d), saved.length === 1 ? ['Ese hueco ya no está libre.'] : undefined),
        onClose: () => {},
      }),
    );
    expect(h.querySelector('.rsp-what span')?.textContent).toBe('Jueves, 5 de noviembre, 9:00 – 14:00');
    const [name, email] = h.querySelectorAll('input');
    await type(name, 'Hugo');
    await type(email, 'hugo@x.co');
    expect(h.querySelector('button[type="submit"]')?.textContent).toBe('Asignar');
    await submit(h);
    expect(h.querySelector('[role="alert"]')?.textContent).toBe('Ese hueco ya no está libre.');
    await submit(h);
    expect(saved.at(-1)).toMatchObject({ name: 'Hugo', email: 'hugo@x.co' });
    expect(h.querySelector('[role="alert"]')).toBeNull();
  });

  it('changes who has it, moves it, and deletes it once it is said so', async () => {
    const told: string[] = [];
    const props = {
      type: shift,
      booking,
      timeZone: 'America/Tijuana',
      locale: 'es' as const,
      onSave: (d: BookingDetails) => void told.push(`save ${d.name}`),
      onMove: (m: boolean) => void told.push(`move ${m}`),
      onDelete: () => void told.push('delete'),
      onClose: () => {},
    };
    const h = await mount(createElement(BookingPanel, props));
    expect(h.querySelector<HTMLInputElement>('input')?.value).toBe('Ana');
    await type(h.querySelector('input'), 'Ana María');
    await submit(h);
    const buttons = () => [...h.querySelectorAll('button')];
    await click(buttons().find((b) => b.textContent === 'Mover'));
    await click(buttons().find((b) => b.textContent === 'Eliminar'));
    expect(h.querySelector('[role="alertdialog"]')?.textContent).toContain('¿Eliminar la reserva de Ana?');
    await click(buttons().find((b) => b.textContent === 'Sí, eliminar'));
    expect(told).toEqual(['save Ana María', 'move true', 'delete']);
    // Being moved, it says where to choose, and nothing else may be done.
    await act(async () => root!.render(createElement(BookingPanel, { ...props, moving: true })));
    expect(h.querySelector('[role="status"]')?.textContent).toBe('Elige en el calendario el hueco nuevo.');
    expect(buttons().map((b) => b.textContent)).toEqual(['×', 'No, déjala']);
  });
});

describe('the day', () => {
  const types = sampleEventTypes('es');
  const schedule = sampleSchedule();
  const court = types.find((t) => t.id === 'court')!;
  const now = Date.parse('2026-11-04T20:00:00Z'); // Wednesday noon, in Tijuana
  // Thursday the 5th, Court 2, from 9:00 to 10:30.
  const booked: Booking = {
    id: 'a',
    type: 'court',
    resource: 'court-2',
    start: '2026-11-05T17:00:00.000Z',
    end: '2026-11-05T18:30:00.000Z',
    name: 'Ana',
    email: 'ana@x.co',
    timeZone: 'America/Tijuana',
    answers: {},
    status: 'confirmed',
    created: '2026-11-01T00:00:00.000Z',
  };

  it('shows a column for each court, each booking as long as it is, and gives away the gap of a court', async () => {
    const slots = slotsOf(court, schedule, { now, from: '2026-11-05', to: '2026-11-05', busy: [{ start: booked.start, end: booked.end, resource: 'court-2' }] });
    const picked: Slot[] = [];
    const h = await mount(createElement(BookingDay, { bookings: [booked], types, schedule, type: 'court', day: '2026-11-05', slots, locale: 'es', now, onPick: (g: Slot) => picked.push(g) }));
    expect(h.querySelector('h2')?.textContent).toBe('Jueves, 5 de noviembre');
    expect([...h.querySelectorAll('.rsd-column')].map((c) => c.textContent)).toEqual(['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4', 'Cancha 5']);
    const block = h.querySelector<HTMLElement>('.rsd-block')!;
    expect(block.textContent).toBe('Ana9:00 – 10:30');
    // Court 2, from the row of 9:00 (the fifth, opening at 7:00), three rows of half an hour.
    expect(block.style.gridColumn).toBe('3');
    expect(block.style.gridRow).toBe('6 / span 3');
    // The gap of Court 2 at 9:00 is not there; that of Court 3 is, and gives that court.
    const gap = [...h.querySelectorAll('.rsd-gap')].find((g) => g.getAttribute('aria-label') === 'Libre · Cancha 3 9:00')!;
    expect([...h.querySelectorAll('.rsd-gap')].some((g) => g.getAttribute('aria-label') === 'Libre · Cancha 2 9:00')).toBe(false);
    await click(gap);
    expect(picked[0]).toMatchObject({ start: booked.start, resources: ['court-3'] });
  });
});

describe('headless', () => {
  it('books with a widget of one’s own, on useBooking alone', async () => {
    const { fetch, bookings } = server('court');
    let b!: BookingState;
    // A widget of one's own: nothing of the package's but the state.
    function Mine() {
      b = useBooking({ endpoint: 'https://example.com/s/cancha', timeZone: 'America/Tijuana', fetch });
      return createElement('p', null, b.status);
    }
    const h = await mount(createElement(Mine));
    await settle();
    expect(h.textContent).toBe('ready');
    expect(b.lengths).toEqual([60, 90, 120]);
    expect(b.type?.resources).toHaveLength(5);
    await act(async () => b.setResource('court-5'));
    await act(async () => b.setLength(120));
    await settle();
    expect(b.times.every((s) => s.resources?.includes('court-5'))).toBe(true);
    expect(b.times[0].price).toEqual({ amount: 900, currency: 'MXN' });
    expect(b.day).toBe([...b.days.keys()][0]);
    await act(async () => b.choose(b.times[0]));
    let made: Awaited<ReturnType<BookingState['book']>> = null;
    await act(async () => {
      made = await b.book({ name: 'Ana', email: 'ana@x.co', answers: { phone: '664' } });
    });
    expect(made).not.toBeNull();
    expect(bookings[0]).toMatchObject({ resource: 'court-5', price: { amount: 900, currency: 'MXN' } });
    expect(b.booked?.booking.id).toBe(bookings[0].id);
    // The same time again: taken, said so, and the times asked for again.
    await act(async () => b.again());
    await settle();
    await act(async () => b.choose({ start: bookings[0].start, end: bookings[0].end, free: 1 }));
    await act(async () => void (await b.book({ name: 'Beto', email: 'b@x.co', answers: { phone: '1' } })));
    expect(b.problems.map((p) => p.code)).toEqual(['taken']);
    expect(b.slot).toBeNull();
    // The server failing with nothing said: that it could not be.
    const failing = (async () => new Response('{"error":"failed"}', { status: 500 })) as unknown as typeof globalThis.fetch;
    let f!: BookingState;
    function Failing() {
      f = useBooking({ endpoint: 'https://example.com/s/cancha', fetch: failing });
      return null;
    }
    await mount(createElement(Failing));
    await settle();
    expect(f.status).toBe('failed');
  });

  it('works out the month and the day, for a calendar of one’s own', async () => {
    const types = sampleEventTypes('es');
    const schedule = sampleSchedule();
    const now = Date.parse('2026-11-04T20:00:00Z');
    const shift = types.find((t) => t.id === 'shift')!;
    const ana: Booking = {
      id: 'a',
      type: 'shift',
      resource: '',
      start: '2026-11-05T17:00:00.000Z',
      end: '2026-11-05T22:00:00.000Z',
      name: 'Ana',
      email: 'a@x.co',
      timeZone: 'America/Tijuana',
      answers: {},
      status: 'confirmed',
      created: '',
    };
    const slots = slotsOf(shift, schedule, { now, busy: [{ start: ana.start, end: ana.end, resource: '' }] });
    let m!: MonthState;
    let d!: DayState;
    function Mine() {
      m = useMonth({ bookings: [ana], types, schedule, type: 'shift', slots, now });
      d = useDay({ bookings: [ana], types, schedule, type: 'shift', slots, now, day: '2026-11-05' });
      return null;
    }
    await mount(createElement(Mine));
    expect(m.month).toBe('2026-11');
    expect(m.inTurns).toBe(true);
    const fifth = m.weeks.flat().find((x) => x?.day === '2026-11-05')!;
    expect(fifth.turns.map((t) => [t.n, t.who.map((b) => b.name), t.free])).toEqual([
      [1, ['Ana'], 1],
      [2, [], 2],
    ]);
    // The afternoon of today (it is noon) is the first gap.
    expect(m.firstGap).toBe('2026-11-04');
    expect(d.columns.map((c) => c.place)).toEqual([1, 2]);
    expect(d.rows.map((r) => r.gaps.filter(Boolean).length)).toEqual([1, 2]);
    expect(d.blocks).toEqual([{ booking: ana, column: 0, row: 0, span: 1 }]);
    expect(d.free).toBe(3);
    await act(async () => m.moveMonth(1));
    expect(m.month).toBe('2026-12');
  });
});
