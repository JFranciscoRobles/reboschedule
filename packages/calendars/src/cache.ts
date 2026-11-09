// What is busy, asked for less often: each reading kept a while, by what was
// asked; and several calendars read as one.

import type { Busy } from '@reboschedule/core';

/** A reading of what is busy, kept `ms` (a minute unless said) for the same `from` and `to`; a failed one is not kept. */
export function cachedBusy<T extends Busy>(read: (from: string, to: string) => Promise<T[]>, ms = 60_000, now = Date.now) {
  const kept = new Map<string, { at: number; busy: Promise<T[]> }>();
  return (from: string, to: string): Promise<T[]> => {
    const key = `${from}|${to}`;
    const hit = kept.get(key);
    if (hit && now() - hit.at < ms) return hit.busy;
    const busy = read(from, to);
    kept.set(key, { at: now(), busy });
    busy.catch(() => kept.delete(key));
    return busy;
  };
}

/** Several readings as one: what is busy in any of them. One that fails is left out, so one calendar away does not close the others. */
export function combineBusy<T extends Busy>(...reads: ((from: string, to: string) => Promise<T[]> | T[])[]) {
  return async (from: string, to: string): Promise<T[]> => {
    const all = await Promise.allSettled(reads.map((read) => read(from, to)));
    return all.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  };
}
