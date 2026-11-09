// A booking again and again: the same day of the week and the same hour, as
// the owner's clock says them (summer time and all), every one or more weeks,
// so many times or until a day. Each time is checked against the times free
// as any booking is, and those that are free are made, sharing the id of
// their series; those that are not are said, to choose what to do.

import { makeBooking } from './booking';
import type { Booking, Busy, EventType, Repeat, Schedule } from './model';
import type { Quote } from './price';
import { newId, type BookingRequest } from './read';
import { lengthOf, placeAt, slotsOf } from './slots';
import { addDays, clockAt, instantOf } from './time';

/** No series is longer than a year of weeks. */
const MOST = 52;

/** The times of a series: the first, then every `every` weeks at the same hour of the owner's clock. A week whose hour does not exist that night is skipped. */
export function occurrencesOf(start: string, minutes: number, repeat: Repeat, timeZone: string): { start: string; end: string }[] {
  const first = clockAt(Date.parse(start), timeZone);
  const most = Math.min(repeat.count ?? MOST, MOST);
  const out: { start: string; end: string }[] = [];
  for (let week = 0; out.length < most && week <= MOST * 12; week += Math.max(1, repeat.every)) {
    const day = addDays(first.day, week * 7);
    if (repeat.until && day > repeat.until) break;
    const at = instantOf(day, first.minute, timeZone);
    if (at !== null) out.push({ start: new Date(at).toISOString(), end: new Date(at + minutes * 60_000).toISOString() });
  }
  return out;
}

/** A time of a series, and the resource it would have: `''` for a kind with none, `null` if it is not free. */
export interface SeriesTime {
  start: string;
  end: string;
  resource: string | null;
}

export interface SeriesOptions {
  start: string;
  repeat: Repeat;
  length?: number;
  /** The resource asked; the first with a place, each time, when none. */
  resource?: string;
  busy?: Busy[];
  now?: number;
  /** The owner giving it: no notice and no horizon, as a coordinator gives the turns of months ahead. */
  owner?: boolean;
}

/** Each time of a series, and whether it is free, as `slotsOf` says it for that day. */
export function planSeries(type: EventType, schedule: Schedule, { start, repeat, length, resource, busy, now, owner }: SeriesOptions): SeriesTime[] {
  const minutes = lengthOf(type, length);
  return occurrencesOf(start, minutes, repeat, schedule.timeZone).map((t) => {
    const day = clockAt(Date.parse(t.start), schedule.timeZone).day;
    const free = slotsOf(type, schedule, { from: day, to: day, busy, length: minutes, now, ...(owner ? { notice: 0, horizon: 400 } : {}) });
    return { ...t, resource: placeAt(t.start, free, resource) };
  });
}

/** The bookings of a series, of the times of it that are free, sharing its id; one alone has none. */
export function makeSeries(request: BookingRequest, type: EventType, plan: SeriesTime[], now = Date.now(), quote?: Quote): Booking[] {
  const free = plan.filter((p) => p.resource !== null);
  const series = free.length > 1 ? newId() + newId() : undefined;
  return free.map((p) => {
    const slot = { start: p.start, end: p.end, free: 1, ...(p.resource ? { resources: [p.resource] } : {}) };
    const booking = makeBooking({ ...request, start: p.start, resource: p.resource || undefined }, type, now, [slot], quote);
    return series ? { ...booking, series } : booking;
  });
}
