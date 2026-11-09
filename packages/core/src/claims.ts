// What a booking claims, as keys a database keeps unique: each five minutes
// of each place it takes (each seat, the resource, the owner's own time),
// or each night of a stay. Two bookings that would take the same place at the
// same time share a key, and the second is refused by the index itself, not
// by a check a moment before. A kind of several places at once (a zone of
// 120, a shift of two) has none: those need a lock of the application.

import type { Booking, EventType } from './model';
import { clockAt, daysBetween } from './time';

const STEP = 5 * 60_000;

/** The keys a booking claims, unique among all; none when its kind has several places at once. */
export function claimsOf(booking: Booking, type: EventType, timeZone = 'UTC'): string[] | null {
  const capacityOf = (id: string) => type.resources.find((r) => r.id === id)?.capacity ?? type.capacity;
  const places = booking.seats?.length ? booking.seats : [booking.resource];
  if (places.some((p) => capacityOf(p) > 1) || booking.places) return null;
  // The owner's own time is one place for all their kinds; a resource, its own.
  const owner = (p: string) => (p ? `r:${p}` : 'owner');
  if (type.stay) {
    const days = daysBetween(clockAt(Date.parse(booking.start), timeZone).day, clockAt(Date.parse(booking.end), timeZone).day);
    const nights = type.stay.unit === 'day' ? days : days.slice(0, -1);
    return nights.flatMap((d) => places.map((p) => `${owner(p)}|night|${d}`));
  }
  const from = Math.floor((Date.parse(booking.start) - type.before * 60_000) / STEP) * STEP;
  const to = Date.parse(booking.end) + type.after * 60_000;
  const out: string[] = [];
  for (let t = from; t < to; t += STEP) out.push(...places.map((p) => `${owner(p)}|${new Date(t).toISOString()}`));
  return out;
}
