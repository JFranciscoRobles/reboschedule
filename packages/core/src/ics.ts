// An appointment as calendars take it: an iCalendar invitation (RFC 5545),
// to send with the email that confirms it or to save, which every calendar
// opens; the same, cancelled, when it is; and the address that puts it in
// Google Calendar in one click.

import type { Booking, EventType } from './model';

/** Text as iCalendar writes it: its backslashes, commas, semicolons and lines said so. */
const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
/** An instant as iCalendar writes it, in UTC: `20261103T170000Z`. */
const stamp = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
/** Lines no longer than 75 characters, as iCalendar folds them: the rest after a space on the next. */
const fold = (line: string) => {
  const parts: string[] = [];
  for (let rest = line; rest.length; rest = rest.slice(73)) parts.push(rest.slice(0, parts.length ? 73 : 75));
  return parts.join('\r\n ');
};

export interface Organizer {
  name: string;
  email: string;
}

/** Where it is, as one line: the address, the number, the link of the call. */
export const whereOf = (type: EventType) => type.place.value.trim();

/** What it is called in a calendar: its kind, and the thing booked or the owner. */
const titleOf = (booking: Booking, type: EventType, organizer: Organizer) => `${type.title} · ${type.resources.find((r) => r.id === booking.resource)?.name ?? organizer.name}`;

/** An appointment as an iCalendar file: an invitation, or its cancelling when it is cancelled. */
export function icsOf(booking: Booking, type: EventType, organizer: Organizer, product = '-//Rebo//ReboSchedule//EN'): string {
  const cancelled = booking.status === 'cancelled';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${product}`,
    'CALSCALE:GREGORIAN',
    `METHOD:${cancelled ? 'CANCEL' : 'REQUEST'}`,
    'BEGIN:VEVENT',
    `UID:${booking.id}@reboschedule`,
    `DTSTAMP:${stamp(booking.created)}`,
    `DTSTART:${stamp(booking.start)}`,
    `DTEND:${stamp(booking.end)}`,
    `SUMMARY:${escapeText(titleOf(booking, type, organizer))}`,
    ...(type.description ? [`DESCRIPTION:${escapeText(type.description)}`] : []),
    ...(whereOf(type) ? [`LOCATION:${escapeText(whereOf(type))}`] : []),
    `ORGANIZER;CN=${escapeText(organizer.name)}:mailto:${organizer.email}`,
    `ATTENDEE;CN=${escapeText(booking.name)};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${booking.email}`,
    `STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    // Its version: each change one more, so calendars change it and do not add another.
    `SEQUENCE:${booking.sequence ?? (cancelled ? 1 : 0)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

/** The address that puts an appointment in Google Calendar, its details written. */
export function googleCalendarUrl(booking: Booking, type: EventType, organizer: Organizer) {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: titleOf(booking, type, organizer),
    dates: `${stamp(booking.start)}/${stamp(booking.end)}`,
    details: type.description,
    location: whereOf(type),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
