import { describe, expect, it } from 'vitest';
import { bookingProblems, describeBookingProblem, googleCalendarUrl, icsOf, makeBooking, readBookingRequest, readEventType, readSchedule, sampleEventTypes } from '../src';

const [, visit] = sampleEventTypes('es');
const free = [{ start: '2026-11-03T17:00:00.000Z', end: '2026-11-03T18:00:00.000Z', free: 1 }];

describe('reading what is given', () => {
  it('keeps hours a clock may show, in order, none over another; a time zone the system knows', () => {
    const s = readSchedule({
      timeZone: 'Mars/Olympus',
      weekly: {
        1: [
          { from: '15:00', to: '18:00' },
          { from: '09:00', to: '13:00' },
          { from: '12:00', to: '14:00' },
          { from: '25:00', to: '26:00' },
        ],
      },
      dates: { '2026-12-25': [], nope: [] },
    });
    expect(s.timeZone).toBe('UTC');
    expect(s.weekly[1]).toEqual([
      { from: '09:00', to: '13:00' },
      { from: '15:00', to: '18:00' },
    ]);
    expect(s.weekly[0]).toEqual([]);
    expect(Object.keys(s.dates)).toEqual(['2026-12-25']);
  });

  it('keeps what each thing says of itself as its fields have it, and a picture that is one', () => {
    const t = readEventType({
      title: 'Courts',
      fields: [
        { id: 'covered', label: 'Covered', kind: 'yes-no' },
        { id: 'size', label: 'Size', kind: 'number', unit: 'm²' },
        { id: 'nope', label: '' },
      ],
      resources: [
        { id: 'a', name: 'Court A', image: 'javascript:alert(1)', values: { covered: true, size: '20', other: 1 } },
        { id: 'b', name: 'Court B', image: 'data:image/png;base64,iVBOR', values: { covered: 'yes', size: 200 } },
      ],
    });
    expect(t.fields.map((f) => [f.id, f.kind, f.unit])).toEqual([
      ['covered', 'yes-no', ''],
      ['size', 'number', 'm²'],
    ]);
    expect(t.resources.map((r) => [r.image, r.values])).toEqual([
      ['', { covered: true }],
      ['data:image/png;base64,iVBOR', { size: 200 }],
    ]);
  });

  it('keeps a kind of appointment within reason', () => {
    const t = readEventType({ title: 'Call', duration: 9999, notice: -5, place: { kind: 'teleport' }, questions: [{ label: '' }, { label: 'Why?', kind: 'nope' }], color: 'red' });
    expect(t).toMatchObject({ duration: 1440, increment: 1440, notice: 0, place: { kind: 'video' }, color: '#3b63fb', perDay: null });
    expect(t.questions).toEqual([expect.objectContaining({ label: 'Why?', kind: 'text', required: false })]);
  });
});

describe('a booking', () => {
  it('may be booked only at a time still free, with a name, an email and what is asked', () => {
    const ok = readBookingRequest({ start: free[0].start, name: 'Ana', email: 'ana@example.com', timeZone: 'America/Tijuana', answers: { phone: '664 123 4567' } });
    expect(bookingProblems(ok, visit, free)).toEqual([]);
    const bad = readBookingRequest({ start: '2026-11-03T18:00:00.000Z', name: '', email: 'ana', answers: {} });
    expect(bookingProblems(bad, visit, free).map((p) => p.code)).toEqual(['taken', 'no-name', 'bad-email', 'missing-answer']);
    expect(describeBookingProblem({ code: 'missing-answer', question: 'phone' }, 'es', visit)).toBe('Falta: Tu teléfono.');
  });

  it('is made with its end and only the answers asked', () => {
    const request = readBookingRequest({ start: free[0].start, name: 'Ana', email: 'ana@example.com', answers: { phone: '1', other: 'x' } });
    const b = makeBooking(request, visit, Date.parse('2026-11-01T00:00:00Z'));
    expect(b).toMatchObject({ type: 'visit', start: free[0].start, end: '2026-11-03T18:00:00.000Z', status: 'confirmed', answers: { phone: '1', home: '' } });
  });
});

describe('its invitation', () => {
  const booking = makeBooking(readBookingRequest({ start: free[0].start, name: 'Ana, López', email: 'ana@example.com', answers: {} }), visit, Date.parse('2026-11-01T00:00:00Z'));
  const organizer = { name: 'Laura Méndez', email: 'laura@example.com' };

  it('is iCalendar: its lines ended as it says, its times in UTC, its words escaped, long lines folded', () => {
    const ics = icsOf(booking, { ...visit, description: 'x'.repeat(120) }, organizer);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics).toContain('DTSTART:20261103T170000Z\r\n');
    expect(ics).toContain('DTEND:20261103T180000Z\r\n');
    expect(ics).toContain('ATTENDEE;CN=Ana\\, López;');
    expect(ics).toContain('METHOD:REQUEST');
    for (const line of ics.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75);
    expect(ics).toMatch(/\r\n x/);
  });

  it('is cancelled as calendars cancel one', () => {
    const ics = icsOf({ ...booking, status: 'cancelled' }, visit, organizer);
    expect(ics).toContain('METHOD:CANCEL');
    expect(ics).toContain('STATUS:CANCELLED');
  });

  it('goes to Google Calendar with its times', () => {
    expect(googleCalendarUrl(booking, visit, organizer)).toContain('dates=20261103T170000Z%2F20261103T180000Z');
  });
});
