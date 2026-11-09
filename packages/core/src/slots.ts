// The times still free for a kind of appointment: each day's hours, as the
// owner's clock says them in their time zone, cut into starts every
// `increment` minutes; each long enough, soon enough and not too far ahead;
// none that would touch what is busy, its time kept free before and after
// it; no more in a day than it may have. When what is booked is a thing, one
// of several alike, or has room for several at once, a time is free while
// one of them has a place left, and says which and how many. And those times
// laid out by the day of whoever books, in their own time zone.

import type { Busy, EventType, Hours, Schedule, Slot, Weekday } from './model';
import { addDays, clockAt, type Day, daysBetween, instantOf, minutesOf } from './time';

/** The hours of a day: as the date says, if it is one of those that are not as the week; else as its weekday, in the kind's own hours if it has them. */
export const hoursOf = (schedule: Schedule, day: Day, own?: EventType['hours']): Hours[] => schedule.dates[day] ?? (own ?? schedule.weekly)[new Date(`${day}T12:00:00Z`).getUTCDay() as Weekday] ?? [];

/** The lengths a kind may be booked for, the first its own. */
export const lengthsOf = (type: EventType) => [...new Set([type.duration, ...type.lengths])];

/** A length asked for, if the kind has it; its own duration if not. */
export const lengthOf = (type: EventType, asked?: number) => (asked && lengthsOf(type).includes(asked) ? asked : type.duration);

export interface SlotsOptions {
  /** The days asked, as the owner's clock says them; from today to the horizon unless said. */
  from?: Day;
  to?: Day;
  /** What is taken: appointments booked, the owner's own calendar. */
  busy?: Busy[];
  /** Of `busy`, how many are appointments of this kind on each day, for its most a day; all of them unless said. */
  booked?: Busy[];
  /** How long, of the lengths the kind has; its duration unless said. */
  length?: number;
  /** Now, as milliseconds; the clock's unless said. */
  now?: number;
  /** The notice and the horizon, instead of the kind's: the owner giving a turn needs neither. */
  notice?: number;
  horizon?: number;
  /** How many places together: a time is free only where one resource has that many left. One unless said. */
  places?: number;
}

/** Whether a resource works a stretch of a day (minutes of it), as its own hours say; one with none works all of its kind's. */
export function works(type: EventType, schedule: Schedule, resource: string, day: Day, from: number, to: number) {
  const own = type.resources.find((r) => r.id === resource)?.hours;
  if (!own) return true;
  return hoursOf(schedule, day, own).some((h) => (minutesOf(h.from) ?? 0) <= from && to <= (minutesOf(h.to) ?? 0));
}

/** The times a kind may start on a day, as its hours cut them, taken or not, soon or not: the shifts of a day, the morning's and the afternoon's. Instants, in milliseconds; and the minute of the day each starts at, as the owner's clock says it. */
export function startsOn(type: EventType, schedule: Schedule, day: Day, minutes = type.duration): { start: number; end: number; minute: number }[] {
  const out: { start: number; end: number; minute: number }[] = [];
  // The hours of the kind, and those of each resource with hours of its own (a barber's): the starts of any of them.
  const own = type.resources.filter((r) => r.hours).map((r) => r.hours as EventType['hours']);
  const sets = own.length ? [...(type.resources.some((r) => !r.hours) ? [type.hours] : []), ...own] : [type.hours];
  const stretches = sets.flatMap((set) => hoursOf(schedule, day, set));
  for (const hours of stretches) {
    const open = minutesOf(hours.from);
    const close = minutesOf(hours.to);
    if (open === null || close === null) continue;
    // A kind of whole stretches: each stretch, one turn, as long as it is.
    if (type.whole) {
      const start = instantOf(day, open, schedule.timeZone);
      const end = instantOf(day, close, schedule.timeZone) ?? (start === null ? null : start + (close - open) * 60_000);
      if (start !== null && end !== null) out.push({ start, end, minute: open });
      continue;
    }
    for (let minute = open; minute + minutes <= close; minute += type.increment || type.duration) {
      const start = instantOf(day, minute, schedule.timeZone);
      if (start !== null) out.push({ start, end: start + minutes * 60_000, minute });
    }
  }
  // Each start once, the soonest first, when several hours give the same.
  return out.filter((t, i) => out.findIndex((u) => u.start === t.start) === i).sort((a, b) => a.start - b.start);
}

