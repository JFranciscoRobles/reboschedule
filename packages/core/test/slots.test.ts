import { describe, expect, it } from 'vitest';
import { type EventType, makeBooking, moveBooking, placeAt, readBookingRequest, readEventType, sampleEventTypes, sampleSchedule, type Schedule, slotsByDay, slotsOf } from '../src';

const tz = 'America/Tijuana';
const schedule: Schedule = { timeZone: tz, weekly: { 0: [], 1: [{ from: '09:00', to: '12:00' }], 2: [{ from: '09:00', to: '12:00' }], 3: [], 4: [], 5: [], 6: [] }, dates: {} };
const call: EventType = { ...sampleEventTypes('en')[0], duration: 30, increment: 30, before: 0, after: 0, notice: 0, horizon: 30, perDay: null };
// Sunday, November 1, 2026, at noon in Tijuana.
const now = Date.parse('2026-11-01T20:00:00Z');
const local = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' });

describe('the times free', () => {
  it('cuts each day’s hours into starts, as the owner’s clock says them', () => {
    const slots = slotsOf(call, schedule, { now, from: '2026-11-02', to: '2026-11-02' });
    expect(slots.map((s) => local(s.start))).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
    expect(slots[0]).toEqual({ start: '2026-11-02T17:00:00.000Z', end: '2026-11-02T17:30:00.000Z', free: 1 });
  });

  it('gives none sooner than the notice, nor further than the horizon', () => {
    const soon = slotsOf({ ...call, notice: 22 * 60 }, schedule, { now, from: '2026-11-02', to: '2026-11-02' });
    expect(soon.map((s) => local(s.start))).toEqual(['10:00', '10:30', '11:00', '11:30']);
    expect(slotsOf({ ...call, horizon: 1 }, schedule, { now }).every((s) => Date.parse(s.start) <= now + 86_400_000)).toBe(true);
  });

  it('keeps away from what is busy, and from the time kept free before and after', () => {
    const busy = [{ start: '2026-11-02T18:00:00.000Z', end: '2026-11-02T18:30:00.000Z' }]; // 10:00 to 10:30
    expect(slotsOf(call, schedule, { now, from: '2026-11-02', to: '2026-11-02', busy }).map((s) => local(s.start))).toEqual(['09:00', '09:30', '10:30', '11:00', '11:30']);
    expect(slotsOf({ ...call, before: 15, after: 15 }, schedule, { now, from: '2026-11-02', to: '2026-11-02', busy }).map((s) => local(s.start))).toEqual(['09:00', '11:00', '11:30']);
  });

  it('gives none on a day that has as many as it may', () => {
    const booked = [
      { start: '2026-11-02T17:00:00.000Z', end: '2026-11-02T17:30:00.000Z' },
      { start: '2026-11-02T19:00:00.000Z', end: '2026-11-02T19:30:00.000Z' },
    ];
    expect(slotsOf({ ...call, perDay: 2 }, schedule, { now, from: '2026-11-02', to: '2026-11-03', busy: booked }).every((s) => s.start.startsWith('2026-11-03'))).toBe(true);
  });

  it('follows the days that are not as the week: a day off, and a Saturday open', () => {
    const special: Schedule = { ...schedule, dates: { '2026-11-02': [], '2026-11-07': [{ from: '10:00', to: '11:00' }] } };
    const slots = slotsOf(call, special, { now, from: '2026-11-02', to: '2026-11-07' });
    expect(slots.some((s) => s.start.startsWith('2026-11-02'))).toBe(false);
    expect(slots.filter((s) => s.start.startsWith('2026-11-07')).map((s) => local(s.start))).toEqual(['10:00', '10:30']);
  });

  it('lays the times out by the day of whoever books, in their time zone', () => {
    const slots = slotsOf(call, schedule, { now, from: '2026-11-02', to: '2026-11-03' });
    const madrid = slotsByDay(slots, 'Europe/Madrid');
    expect([...madrid.keys()]).toEqual(['2026-11-02', '2026-11-03']);
    expect(new Date(madrid.get('2026-11-02')![0].start).toLocaleTimeString('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })).toBe('18:00');
  });

  it('works with the sample', () => {
    const [first, visit, court, room, shift] = sampleEventTypes('es');
    for (const t of [first, visit, court, room, shift]) expect(slotsOf(t, sampleSchedule(), { now }).length).toBeGreaterThan(10);
    // What is read back is what was written.
    for (const t of sampleEventTypes('en')) expect(readEventType(t)).toEqual(t);
  });
});

describe('things booked, and room for several', () => {
  const [, , court, room, shift] = sampleEventTypes('es');
  const day = { now, from: '2026-11-02', to: '2026-11-02' };
  const at = (slots: { start: string }[], hhmm: string) => slots.find((s) => local(s.start) === hhmm);

  it('follows the kind’s own hours, not the owner’s', () => {
    const slots = slotsOf(court, schedule, day);
    expect(local(slots[0].start)).toBe('07:00');
    expect(local(slots.at(-1)!.start)).toBe('21:00');
    // The rooms are closed on a Sunday, whatever the owner does.
    expect(slotsOf(room, schedule, { now, from: '2026-11-08', to: '2026-11-08' })).toEqual([]);
    // A day the owner closes is closed for everything.
    expect(slotsOf(court, { ...schedule, dates: { '2026-11-02': [] } }, day)).toEqual([]);
  });

  it('is free while one of the things has a place, and says which', () => {
    const one = slotsOf(court, schedule, day);
    expect(at(one, '10:00')).toMatchObject({ free: 5, resources: ['court-1', 'court-2', 'court-3', 'court-4', 'court-5'] });
    const busy = [
      { start: '2026-11-02T18:00:00.000Z', end: '2026-11-02T19:00:00.000Z', resource: 'court-1' },
      { start: '2026-11-02T18:00:00.000Z', end: '2026-11-02T19:30:00.000Z', resource: 'court-3' },
    ];
    const two = slotsOf(court, schedule, { ...day, busy });
    expect(at(two, '10:00')).toMatchObject({ free: 3, resources: ['court-2', 'court-4', 'court-5'] });
    expect(at(two, '11:00')).toMatchObject({ free: 4, resources: ['court-1', 'court-2', 'court-4', 'court-5'] });
    expect(placeAt(at(two, '10:00')!.start, two)).toBe('court-2');
    expect(placeAt(at(two, '10:00')!.start, two, 'court-1')).toBeNull();
    // All five taken: not free at all.
    const all = slotsOf(court, schedule, { ...day, busy: [...busy, ...['court-2', 'court-4', 'court-5'].map((resource) => ({ ...busy[0], resource }))] });
    expect(at(all, '10:00')).toBeUndefined();
  });

  it('is booked for the length chosen, of the thing chosen or the first free', () => {
    const long = slotsOf(court, schedule, { ...day, length: 120 });
    expect(local(long.at(-1)!.start)).toBe('20:00');
    // A length the kind does not have is its own.
    expect(slotsOf(court, schedule, { ...day, length: 7 }).length).toBe(slotsOf(court, schedule, day).length);
    const start = at(long, '10:00')!.start;
    const b = makeBooking(readBookingRequest({ start, length: 120, name: 'Ana', email: 'a@x.co' }), court, now, long);
    expect(b).toMatchObject({ resource: 'court-1', end: '2026-11-02T20:00:00.000Z' });
    const c = makeBooking(readBookingRequest({ start, length: 90, resource: 'court-3', name: 'Ana', email: 'a@x.co' }), court, now, long);
    expect(c).toMatchObject({ resource: 'court-3', end: '2026-11-02T19:30:00.000Z' });
  });

  it('takes as many as fit at once, each a place: two guards a shift', () => {
    const slots = slotsOf(shift, schedule, day);
    expect(slots.map((s) => [local(s.start), s.free])).toEqual([
      ['09:00', 2],
      ['14:00', 2],
    ]);
    const one = [{ start: slots[0].start, end: slots[0].end, resource: '' }];
    expect(slotsOf(shift, schedule, { ...day, busy: one })[0]).toMatchObject({ free: 1 });
    expect(slotsOf(shift, schedule, { ...day, busy: [...one, ...one] }).map((s) => local(s.start))).toEqual(['14:00']);
    // The owner away (something of all of them) leaves no place.
    expect(slotsOf(shift, schedule, { ...day, busy: [{ start: slots[0].start, end: slots[0].end }] }).map((s) => local(s.start))).toEqual(['14:00']);
  });

  it('moves a booking to another time free, its length and its court kept while they may be', () => {
    const start = '2026-11-02T18:00:00.000Z'; // 10:00
    const b = makeBooking(readBookingRequest({ start, length: 90, resource: 'court-4', name: 'Ana', email: 'a@x.co' }), court, now, slotsOf(court, schedule, { ...day, length: 90 }));
    // The times free without it, as the owner sees them, for its length.
    const others = [{ start: '2026-11-02T20:00:00.000Z', end: '2026-11-02T21:00:00.000Z', resource: 'court-4' }];
    const free = slotsOf(court, schedule, { ...day, length: 90, busy: others });
    expect(moveBooking(b, '2026-11-02T19:00:00.000Z', court, free)).toMatchObject({ start: '2026-11-02T19:00:00.000Z', end: '2026-11-02T20:30:00.000Z', resource: 'court-1' });
    expect(moveBooking(b, '2026-11-02T22:00:00.000Z', court, free)).toMatchObject({ resource: 'court-4', end: '2026-11-02T23:30:00.000Z' });
    expect(moveBooking(b, '2026-11-03T08:00:00.000Z', court, free)).toBeNull();
    // A shift of one: moved only to a turn nobody has.
    const one = { ...shift, capacity: 1 };
    const turns = slotsOf(one, schedule, day);
    const s = makeBooking(readBookingRequest({ start: turns[0].start, name: 'Beto', email: 'b@x.co' }), one, now, turns);
    expect(moveBooking(s, turns[1].start, one, slotsOf(one, schedule, { ...day, busy: [{ start: turns[1].start, end: turns[1].end, resource: '' }] }))).toBeNull();
    expect(moveBooking(s, turns[1].start, one, turns)).toMatchObject({ start: turns[1].start, resource: '' });
  });
});
