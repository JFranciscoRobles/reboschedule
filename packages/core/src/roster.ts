// A roster: the turns of a month given to the members of each group, as an
// office gives its shifts. Each group (a division: residential, commercial)
// is a resource of the kind, its members those who may cover it; each day,
// each turn of each group, one of them. Given automatically, as evenly as
// can be: whoever has fewer turns first, none on a day they said they
// cannot, none twice the same day while another may; the turns already given
// kept. And the turns changed between members: one swapped for another's,
// or given to someone to cover; each a new version, to tell both.

import type { Booking, EventType, Schedule } from './model';
import { newId } from './read';
import { startsOn } from './slots';
import { addDays, clockAt, type Day } from './time';

/** Someone who may cover the turns of a group. */
export interface Member {
  id: string;
  name: string;
  email: string;
  /** The id of the group they cover: a resource of the kind. */
  group: string;
}

/** A turn of the roster: when, of which group. */
export interface RosterTurn {
  day: Day;
  start: string;
  end: string;
  group: string;
}

export interface RosterOptions {
  type: EventType;
  schedule: Schedule;
  /** The month, `YYYY-MM`. */
  month: string;
  members: Member[];
  /** The days each member cannot, by their id. */
  unavailable?: Record<string, Day[]>;
  /** The turns already given: kept, and counted. */
  bookings?: Booking[];
  /** The first day to give; the first of the month unless said (today, to leave the past as it was). */
  from?: Day;
}

export interface RosterResult {
  /** The turns given now. */
  bookings: Booking[];
  /** The turns no member could cover. */
  unfilled: RosterTurn[];
}

/** The turns of a month, of every group of a kind, from a day. */
export function turnsOf(type: EventType, schedule: Schedule, month: string, from?: Day): RosterTurn[] {
  const groups = type.resources.length ? type.resources.map((r) => r.id) : [''];
  const out: RosterTurn[] = [];
  for (let day = `${month}-01`; day.startsWith(month); day = addDays(day, 1)) {
    if (from && day < from) continue;
    for (const t of startsOn(type, schedule, day)) for (const group of groups) out.push({ day, start: new Date(t.start).toISOString(), end: new Date(t.end).toISOString(), group });
  }
  return out;
}

/** A turn given to a member, as a booking. */
export const turnBooking = (turn: RosterTurn, member: Member, type: EventType, schedule: Schedule): Booking => ({
  id: newId() + newId(),
  type: type.id,
  resource: turn.group,
  start: turn.start,
  end: turn.end,
  name: member.name,
  email: member.email,
  member: member.id,
  timeZone: schedule.timeZone,
  answers: {},
  status: 'confirmed',
  created: new Date().toISOString(),
});

/** The turns of a month given as evenly as can be, to whoever may cover each; those given before kept. */
export function assignRoster({ type, schedule, month, members, unavailable = {}, bookings = [], from }: RosterOptions): RosterResult {
  const given = bookings.filter((b) => b.status === 'confirmed' && b.type === type.id);
  const dayOf = (iso: string) => clockAt(Date.parse(iso), schedule.timeZone).day;
  // How many turns each has this month, and on which days: what keeps it even.
  const count = new Map<string, number>(members.map((m) => [m.id, 0]));
  const days = new Map<string, Set<Day>>(members.map((m) => [m.id, new Set()]));
  const who = (b: Booking) => b.member ?? members.find((m) => m.email === b.email)?.id;
  for (const b of given) {
    const id = who(b);
    if (!id || !dayOf(b.start).startsWith(month)) continue;
    count.set(id, (count.get(id) ?? 0) + 1);
    days.get(id)?.add(dayOf(b.start));
  }
  // How many of each turn of the day (the morning's, the afternoon's) each has: so the mornings go round too.
  const minuteOf = (iso: string) => clockAt(Date.parse(iso), schedule.timeZone).minute;
  const at = new Map<string, number>();
  const atKey = (id: string, iso: string) => `${id}|${minuteOf(iso)}`;
  for (const b of given) {
    const id = who(b);
    if (id && dayOf(b.start).startsWith(month)) at.set(atKey(id, b.start), (at.get(atKey(id, b.start)) ?? 0) + 1);
  }
  const taken = new Set(given.map((b) => `${b.resource}|${Date.parse(b.start)}`));
  const out: Booking[] = [];
  const unfilled: RosterTurn[] = [];
  for (const turn of turnsOf(type, schedule, month, from)) {
    if (taken.has(`${turn.group}|${Date.parse(turn.start)}`)) continue;
    const can = members.filter((m) => m.group === turn.group && !unavailable[m.id]?.includes(turn.day));
    // Whoever is not on that day already; then fewer turns; then fewer of this turn of the day; then by name, to be the same each time.
    const pick = [...can].sort(
      (a, b) =>
        Number(days.get(a.id)?.has(turn.day)) - Number(days.get(b.id)?.has(turn.day)) ||
        (count.get(a.id) ?? 0) - (count.get(b.id) ?? 0) ||
        (at.get(atKey(a.id, turn.start)) ?? 0) - (at.get(atKey(b.id, turn.start)) ?? 0) ||
        a.name.localeCompare(b.name),
    )[0];
    if (!pick) {
      unfilled.push(turn);
      continue;
    }
    out.push(turnBooking(turn, pick, type, schedule));
    count.set(pick.id, (count.get(pick.id) ?? 0) + 1);
    at.set(atKey(pick.id, turn.start), (at.get(atKey(pick.id, turn.start)) ?? 0) + 1);
    days.get(pick.id)?.add(turn.day);
  }
  return { bookings: out, unfilled };
}

/** A change of turns asked by one member of another: their turns swapped, or theirs covered. */
export interface SwapRequest {
  id: string;
  /** The turn of whoever asks. */
  from: string;
  /** The turn of the other, to swap with; none, to be covered by them. */
  to: string | null;
  /** Who asks, and of whom: members' ids. */
  by: string;
  with: string;
  status: 'pending' | 'accepted' | 'declined';
  created: string;
}

/** Why a change may not be: the other is not of the group, or cannot that day, or is on that turn's day already. */
export type SwapProblem = 'other-group' | 'unavailable' | 'same-member';

export function swapProblems(a: Booking, b: Booking | null, by: Member, other: Member, unavailable: Record<string, Day[]> = {}, timeZone = 'UTC'): SwapProblem[] {
  const day = (iso: string) => clockAt(Date.parse(iso), timeZone).day;
  const out: SwapProblem[] = [];
  if (by.id === other.id) out.push('same-member');
  if (other.group !== a.resource || (b && by.group !== b.resource)) out.push('other-group');
  if (unavailable[other.id]?.includes(day(a.start)) || (b && unavailable[by.id]?.includes(day(b.start)))) out.push('unavailable');
  return out;
}

/** The members of two turns exchanged, each a new version. */
export function swapBookings(a: Booking, b: Booking): [Booking, Booking] {
  const of = (x: Booking) => ({ name: x.name, email: x.email, member: x.member });
  return [
    { ...a, ...of(b), sequence: (a.sequence ?? 0) + 1 },
    { ...b, ...of(a), sequence: (b.sequence ?? 0) + 1 },
  ];
}

/** A turn given to another member to cover, a new version. */
export const coverBooking = (a: Booking, member: Member): Booking => ({ ...a, name: member.name, email: member.email, member: member.id, sequence: (a.sequence ?? 0) + 1 });
