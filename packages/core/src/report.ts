// What was booked, worked out for whoever runs it: from a day to a day, the
// money of each day (what was charged, given back, taken off by codes), how
// full each resource was of the hours it had, how many came and how many did
// not, which codes were used; and every booking as a row of a CSV, to open
// in a spreadsheet.

import type { Booking, EventType, Schedule } from './model';
import { hoursOf } from './slots';
import { addDays, clockAt, daysBetween, minutesOf } from './time';

export interface ReportDay {
  day: string;
  bookings: number;
  places: number;
  revenue: number;
  refunded: number;
  cancelled: number;
}

export interface ReportResource {
  type: string;
  resource: string;
  name: string;
  /** Of the hours (or nights) it had, how much was taken, 0 to 1. */
  occupancy: number;
  bookings: number;
  revenue: number;
}

export interface Report {
  from: string;
  to: string;
  currency: string;
  days: ReportDay[];
  resources: ReportResource[];
  totals: {
    bookings: number;
    places: number;
    revenue: number;
    refunded: number;
    discounts: number;
    due: number;
    cancelled: number;
    arrived: number;
    noShows: number;
    /** Of those marked come or not, how many did not come, 0 to 1. */
    noShowRate: number;
  };
  coupons: { code: string; uses: number; amount: number }[];
}

const cents = (n: number) => Math.round(n * 100) / 100;
const placesOf = (b: Booking) => b.seats?.length ?? b.places ?? 1;

/** What was booked from a day to a day (by the day each begins, as the owner's clock says it), of the kinds given. */
export function reportOf(bookings: Booking[], types: EventType[], schedule: Schedule, { from, to }: { from: string; to: string }): Report {
  const tz = schedule.timeZone;
  const dayOf = (iso: string) => clockAt(Date.parse(iso), tz).day;
  const ours = new Set(types.map((t) => t.id));
  const mine = bookings.filter((b) => ours.has(b.type) && b.status !== 'held' && dayOf(b.start) >= from && dayOf(b.start) <= to);
  const live = mine.filter((b) => b.status === 'confirmed');
  const days = daysBetween(from, to);
  const revenueOf = (b: Booking) => (b.status === 'confirmed' ? (b.price?.amount ?? 0) : cents((b.payment?.amount ?? 0) - (b.refunded?.amount ?? 0)));

  const byDay = days.map((day): ReportDay => {
    const of = mine.filter((b) => dayOf(b.start) === day);
    return {
      day,
      bookings: of.filter((b) => b.status === 'confirmed').length,
      places: of.filter((b) => b.status === 'confirmed').reduce((n, b) => n + placesOf(b), 0),
      revenue: cents(of.reduce((n, b) => n + revenueOf(b), 0)),
      refunded: cents(of.reduce((n, b) => n + (b.refunded?.amount ?? 0), 0)),
      cancelled: of.filter((b) => b.status === 'cancelled').length,
    };
  });

  // Each resource (or the kind itself, with none): the minutes (or nights) it had open, and how many of them were taken.
  const resources = types.flatMap((type) => {
    const things = type.resources.length ? type.resources : [{ id: '', name: type.title, hours: null, capacity: null }];
    return things.map((r): ReportResource => {
      const of = live.filter((b) => b.type === type.id && (r.id === '' || b.resource === r.id || b.seats?.includes(r.id)));
      const capacity = Math.max(1, r.capacity ?? type.capacity);
      let open = 0;
      let taken = 0;
      if (type.stay) {
        open = days.length;
        taken = of.reduce(
          (n, b) =>
            n +
            daysBetween(dayOf(b.start), dayOf(b.end))
              .slice(0, -1)
              .filter((d) => d >= from && d <= to).length,
          0,
        );
      } else {
        open = days.reduce((n, d) => n + hoursOf(schedule, d, r.hours ?? type.hours).reduce((m, h) => m + ((minutesOf(h.to) ?? 0) - (minutesOf(h.from) ?? 0)), 0), 0) * capacity;
        taken = of.reduce((n, b) => n + ((Date.parse(b.end) - Date.parse(b.start)) / 60_000) * (b.seats ? 1 : (b.places ?? 1)), 0);
      }
      // A seat's share of a booking of several seats: its own price, or an even part.
      const share = (b: Booking) => (b.seats?.length && r.id ? (b.price?.amount ?? 0) / b.seats.length : (b.price?.amount ?? 0));
      return {
        type: type.id,
        resource: r.id,
        name: r.name,
        occupancy: open ? Math.min(1, taken / open) : 0,
        bookings: of.length,
        revenue: cents(of.reduce((n, b) => n + share(b), 0)),
      };
    });
  });

  const marked = live.filter((b) => b.attended);
  const noShows = live.filter((b) => b.attended === 'no-show').length;
  const coupons = new Map<string, { code: string; uses: number; amount: number }>();
  for (const b of live.filter((x) => x.discount)) {
    const c = coupons.get(b.discount!.code) ?? { code: b.discount!.code, uses: 0, amount: 0 };
    coupons.set(c.code, { ...c, uses: c.uses + 1, amount: cents(c.amount + b.discount!.amount) });
  }
  return {
    from,
    to,
    currency: types.find((t) => t.price)?.price?.currency ?? 'MXN',
    days: byDay,
    resources,
    totals: {
      bookings: live.length,
      places: live.reduce((n, b) => n + placesOf(b), 0),
      revenue: cents(byDay.reduce((n, d) => n + d.revenue, 0)),
      refunded: cents(byDay.reduce((n, d) => n + d.refunded, 0)),
      discounts: cents(live.reduce((n, b) => n + (b.discount?.amount ?? 0), 0)),
      due: cents(live.reduce((n, b) => n + (b.due?.amount ?? 0), 0)),
      cancelled: mine.filter((b) => b.status === 'cancelled').length,
      arrived: live.filter((b) => b.attended === 'arrived').length,
      noShows,
      noShowRate: marked.length ? noShows / marked.length : 0,
    },
    coupons: [...coupons.values()].sort((a, b) => b.uses - a.uses),
  };
}

