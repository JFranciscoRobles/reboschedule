// All that booking is, without what it looks like: the kind and whose it is,
// the lengths and the resources to choose, the times free laid out by the
// days of whoever books (in their time zone, which they may change), the month
// shown and its weeks, the day chosen and its times in the parts of a day,
// the time chosen, and the booking, sent to the server and checked again
// there. `BookingWidget` is drawn on it; a widget of one's own can be too.

import { type Booking, type Coupon, clockAt, couponFits, discountOf, type EventType, lengthsOf, type Money, monthOf, type Repeat, type Slot, slotsByDay, type Waiting } from '@reboschedule/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type HeldState, useHeld } from './useHeld';

/** What the server says of a booking made. */
export interface Booked {
  booking: Booking;
  /** Every booking of it, when it was booked every week; the one alone otherwise. */
  series?: Booking[];
  /** The times of the series that were not free. */
  skipped?: string[];
  type: EventType;
  organizer: { name: string };
  manage: string;
  ics: string;
  google: string;
  /** Held while it is paid for: where to pay it, and until when its place is kept. */
  pay?: string;
  until?: string;
  /** Its entry code, when the server gives tickets: to draw as a QR. */
  ticket?: string;
}

/** Who books, and what they answered. */
export interface Visitor {
  name: string;
  email: string;
  answers?: Record<string, string>;
}

/** A problem the server said of a booking: its code (`taken`, `no-name`, `bad-email`, `missing-answer`), and its words. */
export interface Problem {
  code: string;
  message: string;
}

export interface UseBookingOptions {
  /** Where the kind's routes are: `https://example.com/s/court`, its `/slots` and `/book`. */
  endpoint: string;
  /** The time zone of whoever books; their browser's unless said. */
  timeZone?: string;
  /** Told each booking made, as the server answered it. */
  onBooked?: (booked: Booked) => void;
  /** A fetch of one's own: a header to add, a test, a demo with no server. */
  fetch?: typeof fetch;
}

/** The parts of a day, as the clock of whoever books says them. */
export type DayPart = 'morning' | 'afternoon' | 'evening';

export interface BookingState extends HeldState {
  /** Asking for the times; or they could not be had; or here they are. */
  status: 'loading' | 'failed' | 'ready';
  /** The kind, without where it is (told only to whoever books it); none while loading. */
  type: EventType | null;
  organizer: { name: string } | null;
  /** The owner's time zone, as their hours are said. */
  ownerTimeZone: string;
  /** The time zone the times are laid out in: whoever books. */
  timeZone: string;
  setTimeZone: (timeZone: string) => void;
  /** The lengths the kind may be booked for, the shortest first, and the one chosen. */
  lengths: number[];
  length: number;
  setLength: (minutes: number) => void;
  /** How many places together (tickets of a concert): only the times with that many left, priced for all of them. */
  places: number;
  setPlaces: (places: number) => void;
  /** The resource chosen, `''` for any free; its times are asked for alone, priced as it. */
  resource: string;
  setResource: (id: string) => void;
  /** The times free, by the days of whoever books. */
  days: Map<string, Slot[]>;
  /** The month shown (`YYYY-MM`), its weeks (Monday first, days or none), and moving it. */
  month: string;
  weeks: (string | null)[][];
  setMonth: (month: string) => void;
  moveMonth: (by: number) => void;
  /** The day chosen, while it has times; else the first of the month shown that has. */
  day: string | null;
  setDay: (day: string) => void;
  /** The times of that day, and the same in the parts of the day. */
  times: Slot[];
  parts: { part: DayPart; times: Slot[] }[];
  /** The price, when every time of the day has the same: said once, not at each. */
  dayPrice: Money | null;
  /** The time chosen, to book; none to choose again. A time whose `resources` is one alone books that one. */
  slot: Slot | null;
  choose: (slot: Slot | null) => void;
  /** Sends the booking of the time chosen, every week if `repeat` says so and the kind lets it; the booking made, or none and `problems`. A time taken a moment ago asks for the times again. */
  book: (visitor: Visitor, options?: { repeat?: Repeat; seats?: string[] }) => Promise<Booked | null>;
  sending: boolean;
  problems: Problem[];
  /** The booking made; `again()` to book another. */
  booked: Booked | null;
  again: () => void;
  /** Asks for the times again. */
  reload: () => Promise<void>;
  /** Whether the server takes discount codes; the code written, and the discount it is when it is good for this kind. */
  coupons: boolean;
  coupon: string;
  setCoupon: (code: string) => void;
  applied: Coupon | null;
  /** What the code takes off places that cost so much each, at a time: a Tuesday's two for one only on Tuesdays. */
  discountFor: (units: number[], start: string) => number;
  /** Whether the server keeps a waitlist; the times that are full, to wait for one; waiting for one, and who waits. */
  waitlist: boolean;
  full: string[];
  wait: (visitor: Visitor, start: string, options?: { places?: number; resource?: string }) => Promise<boolean>;
  waiting: Waiting | null;
}

