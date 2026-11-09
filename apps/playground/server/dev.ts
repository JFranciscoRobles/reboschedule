// What a server of booking does, in the playground: the owner's hours and
// kinds of appointment kept as they are written, the routes of booking
// (`@reboschedule/server`) answering the widget, and what is booked, which
// the owner may change, move and delete from the calendar. In memory: kept
// while this file is edited (on `globalThis`), gone when the playground stops.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { addDays, type Booking, clockAt, type EventType, moveBooking, readEventType, readSchedule, sampleEventTypes, sampleSchedule, type Schedule, slotsOf, startsOn } from '@reboschedule/core';
import { createBookingHandler, nodeHandler } from '@reboschedule/server';

const BASE = 'http://localhost:5320';
const organizer = { name: 'Laura Méndez', email: 'laura@example.com' };

interface State {
  schedule: Schedule;
  types: EventType[];
  bookings: Booking[];
}

// The office's shifts as the agents took them, from a week ago to ten days ahead, some with a place still free: something for the calendar to show.
const PEOPLE = ['Ana López', 'Beto Ruiz', 'Carla Gómez', 'Diego Soto', 'Elena Paz', 'Fer Castro', 'Gael Ríos'];
function seeded(): State {
  const schedule = sampleSchedule();
  const types = sampleEventTypes('es');
  const bookings: Booking[] = [];
  const shift = types.find((t) => t.id === 'shift')!;
  const today = clockAt(Date.now(), schedule.timeZone).day;
  let n = 0;
  for (let i = -7; i <= 10; i++)
    startsOn(shift, schedule, addDays(today, i)).forEach((t, j) => {
      for (let k = 0; k < ((i + j) % 4 === 3 ? 1 : 2); k++) {
        const name = PEOPLE[n++ % PEOPLE.length];
        bookings.push({
          id: `seed-${i}-${j}-${k}`,
          type: shift.id,
          resource: '',
          start: new Date(t.start).toISOString(),
          end: new Date(t.end).toISOString(),
          name,
          email: `${name.split(' ')[0].toLowerCase()}@example.com`,
          timeZone: schedule.timeZone,
          answers: {},
          status: 'confirmed',
          created: new Date().toISOString(),
        });
      }
    });
  return { schedule, types, bookings };
}

// Kept on `globalThis`: Vite loads this file again when it is edited, and what the owner wrote and booked stays.
const state: State = ((globalThis as { __reboschedule?: State }).__reboschedule ??= seeded());

/** Whether a kind takes the owner's own time: not a thing booked (a court, a room), nor a place among several, nor open hours of its own (a shift, even of one). */
const owners = (type: EventType | undefined) => !!type && !type.resources.length && type.capacity === 1 && type.hours === null;

/** What is taken for a kind, all but one booking if said: the owner's appointments take all their time; the others, only their own places. */
const busyOf = (type: EventType, except?: string) =>
  state.bookings
    .filter((b) => b.status === 'confirmed' && b.id !== except)
    .filter((b) => (owners(type) ? owners(state.types.find((t) => t.id === b.type)) : b.type === type.id))
    .map((b) => (owners(type) ? { start: b.start, end: b.end } : { start: b.start, end: b.end, resource: b.resource }));

const calendarOf = (type: EventType) => ({ type, schedule: state.schedule, organizer, busy: () => busyOf(type) });

const routes = createBookingHandler({
  secret: 'the-playground-secret-not-for-production',
  base: BASE,
  locale: 'es',
  load: (slug) => {
    const type = state.types.find((t) => t.slug === slug);
    return type ? calendarOf(type) : null;
  },
  find: (id) => {
    const booking = state.bookings.find((b) => b.id === id);
    const type = booking && state.types.find((t) => t.id === booking.type);
    return booking && type ? { booking, calendar: calendarOf(type) } : null;
  },
  onBooked: (booking, { manage }) => {
    state.bookings.push(booking);
    console.log(`[booked] ${booking.name} · ${booking.start} · ${manage}`);
  },
  onCancelled: (booking) =>
    void state.bookings.splice(
      state.bookings.findIndex((b) => b.id === booking.id),
      1,
      booking,
    ),
});

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
const problem = (message: string, status = 422) => json({ problems: [{ message }] }, status);

/** A booking as the owner changes it: who, what they answered, and when, if it is moved to a gap free without it. */
async function change(booking: Booking, given: { name?: string; email?: string; answers?: Record<string, string>; start?: string }) {
  const type = state.types.find((t) => t.id === booking.type);
  if (!type) return problem('Ese tipo de reserva ya no existe.', 404);
  let next = { ...booking };
  if (given.start && Date.parse(given.start) !== Date.parse(booking.start)) {
    const minutes = (Date.parse(booking.end) - Date.parse(booking.start)) / 60_000;
    const free = slotsOf(type, state.schedule, { busy: busyOf(type, booking.id), length: minutes });
    const moved = moveBooking(booking, given.start, type, free);
    if (!moved) return problem('Ese hueco ya no está libre.', 409);
    next = moved;
  }
  if (given.name !== undefined) next.name = given.name.trim().slice(0, 120);
  if (given.email !== undefined) next.email = given.email.trim().slice(0, 200);
  if (given.answers) next.answers = Object.fromEntries(type.questions.map((q) => [q.id, String(given.answers?.[q.id] ?? '').slice(0, 2000)]));
  if (!next.name) return problem('Falta el nombre.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) return problem('Ese correo no parece un correo.');
  state.bookings.splice(state.bookings.indexOf(booking), 1, next);
  return json(next);
}

export async function handle(req: IncomingMessage, res: ServerResponse) {
  return nodeHandler(async (request) => {
    const url = new URL(request.url);
    if (url.pathname === '/api/state' && request.method === 'GET') return json(state);
    // All of it as it was, from a copy.
    if (url.pathname === '/api/state' && request.method === 'PUT') {
      const given = (await request.json()) as State;
      state.schedule = readSchedule(given.schedule);
      state.types = given.types.map(readEventType);
      state.bookings = given.bookings;
      return json({ ok: true });
    }
    if (url.pathname === '/api/schedule' && request.method === 'PUT') {
      state.schedule = readSchedule(await request.json());
      return json({ ok: true });
    }
    if (url.pathname === '/api/types' && request.method === 'PUT') {
      state.types = ((await request.json()) as unknown[]).map(readEventType);
      return json({ ok: true });
    }
    const one = /^\/api\/bookings\/([^/]+)$/.exec(url.pathname);
    const booking = one && state.bookings.find((b) => b.id === decodeURIComponent(one[1]));
    if (one && !booking) return problem('Esa reserva ya no existe.', 404);
    if (booking && request.method === 'PATCH') return change(booking, await request.json());
    // Deleted: cancelled, its place left free, kept in the list.
    if (booking && request.method === 'DELETE') {
      state.bookings.splice(state.bookings.indexOf(booking), 1, { ...booking, status: 'cancelled' });
      return json({ ok: true });
    }
    if (url.pathname.startsWith('/s/')) return routes(request);
    return new Response('Not found', { status: 404 });
  })(req, res);
}
