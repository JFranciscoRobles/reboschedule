// What is paid and given back, as the owner's rules say it: a code's
// discount (a percent, an amount, two for one) taken off a booking's price;
// the deposit paid when booked and what is left to pay at the place; what is
// given back when it is cancelled, by how long before; and until when whoever
// booked may move it themselves.

import type { Booking, Coupon, EventType, Money, RefundRule, Schedule, Weekday } from './model';
import { clockAt, daysBetween } from './time';

const cents = (n: number) => Math.round(n * 100) / 100;

/** Whether a code is good for a booking of a kind at a time: its kinds, its days, until its day. */
export function couponFits(coupon: Coupon, type: EventType, start: string, schedule: Schedule) {
  const { day } = clockAt(Date.parse(start), schedule.timeZone);
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay() as Weekday;
  if (coupon.types?.length && !coupon.types.includes(type.id)) return false;
  if (coupon.days?.length && !coupon.days.includes(weekday)) return false;
  if (coupon.until && day > coupon.until) return false;
  return true;
}

/** What each place of a booking cost: each seat, each ticket, each night; the booking whole when it is one. */
export function unitPrices(booking: Booking, type: EventType): number[] {
  const total = booking.price?.amount ?? 0;
  if (booking.seats?.length) return booking.seats.map((s) => type.resources.find((r) => r.id === s)?.price ?? type.price?.amount ?? 0);
  if (booking.places && booking.places > 1) return Array(booking.places).fill(total / booking.places);
  if (type.stay) {
    const n = Math.max(1, daysBetween(booking.start.slice(0, 10), booking.end.slice(0, 10)).length - (type.stay.unit === 'day' ? 0 : 1));
    return Array(n).fill(total / n);
  }
  return [total];
}

/** How much a code takes off a price whose places cost so much each: its percent, its amount, or the cheapest of each `take` free but `pay`. */
export function discountOf(coupon: Coupon, units: number[]): number {
  const total = units.reduce((n, u) => n + u, 0);
  let off = 0;
  if (coupon.take && coupon.pay !== undefined && coupon.take > coupon.pay) {
    const free = Math.floor(units.length / coupon.take) * (coupon.take - coupon.pay);
    off = [...units]
      .sort((a, b) => a - b)
      .slice(0, free)
      .reduce((n, u) => n + u, 0);
  } else if (coupon.percent) off = (total * Math.min(100, coupon.percent)) / 100;
  else if (coupon.amount) off = coupon.amount;
  return cents(Math.min(total, off));
}

/** A booking with a code's discount taken off its price; as it was when the code is not good for it. */
export function withCoupon(booking: Booking, type: EventType, schedule: Schedule, coupon: Coupon): Booking {
  if (!booking.price || !couponFits(coupon, type, booking.start, schedule)) return booking;
  const off = discountOf(coupon, unitPrices(booking, type));
  if (!off) return booking;
  return { ...booking, price: { ...booking.price, amount: cents(booking.price.amount - off) }, discount: { code: coupon.code, amount: off } };
}

/** What is paid now of a price, the kind's deposit of it; and what is left to pay at the place. */
export function depositOf(type: EventType, price: Money): { now: Money; due: Money | null } {
  const percent = type.deposit && type.deposit > 0 && type.deposit < 100 ? type.deposit : 100;
  const now = cents((price.amount * percent) / 100);
  return { now: { amount: now, currency: price.currency }, due: percent < 100 ? { amount: cents(price.amount - now), currency: price.currency } : null };
}

/** What was paid of a booking: what its payment says, or its price less what is due. */
export const paidOf = (booking: Booking): number => (booking.payment?.paid ? (booking.payment.amount ?? cents((booking.price?.amount ?? 0) - (booking.due?.amount ?? 0))) : 0);

/** The rule of the kind for so many hours before: the first whose hours are reached, the most hours first. */
const ruleAt = (rules: RefundRule[], hours: number) => [...rules].sort((a, b) => b.hours - a.hours).find((r) => hours >= r.hours);

/** What would be given back if a booking were cancelled now: a percent of what was paid, as the kind's rules say for how long before; all of it with no rules. */
export function refundOf(booking: Booking, type: EventType, now = Date.now()): Money | null {
  const paid = paidOf(booking);
  if (!paid || booking.status !== 'confirmed') return null;
  const hours = (Date.parse(booking.start) - now) / 3_600_000;
  const percent = !type.refunds?.length ? 100 : hours < 0 ? 0 : (ruleAt(type.refunds, hours)?.percent ?? 0);
  return { amount: cents((paid * percent) / 100), currency: booking.price?.currency ?? 'MXN' };
}

/** Until when whoever booked may move it themselves, ISO; none if the kind does not let them, or it is not confirmed. */
export function movableUntil(booking: Booking, type: EventType): string | null {
  if (type.reschedule === null || type.reschedule === undefined || booking.status !== 'confirmed') return null;
  return new Date(Date.parse(booking.start) - type.reschedule * 3_600_000).toISOString();
}

/** The bookings to remind of now: confirmed, not yet reminded, beginning within so many hours. */
export const remindersDue = (bookings: Booking[], now = Date.now(), hours = 24) =>
  bookings.filter((b) => b.status === 'confirmed' && !b.reminded && Date.parse(b.start) > now && Date.parse(b.start) - now <= hours * 3_600_000);
