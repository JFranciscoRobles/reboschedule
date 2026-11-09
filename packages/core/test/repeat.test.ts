import { describe, expect, it } from 'vitest';
import {
  cancelBooking,
  changeOf,
  icsOf,
  makeBooking,
  makeSeries,
  moveBooking,
  noticeOf,
  occurrencesOf,
  planSeries,
  readBookingRequest,
  readRepeat,
  sampleEventTypes,
  sampleSchedule,
  slotsOf,
} from '../src';

const tz = 'America/Tijuana';
const types = sampleEventTypes('es');
const shift = { ...types.find((t) => t.id === 'shift')!, capacity: 1 };
const court = types.find((t) => t.id === 'court')!;
const schedule = sampleSchedule(tz);
const now = Date.parse('2026-11-01T20:00:00Z'); // Sunday noon, in Tijuana
const local = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

describe('a series', () => {
  it('is the same weekday and hour of the owner’s clock, over the change of summer time', () => {
    // Tuesday March 3, 2026, 9:00 in Tijuana; the clocks go forward on Sunday March 8.
    const times = occurrencesOf('2026-03-03T17:00:00.000Z', 60, { every: 1, count: 3 }, tz);
    expect(times.map((t) => local(t.start))).toEqual(['Tue 03/03, 09:00', 'Tue 10/03, 09:00', 'Tue 17/03, 09:00']);
    expect(times[1].start).toBe('2026-03-10T16:00:00.000Z');
    expect(occurrencesOf('2026-03-03T17:00:00.000Z', 60, { every: 2, until: '2026-03-31' }, tz)).toHaveLength(3);
  });

  it('says which of its times are free, and makes those, sharing an id', () => {
    const first = slotsOf(shift, schedule, { now, from: '2026-11-03', to: '2026-11-03' })[0]; // Tuesday 9:00
    // Someone has the third Tuesday already.
    const third = occurrencesOf(first.start, 300, { every: 1, count: 3 }, tz)[2];
    const plan = planSeries(shift, schedule, { start: first.start, repeat: { every: 1, count: 4 }, busy: [{ ...third, resource: '' }], now });
    expect(plan.map((p) => p.resource)).toEqual(['', '', null, '']);
    const made = makeSeries(readBookingRequest({ start: first.start, name: 'Ana', email: 'a@x.co' }), shift, plan, now);
    expect(made).toHaveLength(3);
    expect(new Set(made.map((b) => b.series)).size).toBe(1);
    expect(made[0].series).toBeTruthy();
    // Beyond the horizon only for the owner.
    const far = planSeries(shift, schedule, { start: first.start, repeat: { every: 1, count: 10 }, now });
    expect(far.filter((p) => p.resource !== null)).toHaveLength(5);
    expect(planSeries(shift, schedule, { start: first.start, repeat: { every: 1, count: 10 }, now, owner: true }).every((p) => p.resource !== null)).toBe(true);
  });

  it('keeps the court asked each time it is free, the first free when not', () => {
    const start = slotsOf(court, schedule, { now, from: '2026-11-03', to: '2026-11-03' })[4].start;
    const busy = [{ start, end: new Date(Date.parse(start) + 3_600_000).toISOString(), resource: 'court-4' }];
    const plan = planSeries(court, schedule, { start, repeat: { every: 1, count: 2 }, resource: 'court-4', busy, now });
    expect(plan.map((p) => p.resource)).toEqual([null, 'court-4']);
  });

  it('is read within reason', () => {
    expect(readRepeat({ every: 99, count: 500 })).toEqual({ every: 12, count: 52 });
    expect(readRepeat({ every: 1 })).toBeUndefined();
    expect(readRepeat({ until: '2026-12-01' })).toEqual({ every: 1, until: '2026-12-01' });
  });
});

describe('what whoever booked is told', () => {
  const visit = types.find((t) => t.id === 'visit')!;
  const free = slotsOf(visit, schedule, { now, from: '2026-11-04', to: '2026-11-05' });
  const booking = makeBooking(readBookingRequest({ start: free[0].start, name: 'Ana', email: 'ana@x.co', timeZone: 'Europe/Madrid', answers: { phone: '1' } }), visit, now, free);
  const organizer = { name: 'Laura Méndez', email: 'laura@x.co' };

  it('that it was booked, moved and cancelled, in their language and time zone', () => {
    const booked = noticeOf('booked', booking, visit, organizer, { locale: 'es', manage: 'https://x.co/b/1' });
    expect(booked.subject).toBe('Confirmada: Visita a una propiedad · miércoles, 4 de noviembre, 18:00');
    expect(booked.text).toContain('Hola Ana:');
    expect(booked.text).toContain('https://x.co/b/1');
    expect(booked.method).toBe('REQUEST');

    const moved = moveBooking(booking, free.at(-1)!.start, visit, free)!;
    expect(changeOf(booking, moved)).toBe('moved');
    const m = noticeOf('moved', moved, visit, organizer, { locale: 'es', before: booking });
    expect(m.text).toMatch(/se movió del miércoles, 4 de noviembre, 18:00 al/);
    // Its version one more: the calendar changes the same event.
    expect(moved.sequence).toBe(1);
    expect(m.ics).toContain('SEQUENCE:1');
    expect(m.ics).toContain(`UID:${booking.id}@reboschedule`);

    const cancelled = cancelBooking(moved);
    expect(changeOf(moved, cancelled)).toBe('cancelled');
    const c = noticeOf('cancelled', cancelled, visit, organizer, { locale: 'en' });
    expect(c.subject).toMatch(/^Cancelled: /);
    expect(c.method).toBe('CANCEL');
    expect(icsOf(cancelled, visit, organizer)).toContain('SEQUENCE:2');
  });
});
