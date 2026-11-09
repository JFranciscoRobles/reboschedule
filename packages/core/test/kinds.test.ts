import { describe, expect, it } from 'vitest';
import {
  busyOfBookings,
  type EventType,
  type Hours,
  makeBooking,
  makeStay,
  nightsOf,
  readBookingRequest,
  readEventType,
  sampleEventTypes,
  sampleSchedule,
  slotsOf,
  stayProblems,
  stayTimes,
  type Weekday,
} from '../src';

const tz = 'America/Tijuana';
const schedule = sampleSchedule(tz);
const now = Date.parse('2026-11-01T20:00:00Z'); // Sunday noon, in Tijuana
const base = sampleEventTypes('es')[0];
const local = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: tz, day: '2-digit', hour: '2-digit', minute: '2-digit' });
const week = (h: Hours[], days: number[]) => Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, days.includes(d) ? h : []])) as Record<Weekday, Hours[]>;

describe('stays, by the night', () => {
  const cabin: EventType = {
    ...base,
    stay: { unit: 'night', min: 2, max: 7, checkIn: '15:00', checkOut: '12:00' },
    horizon: 90,
    notice: 0,
    price: { amount: 1800, currency: 'MXN', per: 'night' },
    resources: [
      { id: 'pino', name: 'Pino', image: '', values: {}, price: null },
      { id: 'roble', name: 'Roble', image: '', values: {}, price: 2400 },
    ],
  };
  // Someone has Pino the nights of the 5th and 6th.
  const taken = { start: '2026-11-05T23:00:00.000Z', end: '2026-11-07T20:00:00.000Z', resource: 'pino' };

  it('begin at the hour in and end at the hour out, the day one leaves', () => {
    const t = stayTimes(cabin, schedule, '2026-11-05', '2026-11-07')!;
    expect([local(t.start), local(t.end)]).toEqual(['05, 15:00', '07, 12:00']);
  });

  it('are free while some cabin has the whole night', () => {
    const nights = nightsOf(cabin, schedule, { now, from: '2026-11-04', to: '2026-11-07', busy: [taken] });
    expect(nights.map((n) => [n.day, n.resources])).toEqual([
      ['2026-11-04', ['pino', 'roble']],
      ['2026-11-05', ['roble']],
      ['2026-11-06', ['roble']],
      ['2026-11-07', ['pino', 'roble']],
    ]);
  });

  it('are booked of the cabin that has every night, at its price of each, as long as they may be', () => {
    const nights = nightsOf(cabin, schedule, { now, busy: [taken] });
    const asked = readBookingRequest({ arrive: '2026-11-04', leave: '2026-11-07', name: 'Ana', email: 'a@x.co', resource: 'pino' });
    expect(stayProblems(asked, cabin, nights).map((p) => p.code)).toEqual(['taken']);
    const any = readBookingRequest({ arrive: '2026-11-04', leave: '2026-11-07', name: 'Ana', email: 'a@x.co' });
    expect(stayProblems(any, cabin, nights)).toEqual([]);
    expect(makeStay(any, cabin, schedule, nights, now)).toMatchObject({ resource: 'roble', price: { amount: 7200, currency: 'MXN' } });
    const short = readBookingRequest({ arrive: '2026-11-04', leave: '2026-11-05', name: 'Ana', email: 'a@x.co' });
    expect(stayProblems(short, cabin, nights)).toEqual([{ code: 'too-short', most: 2 }]);
    // A stay booked takes its nights.
    const made = makeStay(any, cabin, schedule, nights, now);
    expect(nightsOf(cabin, schedule, { now, from: '2026-11-05', to: '2026-11-05', busy: [taken, ...busyOfBookings([made])] })).toEqual([]);
  });

  it('is read back as it was written', () => {
    expect(readEventType(cabin).stay).toEqual(cabin.stay);
    expect(readEventType({ stay: { unit: 'day', min: 3, max: 1, checkIn: 'x' } }).stay).toEqual({ unit: 'day', min: 3, max: 3, checkIn: '15:00', checkOut: '12:00' });
  });
});

