// What whoever looks after the bookings sees, worked out, without what it
// looks like. `useMonth`: the month shown and its weeks, each day with its
// bookings, its turns (who has each, the places free, the gap to give) and
// its gaps; how many gaps are ahead and the day of the first. `useDay`: one
// day, its columns (each resource, each place of a turn, or the owner), its
// rows (a step each, from opening to closing) with the gap of each column,
// each booking as a block (its column, its row, how many rows), and where now
// is. `BookingCalendar` and `BookingDay` are drawn on them.

import { addDays, type Booking, clockAt, type EventType, hoursOf, instantOf, minutesOf, monthOf, type Schedule, type Slot, slotsByDay, startsOn, works } from '@reboschedule/core';
import { useMemo, useState } from 'react';

export interface CalendarOptions {
  bookings: Booking[];
  types: EventType[];
  schedule: Schedule;
  /** The id of the kind shown; all of them unless said. */
  type?: string;
  /** The times still free of the kind shown, as its `/slots` gives them: the gaps. */
  slots?: Slot[];
  /** Now, as milliseconds: which day is today, which are past. */
  now?: number;
  /** What is busy in the owner's own calendar (Google, Outlook), to show where it is: not theirs to give. */
  away?: { start: string; end: string; title?: string }[];
}

/** A turn of a day: its number, when, who has it, the places free, and the gap to give one of them. */
export interface Turn {
  n: number;
  start: number;
  end: number;
  who: Booking[];
  free: number;
  gap: Slot | null;
}

/** A day of the month, as whoever looks after it sees it. */
export interface MonthDay {
  day: string;
  today: boolean;
  past: boolean;
  /** Its bookings of the kind shown (or of all), the soonest first. */
  bookings: Booking[];
  /** Its turns, when the kind is in turns: those someone has, and those that may be given. */
  turns: Turn[];
  /** Its times free, when they are given. */
  gaps: Slot[];
}

export interface MonthState {
  month: string;
  setMonth: (month: string) => void;
  moveMonth: (by: number) => void;
  today: string;
  /** The kind shown, and whether it is in turns that do not overlap (the shifts of an office). */
  kind: EventType | undefined;
  inTurns: boolean;
  /** The weeks of the month, Monday first, each day or none. */
  weeks: (MonthDay | null)[][];
  /** How many are still free ahead (places of turns, or times), and the day of the first. */
  ahead: number;
  firstGap: string | null;
}

/** The kind of a calendar, if one is shown, and whether its starts are turns of their own, none over the next. */
const kindOf = (types: EventType[], only?: string) => {
  const kind = only ? types.find((t) => t.id === only) : undefined;
  return { kind, inTurns: !!kind && kind.increment >= kind.duration && !kind.lengths.length };
};

export function useMonth({ bookings, types, schedule, type: only, slots, now = Date.now() }: CalendarOptions): MonthState {
  const tz = schedule.timeZone;
  const today = clockAt(now, tz).day;
  const [month, setMonth] = useState(today.slice(0, 7));
  const { kind, inTurns } = kindOf(types, only);
  const places = kind ? Math.max(1, kind.capacity) * Math.max(1, kind.resources.length) : 1;

  const byDay = useMemo(() => {
    const days = new Map<string, Booking[]>();
    for (const b of bookings.filter((b) => b.status === 'confirmed' && (!only || b.type === only)).sort((a, b) => a.start.localeCompare(b.start))) {
      const { day } = clockAt(Date.parse(b.start), tz);
      days.set(day, [...(days.get(day) ?? []), b]);
    }
    return days;
  }, [bookings, only, tz]);
  const gaps = useMemo(() => (slots && kind ? slotsByDay(slots, tz) : null), [slots, kind, tz]);

  const weeks = useMemo(
    () =>
      monthOf(month).map((week) =>
        week.map((day): MonthDay | null => {
          if (!day) return null;
          const booked = byDay.get(day) ?? [];
          const past = day < today;
          const turns: Turn[] = [];
          if (inTurns && kind)
            for (const [n, t] of startsOn(kind, schedule, day).entries()) {
              const who = booked.filter((b) => Date.parse(b.start) < t.end && Date.parse(b.end) > t.start);
              // The places free as the server says them, if they are given; else as many as are not taken.
              const gap = gaps?.get(day)?.find((g) => Date.parse(g.start) === t.start) ?? null;
              const free = gaps ? (gap?.free ?? 0) : places - who.length;
              // A turn nobody has that is gone by, or that may not be booked (too soon, too far ahead), says nothing.
              if (!who.length && (past || (gaps && !gap))) continue;
              turns.push({ n: n + 1, start: t.start, end: t.end, who, free: past ? 0 : free, gap });
            }
          return { day, today: day === today, past, bookings: booked, turns, gaps: gaps?.get(day) ?? [] };
        }),
      ),
    [month, byDay, today, inTurns, kind, schedule, gaps, places],
  );

  return {
    month,
    setMonth,
    moveMonth: (by) => {
      const [y, m] = month.split('-').map(Number);
      const d = new Date(Date.UTC(y, m - 1 + by, 1));
      setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
    },
    today,
    kind,
    inTurns,
    weeks,
    ahead: slots && kind ? (inTurns ? slots.reduce((n, s) => n + s.free, 0) : slots.length) : 0,
    firstGap: gaps ? ([...gaps.keys()][0] ?? null) : null,
  };
}

