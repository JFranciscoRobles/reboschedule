// Each booking written in the owner's own calendar, Google's or Outlook's,
// as it changes: put when it is booked or moved, removed when it is
// cancelled. Found again by the booking's id (Google's event id made of it,
// an extended property in Outlook), so writing it twice changes it, never
// adds another. The token is the app's, with the scope to write events
// (`calendar.events`, `Calendars.ReadWrite`).

import type { Booking, EventType, Organizer } from '@reboschedule/core';

/** What writes bookings in a calendar: put (made or moved), or removed (cancelled). */
export interface CalendarWriter {
  put(booking: Booking, type: EventType, organizer: Organizer): Promise<void>;
  remove(booking: Booking): Promise<void>;
  /** Put if it is booked, removed if it is cancelled: what to call from `onBooked`, `onMoved` and `onCancelled`. */
  write(booking: Booking, type: EventType, organizer: Organizer): Promise<void>;
}

export interface WriterOptions {
  /** An access token the app has, authorized by whoever's calendar it is, to write events. */
  accessToken: string;
  /** The calendar written in: `primary` in Google, the default in Outlook, unless said. */
  calendar?: string;
  fetch?: typeof fetch;
}

/** What an event says of a booking: its kind and who, when, where, and the rest in its text. */
function eventOf(booking: Booking, type: EventType) {
  const what = type.resources.find((r) => r.id === booking.resource)?.name;
  const lines = [
    `${booking.name} <${booking.email}>`,
    ...(booking.seats?.length ? [booking.seats.join(', ')] : what ? [what] : []),
    ...(booking.places ? [`× ${booking.places}`] : []),
    ...Object.entries(booking.answers)
      .filter(([, v]) => v)
      .map(([k, v]) => `${type.questions.find((q) => q.id === k)?.label ?? k}: ${v}`),
    ...(booking.price ? [`${booking.price.amount} ${booking.price.currency}`] : []),
  ];
  return { title: `${type.title} · ${booking.name}`, text: lines.join('\n'), where: type.place.value };
}

const writeBoth = (w: Omit<CalendarWriter, 'write'>): CalendarWriter => ({
  ...w,
  write: (booking, type, organizer) => (booking.status === 'cancelled' ? w.remove(booking) : w.put(booking, type, organizer)),
});

/** Google's event id of a booking: base32hex, as Google asks; the hex of its id is that. */
const googleId = (booking: Booking) => `rs${[...new TextEncoder().encode(booking.id)].map((b) => b.toString(16).padStart(2, '0')).join('')}`;

export function googleWriter({ accessToken, calendar = 'primary', fetch: send = globalThis.fetch.bind(globalThis) }: WriterOptions): CalendarWriter {
  const at = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar)}/events`;
  const headers = { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' };
  return writeBoth({
    async put(booking, type) {
      const e = eventOf(booking, type);
      const body = {
        id: googleId(booking),
        summary: e.title,
        description: e.text,
        location: e.where || undefined,
        start: { dateTime: booking.start },
        end: { dateTime: booking.end },
        status: 'confirmed',
        extendedProperties: { private: { reboschedule: booking.id } },
      };
      // Changed if it is there; made if not.
      const put = await send(`${at}/${body.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (put.status === 404) {
        const made = await send(at, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!made.ok) throw new Error(`Google Calendar could not be written: ${made.status}`);
      } else if (!put.ok) throw new Error(`Google Calendar could not be written: ${put.status}`);
    },
    async remove(booking) {
      const gone = await send(`${at}/${googleId(booking)}`, { method: 'DELETE', headers });
      if (!gone.ok && gone.status !== 404 && gone.status !== 410) throw new Error(`Google Calendar could not be written: ${gone.status}`);
    },
  });
}

/** The extended property Outlook keeps the booking's id in. */
const PROPERTY = 'String {5f4c2a8e-1b3d-4e6f-9a7b-2c8d0e1f3a5b} Name reboschedule';

export function outlookWriter({ accessToken, calendar, fetch: send = globalThis.fetch.bind(globalThis) }: WriterOptions): CalendarWriter {
  const root = calendar ? `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calendar)}/events` : 'https://graph.microsoft.com/v1.0/me/events';
  const headers = { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' };
  /** The event of a booking, if it was written: by its id, in the extended property. */
  const find = async (booking: Booking) => {
    const filter = `singleValueExtendedProperties/Any(ep: ep/id eq '${PROPERTY}' and ep/value eq '${booking.id.replace(/'/g, "''")}')`;
    const answer = await send(`${root}?$filter=${encodeURIComponent(filter)}&$select=id`, { headers });
    if (!answer.ok) throw new Error(`Outlook could not be read: ${answer.status}`);
    return ((await answer.json()) as { value?: { id: string }[] }).value?.[0]?.id ?? null;
  };
  return writeBoth({
    async put(booking, type) {
      const e = eventOf(booking, type);
      const body = {
        subject: e.title,
        body: { contentType: 'text', content: e.text },
        start: { dateTime: booking.start.replace(/Z$/, ''), timeZone: 'UTC' },
        end: { dateTime: booking.end.replace(/Z$/, ''), timeZone: 'UTC' },
        ...(e.where ? { location: { displayName: e.where } } : {}),
        singleValueExtendedProperties: [{ id: PROPERTY, value: booking.id }],
      };
      const id = await find(booking);
      const answer = id
        ? await send(`https://graph.microsoft.com/v1.0/me/events/${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) })
        : await send(root, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!answer.ok) throw new Error(`Outlook could not be written: ${answer.status}`);
    },
    async remove(booking) {
      const id = await find(booking);
      if (!id) return;
      const gone = await send(`https://graph.microsoft.com/v1.0/me/events/${id}`, { method: 'DELETE', headers });
      if (!gone.ok && gone.status !== 404) throw new Error(`Outlook could not be written: ${gone.status}`);
    },
  });
}
