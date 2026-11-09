// A booking held while it is paid for: its place kept some minutes, taken
// by no one else, free again when they run out unless it is paid; paid, it
// is confirmed, with what was paid, to refund it if need be.

import type { Booking } from './model';

/** A booking held, its place kept `minutes` from now, its payment to be said. */
export const holdBooking = (booking: Booking, minutes: number, now = Date.now()): Booking => ({ ...booking, status: 'held', held: new Date(now + minutes * 60_000).toISOString() });

/** A booking held, paid: confirmed, with the id of what was paid. */
export const confirmBooking = (booking: Booking, paid?: string): Booking => {
  const { held: _, ...rest } = booking;
  return { ...rest, status: 'confirmed', ...(booking.payment ? { payment: { ...booking.payment, ...(paid ? { paid } : {}) } } : {}) };
};

/** Whether a booking held has run out: its place no longer kept. */
export const runOut = (booking: Booking, now = Date.now()) => booking.status === 'held' && (!booking.held || Date.parse(booking.held) <= now);
