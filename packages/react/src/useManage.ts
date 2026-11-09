// A booking as whoever booked it sees it, from its own address, without what
// it looks like: when and what, what cancelling it now gives back, until
// when they may move it; the times (or first days, for a stay) it may move
// to, the same length, the same seats, the same nights; moved, or cancelled.

import { addDays, type Booking, clockAt, type EventType, type Money, type Night, type Slot, slotsByDay, stayResource, unitsOf } from '@reboschedule/core';
import { useCallback, useEffect, useState } from 'react';
import type { Problem } from './useBooking';

/** What the server says of a booking at its own address. */
export interface Managed {
  booking: Booking;
  type: EventType;
  organizer: { name: string };
  manage: string;
  ics: string;
  google: string;
  /** Where its kind's times are, to move it. */
  endpoint: string;
  /** Until when it may be moved by whoever booked it; none if it may not. */
  moveUntil: string | null;
  /** What cancelling it now gives back; none if nothing was paid. */
  refund: Money | null;
  pay?: string;
  until?: string;
}

export interface UseManageOptions {
  /** The booking's own address, as the server gave it: `https://example.com/s/b/…`. */
  address: string;
  /** The time zone of whoever booked; their browser's unless said. */
  timeZone?: string;
  fetch?: typeof fetch;
}

export interface ManageState {
  status: 'loading' | 'failed' | 'ready';
  managed: Managed | null;
  /** Whether it may still be moved, and cancelled. */
  canMove: boolean;
  canCancel: boolean;
  /** Choosing where to move it: the times it may move to by the days of whoever booked, or the first days of a stay. */
  choosing: boolean;
  choose: (on: boolean) => void;
  times: Map<string, Slot[]>;
  arrivals: string[];
  /** Moved to a time, or to a first day of a stay. */
  move: (to: string) => Promise<boolean>;
  cancel: () => Promise<boolean>;
  sending: boolean;
  problems: Problem[];
}

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export function useManage({ address, timeZone = browserZone(), fetch: send = globalThis.fetch.bind(globalThis) }: UseManageOptions): ManageState {
  const [managed, setManaged] = useState<Managed | null>(null);
  const [failed, setFailed] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [times, setTimes] = useState<Map<string, Slot[]>>(new Map());
  const [arrivals, setArrivals] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);

  const load = useCallback(async () => {
    try {
      const answer = await send(address);
      if (!answer.ok) throw new Error(String(answer.status));
      setManaged((await answer.json()) as Managed);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [address, send]);
  useEffect(() => void load(), [load]);

  // Where it may move to, asked when it is being chosen: the same length and places, or the same nights.
  useEffect(() => {
    if (!choosing || !managed) return;
    const { booking, type, endpoint } = managed;
    void (async () => {
      if (type.stay) {
        const { nights, timeZone: owner } = (await (await send(`${endpoint}/stays`)).json()) as { nights: Night[]; timeZone: string };
        const day = (iso: string) => clockAt(Date.parse(iso), owner).day;
        const n = unitsOf(type, day(booking.start), day(booking.end));
        // Its own nights are free to it: what it takes is not counted against it.
        const own = new Set<string>();
        for (let d = day(booking.start); d < day(booking.end); d = addDays(d, 1)) own.add(d);
        const mine = nights.map((x) => x);
        for (const d of own) {
          const at = mine.find((x) => x.day === d);
          if (at && !at.resources.includes(booking.resource)) at.resources = [...at.resources, booking.resource];
          if (!at) mine.push({ day: d, resources: [booking.resource] });
        }
        mine.sort((a, b) => a.day.localeCompare(b.day));
        // Not to a day already too close to change.
        const soonest = Date.now() + (type.reschedule ?? 0) * 3_600_000;
        const far = (d: string) => Date.parse(`${d}T23:59:59Z`) > soonest;
        setArrivals(mine.map((x) => x.day).filter((d) => d !== day(booking.start) && far(d) && stayResource(type, mine, d, addDays(d, type.stay?.unit === 'day' ? n - 1 : n)) !== null));
        return;
      }
      const q = new URLSearchParams({ length: String((Date.parse(booking.end) - Date.parse(booking.start)) / 60_000) });
      if (booking.places) q.set('places', String(booking.places));
      const { slots } = (await (await send(`${endpoint}/slots?${q}`)).json()) as { slots: Slot[] };
      // The same seats, each still free; or a place of its own resource, or of any.
      const soonest = Date.now() + (type.reschedule ?? 0) * 3_600_000;
      const fit = slots.filter((s) => s.start !== booking.start && Date.parse(s.start) >= soonest && (booking.seats?.length ? booking.seats.every((x) => s.resources?.includes(x)) : true));
      setTimes(slotsByDay(fit, timeZone));
    })().catch(() => setProblems([{ code: 'failed', message: 'failed' }]));
  }, [choosing, managed, send, timeZone]);

  const act = async (path: string, body: unknown) => {
    setSending(true);
    setProblems([]);
    try {
      const answer = await send(`${address}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const said = await answer.json().catch(() => ({}));
      if (answer.ok) {
        setManaged(said as Managed);
        setChoosing(false);
        return true;
      }
      setProblems(said.problems?.length ? said.problems : [{ code: 'failed', message: 'failed' }]);
      return false;
    } finally {
      setSending(false);
    }
  };

  const booking = managed?.booking;
  const live = !!booking && booking.status !== 'cancelled' && Date.parse(booking.start) > Date.now();
  return {
    status: failed ? 'failed' : managed ? 'ready' : 'loading',
    managed,
    canMove: live && booking?.status === 'confirmed' && !!managed?.moveUntil && Date.now() < Date.parse(managed.moveUntil),
    canCancel: live,
    choosing,
    choose: (on) => {
      setChoosing(on);
      setProblems([]);
    },
    times,
    arrivals,
    move: (to) => act('move', managed?.type.stay ? { arrive: to } : { start: to }),
    cancel: () => act('cancel', {}),
    sending,
    problems,
  };
}