/** The times free for `type` in `schedule`, the soonest first. */
export function slotsOf(type: EventType, schedule: Schedule, options: SlotsOptions = {}): Slot[] {
  const now = options.now ?? Date.now();
  const tz = schedule.timeZone;
  const earliest = now + (options.notice ?? type.notice) * 60_000;
  const latest = now + (options.horizon ?? type.horizon) * 86_400_000;
  const today = clockAt(now, tz).day;
  const from = options.from && options.from > today ? options.from : today;
  const last = clockAt(latest, tz).day;
  const to = options.to && options.to < last ? options.to : last;
  const busy = (options.busy ?? []).map((b) => ({ s: Date.parse(b.start), e: Date.parse(b.end), resource: b.resource, places: b.places ?? 1 })).filter((b) => b.e > b.s);
  const booked = (options.booked ?? options.busy ?? []).map((b) => clockAt(Date.parse(b.start), tz).day);
  const minutes = lengthOf(type, options.length);
  const places = type.resources.length ? type.resources.map((r) => r.id) : [''];
  // Each resource its own capacity, or its kind's.
  const capacityOf = (id: string) => Math.max(1, type.resources.find((r) => r.id === id)?.capacity ?? type.capacity);
  const need = Math.max(1, options.places ?? 1);
  const out: Slot[] = [];

  for (const day of daysBetween(from, to)) {
    // A day with as many as it may have gives no more.
    if (type.perDay !== null && booked.filter((d) => d === day).length >= type.perDay) continue;
    for (const { start, end, minute } of startsOn(type, schedule, day, minutes)) {
      if (start < earliest || start > latest) continue;
      // Its time kept free before and after it may not touch anything busy.
      const a = start - type.before * 60_000;
      const b = end + type.after * 60_000;
      const touching = busy.filter((x) => x.s < b && x.e > a);
      // Something of all of them (the owner away) leaves none.
      if (touching.some((x) => x.resource === undefined)) continue;
      const length = (end - start) / 60_000;
      const left = places
        .filter((id) => works(type, schedule, id, day, minute, minute + length))
        .map((id) => ({ id, left: capacityOf(id) - touching.filter((x) => x.resource === id).reduce((n, x) => n + x.places, 0) }))
        .filter((p) => p.left >= need);
      if (!left.length) continue;
      out.push({
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        free: left.reduce((n, p) => n + p.left, 0),
        ...(type.resources.length ? { resources: left.map((p) => p.id) } : {}),
      });
    }
  }
  return out;
}

/** Times laid out by day, as `timeZone` (who books) has them: each day and its times, the soonest first. */
export function slotsByDay(slots: Slot[], timeZone: string): Map<Day, Slot[]> {
  const days = new Map<Day, Slot[]>();
  for (const slot of slots) {
    const { day } = clockAt(Date.parse(slot.start), timeZone);
    days.set(day, [...(days.get(day) ?? []), slot]);
  }
  return days;
}

/** Whether a time is one of those free: the very start a slot has, and the resource asked for among those left, if one is. */
export const isFree = (start: string, slots: Slot[], resource?: string) => placeAt(start, slots, resource) !== null;

/** What is booked at a time free: the resource asked for if it has a place, the first that has one if none is asked; `''` for a kind with none; none if it is not free. */
export function placeAt(start: string, slots: Slot[], resource?: string): string | null {
  const slot = slots.find((s) => Date.parse(s.start) === Date.parse(start));
  if (!slot) return null;
  if (!slot.resources) return '';
  if (resource) return slot.resources.includes(resource) ? resource : null;
  return slot.resources[0] ?? null;
}

/** The days of a month a calendar shows, Monday first, as a grid of weeks: each day of it, or none outside it. */
export function monthOf(month: string): (Day | null)[][] {
  const first = `${month}-01`;
  const lead = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  const days: (Day | null)[] = Array.from({ length: lead }, () => null);
  for (let d = first; d.startsWith(month); d = addDays(d, 1)) days.push(d);
  while (days.length % 7) days.push(null);
  return Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));
}