/** What the server says of a kind: it, whose it is, its time zone, its times free. */
interface Free {
  type: EventType;
  organizer: { name: string };
  timeZone: string;
  slots: Slot[];
  coupons?: boolean;
  coupon?: Coupon | null;
  waitlist?: boolean;
  full?: string[];
}

/** What a code takes off places that cost so much each, if it is good for a kind at a time (its days, in the owner's time zone). */
export const discountWith = (coupon: Coupon | null | undefined, type: EventType | null, timeZone: string, units: number[], start: string) =>
  coupon && type && start && couponFits(coupon, type, start, { timeZone, weekly: {} as never, dates: {} }) ? discountOf(coupon, units) : 0;

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export function useBooking({ endpoint, timeZone: given, onBooked, fetch: send = globalThis.fetch.bind(globalThis) }: UseBookingOptions): BookingState {
  const [timeZone, setTimeZone] = useState(given ?? browserZone());
  const [free, setFree] = useState<Free | null>(null);
  const [failed, setFailed] = useState(false);
  const [month, setMonth] = useState('');
  const [chosenDay, setChosenDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [booked, setBooked] = useState<Booked | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [sending, setSending] = useState(false);
  const [chosenLength, setChosenLength] = useState<number | null>(null);
  const [resource, setChosenResource] = useState('');
  const [places, setChosenPlaces] = useState(1);
  const [coupon, setCoupon] = useState('');
  const [waiting, setWaiting] = useState<Waiting | null>(null);

  const reload = useCallback(async () => {
    try {
      // The times of the one chosen, priced as it, if one is.
      const q = new URLSearchParams();
      if (chosenLength) q.set('length', String(chosenLength));
      if (resource) q.set('resource', resource);
      if (places > 1) q.set('places', String(places));
      if (coupon.trim()) q.set('coupon', coupon.trim());
      const answer = await send(`${endpoint}/slots${q.size ? `?${q}` : ''}`);
      if (!answer.ok) throw new Error(String(answer.status));
      setFree((await answer.json()) as Free);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [endpoint, send, chosenLength, resource, places, coupon]);
  useEffect(() => void reload(), [reload]);

  const type = free?.type ?? null;
  // The times of the one chosen, or of any.
  const days = useMemo(() => (free ? slotsByDay(resource ? free.slots.filter((s) => s.resources?.includes(resource)) : free.slots, timeZone) : new Map<string, Slot[]>()), [free, timeZone, resource]);
  const first = [...days.keys()][0];
  // The month of the first day free, until another is chosen.
  const shown = month || (first ?? clockAt(Date.now(), timeZone).day).slice(0, 7);
  const day = chosenDay && days.has(chosenDay) ? chosenDay : ([...days.keys()].find((d) => d.startsWith(shown)) ?? null);
  const times = day ? (days.get(day) ?? []) : [];
  const parts = (['morning', 'afternoon', 'evening'] as const)
    .map((part) => ({
      part,
      times: times.filter((s) => {
        const { minute } = clockAt(Date.parse(s.start), timeZone);
        return part === 'morning' ? minute < 12 * 60 : part === 'afternoon' ? minute >= 12 * 60 && minute < 18 * 60 : minute >= 18 * 60;
      }),
    }))
    .filter((p) => p.times.length);
  const prices = new Set(times.map((s) => s.price?.amount ?? null));
  const hold = useHeld({ send, onBooked, setBooked, setProblems, reload });
  const dayPrice = prices.size === 1 && times[0]?.price ? times[0].price : null;

  const book = async (visitor: Visitor, { repeat, seats }: { repeat?: Repeat; seats?: string[] } = {}): Promise<Booked | null> => {
    if (!slot) return null;
    setSending(true);
    setProblems([]);
    try {
      const answer = await send(`${endpoint}/book`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // A time chosen of one resource alone (a cell of a board of courts) books that one.
        body: JSON.stringify({
          start: slot.start,
          length: chosenLength ?? undefined,
          resource: (slot.resources?.length === 1 ? slot.resources[0] : resource) || undefined,
          timeZone,
          answers: {},
          repeat,
          seats,
          places: places > 1 ? places : undefined,
          coupon: coupon.trim() || undefined,
          ...visitor,
        }),
      });
      const body = await answer.json().catch(() => ({}));
      if (answer.ok) {
        // Held while it is paid for; or booked.
        if (hold.take(body as Booked)) return body as Booked;
        setBooked(body as Booked);
        onBooked?.(body as Booked);
        return body as Booked;
      }
      // What the server said was wrong; or, when it failed with nothing said (a 500), that it could not be.
      const said = (body.problems?.length ? body.problems : [{ code: 'failed', message: 'failed' }]) as Problem[];
      setProblems(said);
      // Taken a moment ago: the times as they are now, to choose another.
      if (said.some((p) => p.code === 'taken')) {
        setSlot(null);
        await reload();
      }
      return null;
    } catch {
      setProblems([{ code: 'failed', message: 'failed' }]);
      return null;
    } finally {
      setSending(false);
    }
  };

  return {
    status: failed ? 'failed' : free ? 'ready' : 'loading',
    type,
    organizer: free?.organizer ?? null,
    ownerTimeZone: free?.timeZone ?? timeZone,
    timeZone,
    setTimeZone,
    lengths: type ? lengthsOf(type).sort((a, b) => a - b) : [],
    length: chosenLength ?? type?.duration ?? 0,
    setLength: (n) => {
      setChosenLength(n);
      setProblems([]);
    },
    places,
    setPlaces: (n) => {
      setChosenPlaces(Math.max(1, n));
      setProblems([]);
    },
    resource,
    setResource: (id) => {
      setChosenResource(id);
      setChosenDay(null);
      setProblems([]);
    },
    days,
    month: shown,
    weeks: monthOf(shown),
    setMonth,
    moveMonth: (by) => {
      const [y, m] = shown.split('-').map(Number);
      const d = new Date(Date.UTC(y, m - 1 + by, 1));
      setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
    },
    day,
    setDay: setChosenDay,
    times,
    parts,
    dayPrice,
    slot,
    choose: (s) => {
      setSlot(s);
      setProblems([]);
    },
    book,
    sending,
    problems,
    booked,
    held: hold.held,
    check: hold.check,
    release: hold.release,
    coupons: !!free?.coupons,
    coupon,
    setCoupon: (code) => {
      setCoupon(code.toUpperCase());
      setProblems([]);
    },
    applied: free?.coupon ?? null,
    discountFor: (units, start) => discountWith(free?.coupon, type, free?.timeZone ?? timeZone, units, start),
    waitlist: !!free?.waitlist,
    full: free?.full ?? [],
    waiting,
    wait: async (visitor, start, { places: n = places, resource: r = resource } = {}) => {
      const answer = await send(`${endpoint}/wait`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ start, places: n, resource: r || undefined, ...visitor }),
      }).catch(() => null);
      if (answer?.status === 201) {
        setWaiting(((await answer.json()) as { waiting: Waiting }).waiting);
        return true;
      }
      // A place is free after all: the times as they are now.
      if (answer?.status === 409) await reload();
      return false;
    },
    again: () => {
      setBooked(null);
      setSlot(null);
      setProblems([]);
      void reload();
    },
    reload,
  };
}
