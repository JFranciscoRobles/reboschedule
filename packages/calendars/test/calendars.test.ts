import { type Booking, slotsOf, sampleEventTypes, sampleSchedule } from '@reboschedule/core';
import { describe, expect, it } from 'vitest';
import { cachedBusy, combineBusy, fetchIcsBusy, googleBusy, googleWriter, icsBusy, outlookBusy, outlookWriter } from '../src';

// A calendar as Google gives it by its secret address: lines folded, a time zone named, a whole day, one free, one cancelled, and a meeting every Tuesday but one.
const ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'DTSTART:20261103T180000Z',
  'DTEND:20261103T190000Z',
  'SUMMARY:Dentista\\, con mi hija',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;TZID=America/Tijuana:20261104T090000',
  'DTEND;TZID=America/Tijuana:20261104T103000',
  'SUMMARY:Firma en notar',
  ' ía',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20261106',
  'DTEND;VALUE=DATE:20261107',
  'SUMMARY:Congreso',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART:20261105T170000Z',
  'DTEND:20261105T180000Z',
  'TRANSP:TRANSPARENT',
  'SUMMARY:Recordatorio',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART:20261105T200000Z',
  'DTEND:20261105T210000Z',
  'STATUS:CANCELLED',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;TZID=America/Tijuana:20261103T150000',
  'DTEND;TZID=America/Tijuana:20261103T160000',
  'RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=4',
  'EXDATE;TZID=America/Tijuana:20261110T150000',
  'SUMMARY:Junta de oficina',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

const range = { from: '2026-11-01T00:00:00Z', to: '2026-12-01T00:00:00Z', timeZone: 'America/Tijuana' };

describe('a calendar by its secret address', () => {
  it('reads what takes time, in its time zone, whole days and repeats, not what is free or cancelled', () => {
    const busy = icsBusy(ICS, range);
    expect(busy.map((b) => [b.title, b.start, b.end])).toEqual([
      ['Dentista, con mi hija', '2026-11-03T18:00:00.000Z', '2026-11-03T19:00:00.000Z'],
      ['Junta de oficina', '2026-11-03T23:00:00.000Z', '2026-11-04T00:00:00.000Z'],
      ['Firma en notaría', '2026-11-04T17:00:00.000Z', '2026-11-04T18:30:00.000Z'],
      ['Congreso', '2026-11-06T08:00:00.000Z', '2026-11-07T08:00:00.000Z'],
      ['Junta de oficina', '2026-11-17T23:00:00.000Z', '2026-11-18T00:00:00.000Z'],
      ['Junta de oficina', '2026-11-24T23:00:00.000Z', '2026-11-25T00:00:00.000Z'],
    ]);
    // Only what touches what is asked.
    expect(icsBusy(ICS, { ...range, from: '2026-11-20T00:00:00Z' }).map((b) => b.start)).toEqual(['2026-11-24T23:00:00.000Z']);
  });

  it('is busy for the engine: no time offered over it', () => {
    const [call] = sampleEventTypes('es');
    const now = Date.parse('2026-11-01T20:00:00Z');
    const busy = icsBusy(ICS, range);
    const free = slotsOf({ ...call, notice: 0, after: 0 }, sampleSchedule(), { now, from: '2026-11-04', to: '2026-11-04', busy });
    const local = free.map((s) => new Date(s.start).toLocaleTimeString('en-GB', { timeZone: 'America/Tijuana', hour: '2-digit', minute: '2-digit' }));
    expect(local).not.toContain('09:00');
    expect(local).not.toContain('10:00');
    expect(local).toContain('10:30');
    // The whole day of the congress, nothing.
    expect(slotsOf(call, sampleSchedule(), { now, from: '2026-11-06', to: '2026-11-06', busy })).toEqual([]);
  });

  it('is fetched by its address, webcal or https', async () => {
    const asked: string[] = [];
    const fetch = (async (url: string) => (asked.push(url), new Response(ICS))) as unknown as typeof globalThis.fetch;
    const busy = await fetchIcsBusy('webcal://calendar.google.com/calendar/ical/x/private-abc/basic.ics', { ...range, fetch });
    expect(asked).toEqual(['https://calendar.google.com/calendar/ical/x/private-abc/basic.ics']);
    expect(busy).toHaveLength(6);
  });
});

