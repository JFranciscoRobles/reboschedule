// Whoever waits for a time that is full: a show, a court, a class; told,
// the first first, when a place of it is free again (someone cancelled, a
// hold ran out), with where to book it. Telling is the application's.

import { newId } from './read';

/** Someone waiting for a time of a kind: how many places, of which resource if they said. */
export interface Waiting {
  id: string;
  /** The id of the kind. */
  type: string;
  /** The time, ISO in UTC. */
  start: string;
  resource?: string;
  places: number;
  name: string;
  email: string;
  created: string;
  /** When they were told a place was free, ISO: told once. */
  offered?: string;
}

const object = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});
const text = (v: unknown, most: number) => (typeof v === 'string' ? v.slice(0, most).trim() : '');

/** Someone asking to wait, as they ask it: a time, a name, an email that may be one; none otherwise. */
export function readWaiting(given: unknown, type: string, now = Date.now()): Waiting | null {
  const w = object(given);
  const start = text(w.start, 40);
  const email = text(w.email, 200);
  const name = text(w.name, 120);
  if (Number.isNaN(Date.parse(start)) || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const places = typeof w.places === 'number' ? Math.min(20, Math.max(1, Math.round(w.places))) : 1;
  return {
    id: newId() + newId(),
    type,
    start: new Date(Date.parse(start)).toISOString(),
    ...(text(w.resource, 40) ? { resource: text(w.resource, 40) } : {}),
    places,
    name,
    email,
    created: new Date(now).toISOString(),
  };
}