/** A column of a day: a resource, a place of a turn (its number), or the owner alone. */
export interface DayColumn {
  id: string;
  name: string;
  image: string;
  /** For the places of a turn, which: 1, 2…; 0 otherwise. */
  place: number;
}

/** A row of a day: its minute and instant, for each column the gap to give there if there is one, and whether that column works then. */
export interface DayRow {
  minute: number;
  at: number | null;
  gaps: (Slot | null)[];
  /** For each column, whether its resource is out of its own hours then: a barber who has not come yet. */
  off: boolean[];
}

/** A booking where it goes: its column, its first row, and how many rows it takes. */
export interface DayBlock {
  booking: Booking;
  column: number;
  row: number;
  span: number;
}

export interface DayState {
  day: string;
  setDay: (day: string) => void;
  moveDay: (by: number) => void;
  today: string;
  kind: EventType | undefined;
  /** No hours that day. */
  closed: boolean;
  /** The minutes of a row. */
  step: number;
  columns: DayColumn[];
  rows: DayRow[];
  blocks: DayBlock[];
  /** How many gaps the day has, of all its columns. */
  free: number;
  /** Where now is, in rows from the first; none when the day is not today. */
  now: number | null;
  /** What is busy in the owner's own calendar that day, where it goes: across every column. */
  away: { start: string; end: string; title?: string; row: number; span: number }[];
}