describe('Google and Outlook, with a token of the app’s', () => {
  it('reads Google’s free/busy', async () => {
    let sent: { url: string; init: RequestInit } | null = null;
    const fetch = (async (url: string, init: RequestInit) => {
      sent = { url, init };
      return Response.json({ calendars: { primary: { busy: [{ start: '2026-11-03T18:00:00Z', end: '2026-11-03T19:00:00Z' }] } } });
    }) as unknown as typeof globalThis.fetch;
    const busy = await googleBusy({ accessToken: 't0k', from: range.from, to: range.to, fetch });
    expect(busy).toEqual([{ start: '2026-11-03T18:00:00.000Z', end: '2026-11-03T19:00:00.000Z' }]);
    expect(sent!.url).toBe('https://www.googleapis.com/calendar/v3/freeBusy');
    expect((sent!.init.headers as Record<string, string>).authorization).toBe('Bearer t0k');
    expect(JSON.parse(String(sent!.init.body))).toEqual({ timeMin: range.from, timeMax: range.to, items: [{ id: 'primary' }] });
  });

  it('reads Outlook’s schedule, all but what is free', async () => {
    const fetch = (async () =>
      Response.json({
        value: [
          {
            scheduleItems: [
              { status: 'busy', start: { dateTime: '2026-11-03T18:00:00.0000000' }, end: { dateTime: '2026-11-03T19:00:00.0000000' } },
              { status: 'free', start: { dateTime: '2026-11-03T20:00:00.0000000' }, end: { dateTime: '2026-11-03T21:00:00.0000000' } },
              { status: 'oof', start: { dateTime: '2026-11-04T16:00:00.0000000' }, end: { dateTime: '2026-11-05T16:00:00.0000000' } },
            ],
          },
        ],
      })) as unknown as typeof globalThis.fetch;
    const busy = await outlookBusy({ accessToken: 't', schedules: ['laura@x.co'], from: range.from, to: range.to, fetch });
    expect(busy.map((b) => b.start)).toEqual(['2026-11-03T18:00:00.000Z', '2026-11-04T16:00:00.000Z']);
  });

  it('asks less often, and one calendar away does not close the others', async () => {
    let t = 0;
    let reads = 0;
    const read = cachedBusy(
      async () => (reads++, [{ start: 'a', end: 'b' }]),
      60_000,
      () => t,
    );
    await read('x', 'y');
    await read('x', 'y');
    t = 61_000;
    await read('x', 'y');
    expect(reads).toBe(2);
    const both = combineBusy(read, async () => {
      throw new Error('away');
    });
    expect(await both('x', 'y')).toHaveLength(1);
  });
});

describe('writing in the owner’s own calendar', () => {
  const type = { ...sampleEventTypes('es')[1], place: { kind: 'in-person' as const, value: 'Calle 1' } };
  const booking = {
    id: 'bk1',
    type: type.id,
    resource: '',
    start: '2026-11-03T17:00:00.000Z',
    end: '2026-11-03T18:00:00.000Z',
    name: 'Ana',
    email: 'a@x.co',
    timeZone: 'UTC',
    answers: {},
    status: 'confirmed',
    created: '',
  } as Booking;
  const organizer = { name: 'Laura', email: 'l@x.co' };
  const fake = (status: (url: string, method: string) => number, body: unknown = {}) => {
    const asked: { url: string; method: string; body?: string }[] = [];
    const send = (async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      asked.push({ url, method, body: init?.body as string });
      return new Response(JSON.stringify(body), { status: status(url, method) });
    }) as typeof fetch;
    return { asked, send };
  };

  it('puts a booking in Google by an id made of its own, made when it is not there, removed when cancelled', async () => {
    const { asked, send } = fake((_, m) => (m === 'PUT' ? 404 : 200));
    const google = googleWriter({ accessToken: 't', fetch: send });
    await google.write(booking, type, organizer);
    expect(asked.map((a) => a.method)).toEqual(['PUT', 'POST']);
    expect(asked[0].url).toBe('https://www.googleapis.com/calendar/v3/calendars/primary/events/rs626b31');
    expect(JSON.parse(asked[1].body!)).toMatchObject({ summary: `${type.title} · Ana`, location: 'Calle 1', start: { dateTime: booking.start } });
    await google.write({ ...booking, status: 'cancelled' }, type, organizer);
    expect(asked.at(-1)?.method).toBe('DELETE');
  });

  it('finds it again in Outlook by its id, and changes it rather than adding another', async () => {
    const { asked, send } = fake(() => 200, { value: [{ id: 'evt9' }] });
    await outlookWriter({ accessToken: 't', fetch: send }).put(booking, type, organizer);
    expect(asked[0].url).toContain('singleValueExtendedProperties');
    expect(asked[1]).toMatchObject({ method: 'PATCH', url: 'https://graph.microsoft.com/v1.0/me/events/evt9' });
  });
});
