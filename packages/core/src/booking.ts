// A booking checked as it comes, against the times free as they are now
// (another may have taken it a second before): its time one of them, a name,
// an email that may be one, and the answers asked for. Each problem said by a
// code, for the application, and in words, in English or Spanish.

import type { Booking, EventType, Slot } from './model';
import { type BookingRequest, newId } from './read';
import { priceOf, type Quote } from './price';
import { isFree, lengthOf, placeAt } from './slots';

export type Locale = 'en' | 'es';

export type BookingProblem =
  | { code: 'taken' }
  | { code: 'no-name' }
  | { code: 'bad-email' }
  | { code: 'missing-answer'; question: string }
  | { code: 'too-short'; most: number }
  | { code: 'too-long'; most: number }
  | { code: 'bad-coupon' }
  | { code: 'too-late' };

/** What a booking lacks, or why it may not be; nothing when it may be booked. */
export function bookingProblems(request: BookingRequest, type: EventType, free: Slot[]): BookingProblem[] {
  const out: BookingProblem[] = [];
  // Seats, each one free; else the resource asked, or any.
  const slot = free.find((s) => Date.parse(s.start) === Date.parse(request.start));
  const seated = request.seats?.length ? !!slot && request.seats.every((seat) => slot.resources?.includes(seat)) : isFree(request.start, free, request.resource);
  if (!request.start || Number.isNaN(Date.parse(request.start)) || !seated) out.push({ code: 'taken' });
  if (!request.name) out.push({ code: 'no-name' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) out.push({ code: 'bad-email' });
  for (const q of type.questions) if (q.required && !request.answers[q.id]?.trim()) out.push({ code: 'missing-answer', question: q.id });
  return out;
}

/** A booking made of a request that may be: for the length asked, of the resource asked or the first free (of `free`, the times it was checked against), at its price. */
export function makeBooking(request: BookingRequest, type: EventType, now = Date.now(), free: Slot[] = [], quote?: Quote): Booking {
  const start = new Date(Date.parse(request.start)).toISOString();
  const length = lengthOf(type, request.length);
  const seats = request.seats?.length ? request.seats : undefined;
  const resource = seats?.[0] ?? (type.resources.length ? placeAt(start, free, request.resource) : '') ?? request.resource ?? '';
  const places = seats ? undefined : request.places && request.places > 1 ? request.places : undefined;
  // A whole turn is as long as its stretch; the rest, as the length asked.
  const slot = free.find((s) => Date.parse(s.start) === Date.parse(start));
  const end = type.whole && slot ? slot.end : new Date(Date.parse(start) + length * 60_000).toISOString();
  // Quoted here, on the server, never as the browser says it: each seat its own price, or each place.
  const priced = seats ? seats.map((seat) => priceOf(type, { resource: seat, start, length }, quote)) : [priceOf(type, { resource, start, length, places: places ?? 1 }, quote)];
  const price = priced.every((p) => p) ? { amount: Math.round(priced.reduce((n, p) => n + (p?.amount ?? 0), 0) * 100) / 100, currency: priced[0]!.currency } : null;
  return {
    id: newId() + newId(),
    type: type.id,
    resource,
    ...(seats ? { seats } : {}),
    ...(places ? { places } : {}),
    ...(price ? { price } : {}),
    start,
    end,
    name: request.name,
    email: request.email,
    timeZone: request.timeZone,
    answers: Object.fromEntries(type.questions.map((q) => [q.id, request.answers[q.id] ?? ''])),
    status: 'confirmed',
    created: new Date(now).toISOString(),
  };
}

/**
 * A booking moved to another time, as the owner moves it: its length kept, its
 * resource the same if it has a place there, else the first that has one.
 * `free` are the times free without it (what it takes not counted as busy),
 * for the length it has. None if the time is not one of them.
 */
export function moveBooking(booking: Booking, start: string, type: EventType, free: Slot[]): Booking | null {
  if (Number.isNaN(Date.parse(start))) return null;
  const length = Date.parse(booking.end) - Date.parse(booking.start);
  const resource = type.resources.length ? (placeAt(start, free, booking.resource) ?? placeAt(start, free)) : placeAt(start, free);
  if (resource === null) return null;
  const at = new Date(Date.parse(start)).toISOString();
  return { ...booking, start: at, end: new Date(Date.parse(at) + length).toISOString(), resource, sequence: (booking.sequence ?? 0) + 1 };
}

/** A problem in words, to show whoever books. */
export function describeBookingProblem(p: BookingProblem, locale: Locale = 'en', type?: EventType): string {
  const es = locale === 'es';
  switch (p.code) {
    case 'taken':
      return es ? 'Ese horario ya no está libre: elige otro.' : 'That time is no longer free: choose another.';
    case 'no-name':
      return es ? 'Falta tu nombre.' : 'Your name is missing.';
    case 'bad-email':
      return es ? 'Ese correo no parece un correo.' : 'That does not look like an email.';
    case 'missing-answer': {
      const label = type?.questions.find((q) => q.id === p.question)?.label ?? p.question;
      return es ? `Falta: ${label}.` : `Missing: ${label}.`;
    }
    case 'too-short':
      return es ? `Son ${p.most} como mínimo.` : `It is ${p.most} at the least.`;
    case 'too-long':
      return es ? `Son ${p.most} como máximo.` : `It is ${p.most} at the most.`;
    case 'bad-coupon':
      return es ? 'Ese código no existe o no aplica a esta reserva.' : 'That code does not exist or is not good for this booking.';
    case 'too-late':
      return es ? 'Ya es tarde para cambiarla tú: escribe a quien la da.' : 'It is too late to change it yourself: write to whoever gives it.';
  }
}
