// What is busy in Google Calendar, as its free/busy says it: the token is the
// app's, authorized with the scope `calendar.freebusy` (or `calendar.readonly`)
// as Google asks; this only reads, with it, what is taken of each calendar.

import type { Busy } from '@reboschedule/core';

export interface GoogleBusyOptions {
  /** An access token the app has, authorized by whoever's calendar it is. */
  accessToken: string;
  /** The calendars to read; `primary` unless said. */
  calendars?: string[];
  from: string;
  to: string;
  fetch?: typeof fetch;
}

export async function googleBusy({ accessToken, calendars = ['primary'], from, to, fetch: send = globalThis.fetch.bind(globalThis) }: GoogleBusyOptions): Promise<Busy[]> {
  const answer = await send('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ timeMin: from, timeMax: to, items: calendars.map((id) => ({ id })) }),
  });
  if (!answer.ok) throw new Error(`Google Calendar could not be read: ${answer.status}`);
  const body = (await answer.json()) as { calendars?: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }> };
  return Object.values(body.calendars ?? {})
    .flatMap((c) => c.busy ?? [])
    .map((b) => ({ start: new Date(b.start).toISOString(), end: new Date(b.end).toISOString() }));
}
