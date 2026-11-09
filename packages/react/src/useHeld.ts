// A booking held while it is paid for, as the hooks keep it: where to pay it
// and until when; asked again of its own address, to know when it is paid;
// let go by whoever booked it, its place free again; and when its minutes run
// out, gone by itself, the times asked again.

import { useEffect, useState } from 'react';
import type { Booked, Problem } from './useBooking';

/** A booking held: where to pay it, until when its place is kept. */
export type Held = Booked & { pay: string; until: string };

export interface HeldState {
  /** The booking held while it is paid for; none when nothing is. */
  held: Held | null;
  /** Its own address asked again: whether it is paid (and booked) now. */
  check: () => Promise<boolean>;
  /** Let go: cancelled, its place free again. */
  release: () => Promise<void>;
}

export function useHeld(options: {
  send: typeof fetch;
  onBooked?: (booked: Booked) => void;
  setBooked: (booked: Booked) => void;
  setProblems: (problems: Problem[]) => void;
  reload: () => Promise<void> | void;
}): HeldState & { take: (body: Booked) => boolean } {
  const { send, onBooked, setBooked, setProblems, reload } = options;
  const [held, setHeld] = useState<Held | null>(null);

  // Its minutes run out: gone, and the times as they are now.
  useEffect(() => {
    if (!held) return;
    const left = Date.parse(held.until) - Date.now();
    const timer = setTimeout(
      () => {
        setHeld(null);
        setProblems([{ code: 'run-out', message: 'run-out' }]);
        void reload();
      },
      Math.max(0, left),
    );
    return () => clearTimeout(timer);
  }, [held, reload, setProblems]);

  return {
    held,
    /** What the server answered, kept if it is held: whether it was. */
    take: (body) => {
      if (body.booking?.status !== 'held' || !body.pay || !body.until) return false;
      setHeld(body as Held);
      return true;
    },
    check: async () => {
      if (!held) return false;
      const body = (await (await send(held.manage)).json().catch(() => ({}))) as Booked;
      if (body.booking?.status === 'confirmed') {
        setHeld(null);
        setBooked(body);
        onBooked?.(body);
        return true;
      }
      if (body.booking?.status === 'cancelled') {
        setHeld(null);
        void reload();
      }
      return false;
    },
    release: async () => {
      if (!held) return;
      await send(`${held.manage}/cancel`, { method: 'POST' }).catch(() => null);
      setHeld(null);
      await reload();
    },
  };
}
