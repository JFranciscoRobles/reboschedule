// What is busy in Outlook, as Microsoft Graph's schedule says it: the token
// is the app's, authorized with `Calendars.Read`; this reads, with it, what
// is taken of each mailbox asked, all but what is marked free.

import type { Busy } from '@reboschedule/core';

export interface OutlookBusyOptions {
  accessToken: string;
  /** The mailboxes whose schedule to read: the owner's address. */
  schedules: string[];
  from: string;
  to: string;
  fetch?: typeof fetch;
}

export async function outlookBusy({ accessToken, schedules, from, to, fetch: send = globalThis.fetch.bind(globalThis) }: OutlookBusyOptions): Promise<Busy[]> {
  const answer = await send('https://graph.microsoft.com/v1.0/me/calendar/getSchedule', {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json', prefer: 'outlook.timezone="UTC"' },
    body: JSON.stringify({ schedules, startTime: { dateTime: from.replace(/Z$/, ''), timeZone: 'UTC' }, endTime: { dateTime: to.replace(/Z$/, ''), timeZone: 'UTC' }, availabilityViewInterval: 15 }),
  });
  if (!answer.ok) throw new Error(`Outlook could not be read: ${answer.status}`);
  const body = (await answer.json()) as { value?: { scheduleItems?: { status: string; start: { dateTime: string }; end: { dateTime: string } }[] }[] };
  // Graph says its times in the zone asked, UTC, without the Z.
  const utc = (dateTime: string) => new Date(/Z|[+-]\d\d:\d\d$/.test(dateTime) ? dateTime : `${dateTime}Z`).toISOString();
  return (body.value ?? [])
    .flatMap((s) => s.scheduleItems ?? [])
    .filter((i) => i.status !== 'free')
    .map((i) => ({ start: utc(i.start.dateTime), end: utc(i.end.dateTime) }));
}
