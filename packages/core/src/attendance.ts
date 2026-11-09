// Whether whoever booked came: let in at the door by their ticket (once,
// the day of it, not cancelled, not merely held), or marked arrived or not
// come by whoever looks after it. What is told of a ticket that may not
// enter says why: used already, cancelled, not paid, not today.

import type { Booking } from './model';
import { clockAt } from './time';

export type Attendance = NonNullable<Booking['attended']>;

/** Why a ticket may not enter. */
export type RefusedEntry = 'used' | 'cancelled' | 'held' | 'not-today';

export type Entry = { ok: true; booking: Booking } | { ok: false; reason: RefusedEntry; booking: Booking };

/** A booking marked as come or not come; when it came, now. */
export const markAttendance = (booking: Booking, attended: Attendance, now = Date.now()): Booking => {
  const { arrived: _, ...rest } = booking;
  return { ...rest, attended, ...(attended === 'arrived' ? { arrived: new Date(now).toISOString() } : {}) };
};

/** A ticket shown at the door: let in, marked arrived, once; refused, and why, otherwise. Its day as the owner's clock says it. */
export function checkIn(booking: Booking, now = Date.now(), timeZone = 'UTC'): Entry {
  if (booking.status === 'cancelled') return { ok: false, reason: 'cancelled', booking };
  if (booking.status === 'held') return { ok: false, reason: 'held', booking };
  if (booking.attended === 'arrived') return { ok: false, reason: 'used', booking };
  // The day of it, from its day's first hour until it ends: a stay from the day it arrives.
  if (clockAt(now, timeZone).day < clockAt(Date.parse(booking.start), timeZone).day || now > Date.parse(booking.end)) return { ok: false, reason: 'not-today', booking };
  return { ok: true, booking: markAttendance(booking, 'arrived', now) };
}

/** A refusal at the door in words. */
export function describeEntry(reason: RefusedEntry, locale: 'en' | 'es' = 'en', arrived?: string, timeZone = 'UTC') {
  const es = locale === 'es';
  const at = arrived ? new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(arrived)) : '';
  switch (reason) {
    case 'used':
      return es ? `Este boleto ya entró${at ? ` a las ${at}` : ''}.` : `This ticket already came in${at ? ` at ${at}` : ''}.`;
    case 'cancelled':
      return es ? 'Esta reserva está cancelada.' : 'This booking is cancelled.';
    case 'held':
      return es ? 'Esta reserva no se pagó.' : 'This booking was not paid.';
    case 'not-today':
      return es ? 'Este boleto no es para hoy.' : 'This ticket is not for today.';
  }
}
