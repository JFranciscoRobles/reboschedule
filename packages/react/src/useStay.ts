// A stay, without what it looks like: the nights (or days) free of each
// resource, the month shown, the first and the last day chosen on it (one
// click each), how many nights, which cabin has all of them, what they cost,
// and the stay booked, checked again on the server.

import { addDays, type Coupon, type EventType, monthOf, type Night, quoteOf, stayResource, stayTimes, unitsOf } from '@reboschedule/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Booked, discountWith, type Problem, type Visitor } from './useBooking';
import { type HeldState, useHeld } from './useHeld';

export interface UseStayOptions {
  /** Where the kind's routes are: its `/stays` and `/book`. */
  endpoint: string;
  onBooked?: (booked: Booked) => void;
  fetch?: typeof fetch;
}

export interface StayState extends HeldState {
  status: 'loading' | 'failed' | 'ready';
  type: EventType | null;
  organizer: { name: string } | null;
  /** Each night (or day) free, by its day: the resources that have it. */
  nights: Map<string, string[]>;
  month: string;
  weeks: (string | null)[][];
  moveMonth: (by: number) => void;
  /** The first day, and the day one leaves (or the last, for days); one click each, a third begins again. */
  arrive: string | null;
  leave: string | null;
  pick: (day: string) => void;
  clear: () => void;
  /** Whether a day falls in the stay chosen. */
  within: (day: string) => boolean;
  /** How many nights (or days), and which resource has all of them, if one does: `null`, none. */
  units: number;
  resource: string;
  setResource: (id: string) => void;
  fits: string | null;
  /** What it would cost, as the kind's price says it: the server quotes it again. */
  price: { amount: number; currency: string } | null;
  book: (visitor: Visitor) => Promise<Booked | null>;
  /** Whether the server takes discount codes; the code written; the discount, when it is good for this kind; what it takes off the stay chosen (`price` is after it). */
  coupons: boolean;
  coupon: string;
  setCoupon: (code: string) => void;
  applied: Coupon | null;
  discount: number;
  sending: boolean;
  problems: Problem[];
  booked: Booked | null;
  again: () => void;
}

export function useStay({ endpoint, onBooked, fetch: send = globalThis.fetch.bind(globalThis) }: UseStayOptions): StayState {
  const [data, setData] = useState<{ type: EventType; organizer: { name: string }; timeZone?: string; nights: Night[]; coupons?: boolean; coupon?: Coupon | null } | null>(null);
  const [failed, setFailed] = useState(false);
  const [month, setMonth] = useState('');
  const [arrive, setArrive] = useState<string | null>(null);
  const [leave, setLeave] = useState<string | null>(null);
  const [resource, setResource] = useState('');
  const [sending, setSending] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [booked, setBooked] = useState<Booked | null>(null);
  const [coupon, setCoupon] = useState('');

  const load = useCallback(async () => {
    try {
      const answer = await send(`${endpoint}/stays${coupon.trim() ? `?coupon=${encodeURIComponent(coupon.trim())}` : ''}`);
      if (!answer.ok) throw new Error(String(answer.status));
      setData(await answer.json());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [endpoint, send, coupon]);
  useEffect(() => void load(), [load]);

  const nights = useMemo(() => new Map((data?.nights ?? []).map((n) => [n.day, n.resources])), [data]);
  const hold = useHeld({ send, onBooked, setBooked, setProblems, reload: load });
  const type = data?.type ?? null;
  const shown = month || ([...nights.keys()][0] ?? new Date().toISOString()).slice(0, 7);
  const units = type && arrive && leave ? unitsOf(type, arrive, leave) : 0;
  const fits = type && arrive && leave && units > 0 ? stayResource(type, data?.nights ?? [], arrive, leave, resource || undefined) : null;
  const quoted = type && fits !== null && units > 0 ? quoteOf(type, { resource: fits, nights: units }) : null;
  // The code's discount, each night costing the same; the price after it.
  const start = type && arrive && leave ? stayTimes(type, { timeZone: data?.timeZone ?? 'UTC', weekly: {} as never, dates: {} }, arrive, leave)?.start : undefined;
  const discount = quoted && start ? discountWith(data?.coupon, type, data?.timeZone ?? 'UTC', Array(units).fill(quoted.amount / units), start) : 0;
  const price = quoted ? { ...quoted, amount: Math.round((quoted.amount - discount) * 100) / 100 } : null;

  return {
    status: failed ? 'failed' : data ? 'ready' : 'loading',
    type,
    organizer: data?.organizer ?? null,
    nights,
    month: shown,
    weeks: monthOf(shown),
    moveMonth: (by) => {
      const [y, m] = shown.split('-').map(Number);
      const d = new Date(Date.UTC(y, m - 1 + by, 1));
      setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
    },
    arrive,
    leave,
    pick: (day) => {
      setProblems([]);
      if (!arrive || leave || day <= arrive) {
        setArrive(day);
        setLeave(null);
      } else setLeave(day);
    },
    clear: () => {
      setArrive(null);
      setLeave(null);
    },
    within: (day) => !!arrive && (leave ? day >= arrive && (type?.stay?.unit === 'day' ? day <= leave : day < leave) : day === arrive),
    units,
    resource,
    setResource: (id) => {
      setResource(id);
      setProblems([]);
    },
    fits,
    price,
    coupons: !!data?.coupons,
    coupon,
    setCoupon: (code) => {
      setCoupon(code.toUpperCase());
      setProblems([]);
    },
    applied: data?.coupon ?? null,
    discount,
    book: async (visitor) => {
      if (!arrive || !leave) return null;
      setSending(true);
      setProblems([]);
      try {
        const answer = await send(`${endpoint}/book`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            arrive,
            leave,
            resource: resource || undefined,
            coupon: coupon.trim() || undefined,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            answers: {},
            ...visitor,
          }),
        });
        const body = await answer.json().catch(() => ({}));
        if (answer.ok) {
          if (hold.take(body as Booked)) return body as Booked;
          setBooked(body as Booked);
          onBooked?.(body as Booked);
          return body as Booked;
        }
        setProblems(body.problems?.length ? body.problems : [{ code: 'failed', message: 'failed' }]);
        if ((body.problems ?? []).some((p: Problem) => p.code === 'taken')) await load();
        return null;
      } catch {
        setProblems([{ code: 'failed', message: 'failed' }]);
        return null;
      } finally {
        setSending(false);
      }
    },
    sending,
    problems,
    booked,
    held: hold.held,
    check: hold.check,
    release: hold.release,
    again: () => {
      setBooked(null);
      setArrive(null);
      setLeave(null);
      void load();
    },
  };
}

/** The days of a stay chosen, each one: for a strip of what was chosen. */
export const stayDays = (arrive: string, leave: string) => {
  const out: string[] = [];
  for (let d = arrive; d <= leave && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
};