export function useDay({ bookings, types, schedule, type: only, slots, now = Date.now(), day: given, onDay, away = [] }: CalendarOptions & { day?: string; onDay?: (day: string) => void }): DayState {
  const tz = schedule.timeZone;
  const today = clockAt(now, tz).day;
  const [own, setOwn] = useState(given ?? today);
  const day = given ?? own;
  const setDay = (d: string) => {
    setOwn(d);
    onDay?.(d);
  };
  const { kind } = kindOf(types, only);

  // The columns: each resource, each place of a turn, or the owner alone.
  const columns = useMemo(
    (): DayColumn[] =>
      kind?.resources.length
        ? kind.resources.map((r) => ({ id: r.id, name: r.name, image: r.image, place: 0 }))
        : Array.from({ length: kind ? Math.max(1, kind.capacity) : 1 }, (_, i) => ({ id: '', name: '', image: '', place: kind && kind.capacity > 1 ? i + 1 : 0 })),
    [kind],
  );

  // The rows: from the earliest opening of the day to its latest closing, a row each step.
  const step = kind ? kind.increment || kind.duration : Math.min(30, ...types.map((t) => t.increment || t.duration));
  // The kind's hours, and those of each resource with hours of its own: the day from the first opening to the last closing of any.
  const ownHours = kind?.resources.filter((r) => r.hours).map((r) => r.hours as EventType['hours']) ?? [];
  const hours = [...(ownHours.length && kind?.resources.every((r) => r.hours) ? [] : [kind?.hours ?? null]), ...ownHours].flatMap((set) => hoursOf(schedule, day, set));
  const open = Math.min(...hours.map((h) => minutesOf(h.from) ?? 24 * 60));
  const close = Math.max(...hours.map((h) => minutesOf(h.to) ?? 0));
  const count = hours.length ? Math.max(1, Math.ceil((close - open) / step)) : 0;
  const minuteOf = (ms: number) => clockAt(ms, tz).minute;

  // The day's bookings, each in its column: its resource's, or the first place free at its time.
  const blocks = useMemo(() => {
    // Its bookings, and those of other kinds that take its resources (a barber's cut and his beard trim, in his column).
    const ours = (b: Booking) => !only || b.type === only || (!!kind?.resources.length && kind.resources.some((r) => r.id === b.resource));
    const mine = bookings.filter((b) => b.status === 'confirmed' && ours(b) && clockAt(Date.parse(b.start), tz).day === day).sort((a, b) => a.start.localeCompare(b.start));
    const ends: number[] = columns.map(() => 0);
    return mine.map((booking): DayBlock => {
      const s = Date.parse(booking.start);
      let column = kind?.resources.length ? columns.findIndex((c) => c.id === booking.resource) : ends.findIndex((e) => e <= s);
      if (column < 0) column = 0;
      ends[column] = Math.max(ends[column], Date.parse(booking.end));
      const row = Math.max(0, Math.round((clockAt(s, tz).minute - open) / step));
      const span = Math.max(1, Math.min(count - row, Math.ceil((Date.parse(booking.end) - s) / 60_000 / step)));
      return { booking, column, row, span };
    });
  }, [bookings, only, tz, day, columns, kind, open, step, count]);

  // The gaps, by their start: the slot each column may be given at, that very resource's.
  const gapsAt = useMemo(() => {
    const at = new Map<number, (Slot | null)[]>();
    for (const slot of slots ?? []) {
      const s = Date.parse(slot.start);
      if (clockAt(s, tz).day !== day) continue;
      const taken = new Set(blocks.filter((p) => Date.parse(p.booking.start) < Date.parse(slot.end) && Date.parse(p.booking.end) > s).map((p) => p.column));
      if (kind?.resources.length)
        at.set(
          s,
          columns.map((c) => (slot.resources?.includes(c.id) ? { ...slot, resources: [c.id] } : null)),
        );
      else {
        let left = slot.free;
        at.set(
          s,
          columns.map((_, i) => (!taken.has(i) && left-- > 0 ? slot : null)),
        );
      }
    }
    return at;
  }, [slots, tz, day, blocks, columns, kind]);

  const rows = Array.from({ length: count }, (_, r): DayRow => {
    const minute = open + r * step;
    const at = instantOf(day, minute, tz);
    return {
      minute,
      at,
      gaps: (at === null ? undefined : gapsAt.get(at)) ?? columns.map(() => null),
      off: columns.map((c) => !!c.id && !works(kind!, schedule, c.id, day, minute, minute + step)),
    };
  });

  // The owner's own calendar, as much of it as falls in the day's rows.
  const dayStart = count ? instantOf(day, open, tz) : null;
  const awayOf =
    dayStart === null
      ? []
      : away.flatMap((a) => {
          const from = Math.max(0, (Date.parse(a.start) - dayStart) / 60_000 / step);
          const to = Math.min(count, (Date.parse(a.end) - dayStart) / 60_000 / step);
          return to > from ? [{ ...a, row: Math.floor(from), span: Math.max(1, Math.ceil(to) - Math.floor(from)) }] : [];
        });

  return {
    away: awayOf,
    day,
    setDay,
    moveDay: (by) => setDay(addDays(day, by)),
    today,
    kind,
    closed: count === 0,
    step,
    columns,
    rows,
    blocks,
    free: [...gapsAt.values()].reduce((n, g) => n + g.filter(Boolean).length, 0),
    now: day === today && count ? (minuteOf(now) - open) / step : null,
  };
}

/** A booking where it goes in a week: its day's column, its first row, how many rows, and its lane among those that overlap it. */
export interface WeekBlock extends DayBlock {
  lane: number;
  lanes: number;
}