describe('people with hours of their own', () => {
  const barber = (id: string, hours: Record<Weekday, Hours[]>) => ({ id, name: id, image: '', values: {}, price: null, hours });
  const cut: EventType = {
    ...base,
    duration: 30,
    increment: 30,
    before: 0,
    after: 0,
    notice: 0,
    hours: week([{ from: '09:00', to: '20:00' }], [0, 1, 2, 3, 4, 5, 6]),
    resources: [barber('memo', week([{ from: '09:00', to: '12:00' }], [1, 2, 3, 4, 5])), barber('pau', week([{ from: '17:00', to: '20:00' }], [0, 3, 4, 5, 6]))],
  };
  const day = { now, from: '2026-11-02', to: '2026-11-02' }; // Monday

  it('are offered each only in their own hours', () => {
    const slots = slotsOf(cut, schedule, day);
    expect(slots.map((s) => [local(s.start).slice(4), s.resources])).toEqual([
      ['09:00', ['memo']],
      ['09:30', ['memo']],
      ['10:00', ['memo']],
      ['10:30', ['memo']],
      ['11:00', ['memo']],
      ['11:30', ['memo']],
    ]);
    // Wednesday, both: Memo in the morning, Pau in the evening.
    const wed = slotsOf(cut, schedule, { now, from: '2026-11-04', to: '2026-11-04' });
    expect(wed.at(-1)).toMatchObject({ resources: ['pau'] });
  });

  it('are busy across every service they give', () => {
    const beard = { ...cut, id: 'beard', duration: 20 };
    const booked = makeBooking(readBookingRequest({ start: slotsOf(cut, schedule, day)[0].start, name: 'A', email: 'a@x.co', resource: 'memo' }), cut, now, slotsOf(cut, schedule, day));
    expect(slotsOf(beard, schedule, { ...day, busy: busyOfBookings([booked]) })[0].start).not.toBe(booked.start);
  });
});

describe('tickets', () => {
  const concert: EventType = {
    ...base,
    whole: true,
    notice: 0,
    hours: null,
    price: { amount: 600, currency: 'MXN', per: 'place' },
    resources: [
      { id: 'general', name: 'General', image: '', values: {}, price: null, capacity: 6 },
      { id: 'vip', name: 'VIP', image: '', values: {}, price: 1500, capacity: 2 },
    ],
  };
  const show = { ...schedule, weekly: { ...schedule.weekly, 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }, dates: { '2026-11-07': [{ from: '20:00', to: '23:30' }] } };

  it('are sold by zone, each its places, several at once', () => {
    const [slot] = slotsOf(concert, show, { now, from: '2026-11-07', to: '2026-11-07' });
    expect(slot).toMatchObject({ free: 8, resources: ['general', 'vip'] });
    const four = makeBooking(readBookingRequest({ start: slot.start, places: 4, resource: 'general', name: 'A', email: 'a@x.co' }), concert, now, [slot]);
    expect(four).toMatchObject({ places: 4, resource: 'general', price: { amount: 2400, currency: 'MXN' } });
    expect(local(four.end).slice(4)).toBe('23:30');
    const busy = busyOfBookings([four]);
    expect(slotsOf(concert, show, { now, from: '2026-11-07', to: '2026-11-07', busy })[0]).toMatchObject({ free: 4 });
    // Three together: the general has two left, the VIP two. None.
    expect(slotsOf(concert, show, { now, from: '2026-11-07', to: '2026-11-07', busy, places: 3 })).toEqual([]);
    expect(slotsOf(concert, show, { now, from: '2026-11-07', to: '2026-11-07', busy, places: 2 })[0].resources).toEqual(['general', 'vip']);
  });

  it('are seats of a room, each one, each its price', () => {
    const seat = (id: string, price: number | null) => ({ id, name: id, image: '', values: {}, price });
    const movie: EventType = { ...concert, resources: [seat('A1', null), seat('A2', null), seat('B1', 90), seat('B2', 90)], capacity: 1, price: { amount: 120, currency: 'MXN', per: 'place' } };
    const [slot] = slotsOf(movie, show, { now, from: '2026-11-07', to: '2026-11-07' });
    const asked = readBookingRequest({ start: slot.start, seats: ['A2', 'B1'], name: 'A', email: 'a@x.co' });
    const made = makeBooking(asked, movie, now, [slot]);
    expect(made).toMatchObject({ seats: ['A2', 'B1'], resource: 'A2', price: { amount: 210, currency: 'MXN' } });
    const [after] = slotsOf(movie, show, { now, from: '2026-11-07', to: '2026-11-07', busy: busyOfBookings([made]) });
    expect(after.resources).toEqual(['A1', 'B2']);
  });
});