/** A field of a CSV as a spreadsheet reads it: quoted when it has a comma, a quote or a line. */
const field = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Every booking as a row of a CSV, its times as the owner's clock says them; a spreadsheet opens it. */
export function bookingsCsv(bookings: Booking[], types: EventType[], schedule: Schedule): string {
  const tz = schedule.timeZone;
  const local = (iso: string) => {
    const c = clockAt(Date.parse(iso), tz);
    return `${c.day} ${String(Math.floor(c.minute / 60)).padStart(2, '0')}:${String(c.minute % 60).padStart(2, '0')}`;
  };
  const head = ['id', 'kind', 'what', 'start', 'end', 'name', 'email', 'status', 'places', 'price', 'currency', 'code', 'discount', 'paid', 'due', 'refunded', 'attended', 'created'];
  const rows = [...bookings]
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((b) => {
      const type = types.find((t) => t.id === b.type);
      const what = b.seats?.join(' ') || type?.resources.find((r) => r.id === b.resource)?.name || '';
      return [
        b.id,
        type?.title ?? b.type,
        what,
        local(b.start),
        local(b.end),
        b.name,
        b.email,
        b.status,
        placesOf(b),
        b.price?.amount ?? '',
        b.price?.currency ?? '',
        b.discount?.code ?? '',
        b.discount?.amount ?? '',
        b.payment?.amount ?? '',
        b.due?.amount ?? '',
        b.refunded?.amount ?? '',
        b.attended ?? '',
        b.created,
      ];
    });
  // A mark at its beginning, so a spreadsheet reads accents as they are.
  return `﻿${[head, ...rows].map((r) => r.map(field).join(',')).join('\r\n')}\r\n`;
}

/** The days of a report of the last `days`, today the last. */
export const lastDays = (days: number, timeZone: string, now = Date.now()) => {
  const to = clockAt(now, timeZone).day;
  return { from: addDays(to, -(days - 1)), to };
};