export interface WeekState {
  /** The seven days shown, Monday first. */
  days: string[];
  setDay: (day: string) => void;
  moveWeek: (by: number) => void;
  today: string;
  kind: EventType | undefined;
  step: number;
  /** The rows: their minute, and for each day its instant then and the gap to give there, if there is one. */
  rows: { minute: number; at: (number | null)[]; gaps: (Slot | null)[] }[];
  blocks: WeekBlock[];
  /** How many gaps the week has. */
  free: number;
  /** Where now is: today's column and its row; none when the week is not this one. */
  now: { column: number; row: number } | null;
  closed: boolean;
}

/** The Monday of a day's week. */
const mondayOf = (day: string) => addDays(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7));

export function useWeek({ bookings, types, schedule, type: only, slots, now = Date.now(), day: given, onDay }: CalendarOptions & { day?: string; onDay?: (day: string) => void }): WeekState {
  const tz = schedule.timeZone;
  const today = clockAt(now, tz).day;
  const [own, setOwn] = useState(given ?? today);
  const monday = mondayOf(given ?? own);
  const setDay = (d: string) => {
    setOwn(d);
    onDay?.(d);
  };
  const { kind } = kindOf(types, only);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  // The rows: from the earliest opening of any day of the week to its latest closing, of the kind (and its resources' own hours) or of all.
  const step = Math.min(60, kind ? kind.increment || kind.duration : 30);
  const sets = (kind ? [kind] : types).flatMap((t) => [t.hours, ...t.resources.filter((r) => r.hours).map((r) => r.hours as EventType['hours'])]);
  const hours = days.flatMap((d) => sets.flatMap((set) => hoursOf(schedule, d, set)));
  const open = Math.floor(Math.min(...hours.map((h) => minutesOf(h.from) ?? 24 * 60)) / step) * step;
  const close = Math.max(...hours.map((h) => minutesOf(h.to) ?? 0));
  const count = hours.length ? Math.max(1, Math.ceil((close - open) / step)) : 0;

  const blocks = useMemo(() => {
    const ours = (b: Booking) => !only || b.type === only || (!!kind?.resources.length && kind.resources.some((r) => r.id === b.resource || b.seats?.includes(r.id)));
    const out: WeekBlock[] = [];
    Array.from({ length: 7 }, (_, i) => addDays(monday, i)).forEach((day, column) => {
      const mine = bookings.filter((b) => b.status === 'confirmed' && ours(b) && clockAt(Date.parse(b.start), tz).day === day).sort((a, b) => a.start.localeCompare(b.start));
      // Side by side, those that overlap: each the first lane free when it begins.
      const ends: number[] = [];
      const placed = mine.map((booking) => {
        const s = Date.parse(booking.start);
        let lane = ends.findIndex((e) => e <= s);
        if (lane < 0) lane = ends.length;
        ends[lane] = Date.parse(booking.end);
        const row = Math.max(0, Math.round((clockAt(s, tz).minute - open) / step));
        const span = Math.max(1, Math.min(count - row, Math.ceil((Date.parse(booking.end) - s) / 60_000 / step)));
        return { booking, column, row, span, lane, lanes: 1 };
      });
      for (const p of placed) p.lanes = Math.max(1, ...placed.filter((q) => q.row < p.row + p.span && q.row + q.span > p.row).map((q) => q.lane + 1));
      out.push(...placed.filter((p) => p.row < count));
    });
    return out;
  }, [bookings, only, kind, tz, monday, open, step, count]);

  const rows = Array.from({ length: count }, (_, r) => {
    const minute = open + r * step;
    const at = days.map((d) => instantOf(d, minute, tz));
    return {
      minute,
      at,
      // A gap that begins in this row of the day: the first of them.
      gaps: at.map((t) => (t === null ? null : ((slots ?? []).find((s) => Date.parse(s.start) >= t && Date.parse(s.start) < t + step * 60_000) ?? null))),
    };
  });
  const column = days.indexOf(today);

  return {
    days,
    setDay,
    moveWeek: (by) => setDay(addDays(monday, by * 7)),
    today,
    kind,
    step,
    rows,
    blocks,
    free: rows.reduce((n, r) => n + r.gaps.filter(Boolean).length, 0),
    now: column >= 0 && count ? { column, row: (clockAt(now, tz).minute - open) / step } : null,
    closed: count === 0,
  };
}
