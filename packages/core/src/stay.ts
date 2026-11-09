// A stay: whole nights (a cabin) or whole days (a car, a bicycle), from a
// day to a day, each between the hour in and the hour out of the owner's
// clock. Each night (or day) is free while one resource has a place all of
// it; a stay is free while one resource has every night of it. Its price is
// each night's, of the resource it is.

import type { BookingProblem } from './booking';
import type { Booking, Busy, EventType, Schedule } from './model';
import { priceOf, type Quote } from './price';
import { type BookingRequest, newId } from './read';
import { addDays, clockAt, type Day, daysBetween, instantOf, minutesOf } from './time';

/** A night (or day) of a kind of stay: the day it begins, and the resources with a place all of it. */
export interface Night {
  day: Day;
  resources: string[];
}

/** When a stay begins and ends: the hour in of its first day, the hour out of its last (the day one leaves, for nights). */
export function stayTimes(type: EventType, schedule: Schedule, arrive: Day, leave: Day): { start: string; end: string } | null {
  const stay = type.stay;
  if (!stay) return null;
  const start = instantOf(arrive, minutesOf(stay.checkIn) ?? 0, schedule.timeZone);
  const end = instantOf(leave, minutesOf(stay.checkOut) ?? 0, schedule.timeZone);
  return start === null || end === null ? null : { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
}

/** How many nights (or days) from a day to a day: nights to the day one leaves, days to the last, that one counted. */
export const unitsOf = (type: EventType, arrive: Day, leave: Day) => Math.max(0, daysBetween(arrive, leave).length - (type.stay?.unit === 'day' ? 0 : 1));

export interface NightsOptions {
  from?: Day;
  to?: Day;
  busy?: Busy[];
  now?: number;
}

/** Each night (or day) from `from` to `to` that some resource has free, soon enough and not too far ahead. */
export function nightsOf(type: EventType, schedule: Schedule, { from, to, busy = [], now = Date.now() }: NightsOptions = {}): Night[] {
  if (!type.stay) return [];
  const tz = schedule.timeZone;
  const today = clockAt(now, tz).day;
  const first = from && from > today ? from : today;
  const last = clockAt(now + type.horizon * 86_400_000, tz).day;
  const places = type.resources.length ? type.resources.map((r) => r.id) : [''];
  const capacityOf = (id: string) => Math.max(1, type.resources.find((r) => r.id === id)?.capacity ?? type.capacity);
  const out: Night[] = [];
  for (const day of daysBetween(first, to && to < last ? to : last)) {
    const times = stayTimes(type, schedule, day, type.stay.unit === 'night' ? addDays(day, 1) : day);
    if (!times || Date.parse(times.start) < now + type.notice * 60_000) continue;
    const [a, b] = [Date.parse(times.start), Date.parse(times.end)];
    const touching = busy.filter((x) => Date.parse(x.start) < b && Date.parse(x.end) > a);
    if (touching.some((x) => x.resource === undefined)) continue;
    const resources = places.filter((id) => capacityOf(id) - touching.filter((x) => x.resource === id).reduce((n, x) => n + (x.places ?? 1), 0) > 0);
    if (resources.length) out.push({ day, resources });
  }
  return out;
}

/** The resource a stay would have, from a day to a day: the one asked if it has every night, else the first that has; `''` for a kind with none; none if no one has. */
export function stayResource(type: EventType, nights: Night[], arrive: Day, leave: Day, resource?: string): string | null {
  const days = daysBetween(arrive, leave).slice(0, unitsOf(type, arrive, leave));
  const each = days.map((d) => nights.find((n) => n.day === d)?.resources ?? []);
  const all = (type.resources.length ? type.resources.map((r) => r.id) : ['']).filter((id) => each.every((r) => r.includes(id)));
  if (!days.length) return null;
  if (resource) return all.includes(resource) ? resource : null;
  return all[0] ?? null;
}

/** What a stay asked lacks, or why it may not be: too few nights, too many, not free, no name, no email. */
export function stayProblems(request: BookingRequest, type: EventType, nights: Night[]): BookingProblem[] {
  const out: BookingProblem[] = [];
  const stay = type.stay;
  if (!stay || !request.arrive || !request.leave) return [{ code: 'taken' }];
  const n = unitsOf(type, request.arrive, request.leave);
  if (n < stay.min) out.push({ code: 'too-short', most: stay.min });
  if (n > stay.max) out.push({ code: 'too-long', most: stay.max });
  if (n >= 1 && stayResource(type, nights, request.arrive, request.leave, request.resource) === null) out.push({ code: 'taken' });
  if (!request.name) out.push({ code: 'no-name' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) out.push({ code: 'bad-email' });
  for (const q of type.questions) if (q.required && !request.answers[q.id]?.trim()) out.push({ code: 'missing-answer', question: q.id });
  return out;
}

/** A stay made of a request that may be: its times, its resource, its price of each night. */
export function makeStay(request: BookingRequest, type: EventType, schedule: Schedule, nights: Night[], now = Date.now(), quote?: Quote): Booking {
  const arrive = request.arrive ?? '';
  const leave = request.leave ?? '';
  const times = stayTimes(type, schedule, arrive, leave)!;
  const resource = stayResource(type, nights, arrive, leave, request.resource) ?? '';
  const n = unitsOf(type, arrive, leave);
  const price = priceOf(type, { resource, start: times.start, length: (Date.parse(times.end) - Date.parse(times.start)) / 60_000, nights: n }, quote);
  return {
    id: newId() + newId(),
    type: type.id,
    resource,
    ...(price ? { price } : {}),
    start: times.start,
    end: times.end,
    name: request.name,
    email: request.email,
    timeZone: request.timeZone,
    answers: Object.fromEntries(type.questions.map((q) => [q.id, request.answers[q.id] ?? ''])),
    status: 'confirmed',
    created: new Date(now).toISOString(),
  };
}

/** Whether a booking takes its place now: confirmed, or held and not yet run out. */
export const takes = (b: Booking, now = Date.now()) => b.status === 'confirmed' || (b.status === 'held' && !!b.held && Date.parse(b.held) > now);

/** Bookings as what they take, those that take it now (confirmed, or held still): each seat of them, or so many places of their resource. */
export const busyOfBookings = (bookings: Booking[], now = Date.now()): Busy[] =>
  bookings
    .filter((b) => takes(b, now))
    .flatMap((b) =>
      b.seats?.length ? b.seats.map((seat) => ({ start: b.start, end: b.end, resource: seat })) : [{ start: b.start, end: b.end, resource: b.resource, ...(b.places ? { places: b.places } : {}) }],
    );
