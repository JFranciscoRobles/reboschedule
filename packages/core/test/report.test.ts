import { describe, expect, it } from 'vitest';
import { type Booking, bookingsCsv, checkIn, describeEntry, reportOf, sampleEventTypes, sampleSchedule } from '../src';

const schedule = sampleSchedule('America/Tijuana');
const court = { ...sampleEventTypes('es')[2], price: { amount: 300, currency: 'MXN', per: 'booking' as const } };
const at = (start: string, over: Partial<Booking> = {}): Booking => ({
  id: start + (over.name ?? ''),
  type: court.id,
  resource: court.resources[0].id,
  start,
  end: new Date(Date.parse(start) + 3_600_000).toISOString(),
  name: 'Ana, "la de siempre"',
  email: 'a@x.co',
  timeZone: 'America/Tijuana',
  answers: {},
  status: 'confirmed',
  price: { amount: 300, currency: 'MXN' },
  created: '2026-11-01T00:00:00.000Z',
  ...over,
});

describe('the door', () => {
  const b = at('2026-11-03T18:00:00.000Z');
  it('lets a ticket in once, the day of it', () => {
    const first = checkIn(b, Date.parse('2026-11-03T17:50:00Z'), 'America/Tijuana');
    expect(first).toMatchObject({ ok: true, booking: { attended: 'arrived' } });
    const again = checkIn(first.booking, Date.parse('2026-11-03T17:55:00Z'), 'America/Tijuana');
    expect(again).toMatchObject({ ok: false, reason: 'used' });
    expect(describeEntry('used', 'es', first.booking.arrived, 'America/Tijuana')).toBe('Este boleto ya entró a las 9:50.');
    expect(checkIn(b, Date.parse('2026-11-02T18:00:00Z'), 'America/Tijuana')).toMatchObject({ ok: false, reason: 'not-today' });
    expect(checkIn({ ...b, status: 'cancelled' }, Date.parse('2026-11-03T17:50:00Z'))).toMatchObject({ ok: false, reason: 'cancelled' });
  });
});

describe('a report', () => {
  const bookings = [
    at('2026-11-02T18:00:00.000Z', { attended: 'arrived', discount: { code: 'DIEZ', amount: 30 }, price: { amount: 270, currency: 'MXN' } }),
    at('2026-11-02T20:00:00.000Z', { attended: 'no-show' }),
    at('2026-11-03T18:00:00.000Z', { status: 'cancelled', payment: { provider: 'x', id: 'p', paid: 'pi', amount: 300 }, refunded: { amount: 150, currency: 'MXN' } }),
    at('2026-11-03T20:00:00.000Z', { status: 'held' }),
  ];

  it('adds up each day, the codes, who came and who did not', () => {
    const r = reportOf(bookings, [court], schedule, { from: '2026-11-02', to: '2026-11-03' });
    expect(r.days.map((d) => [d.day, d.bookings, d.revenue, d.refunded, d.cancelled])).toEqual([
      ['2026-11-02', 2, 570, 0, 0],
      ['2026-11-03', 0, 150, 150, 1],
    ]);
    expect(r.totals).toMatchObject({ bookings: 2, revenue: 720, refunded: 150, discounts: 30, cancelled: 1, arrived: 1, noShows: 1, noShowRate: 0.5 });
    expect(r.coupons).toEqual([{ code: 'DIEZ', uses: 1, amount: 30 }]);
    const first = r.resources[0];
    expect(first.bookings).toBe(2);
    expect(first.occupancy).toBeGreaterThan(0);
  });

  it('writes every booking as a row a spreadsheet reads, its times as the owner’s clock says them', () => {
    const csv = bookingsCsv(bookings.slice(0, 1), [court], schedule);
    const [head, row] = csv.replace('﻿', '').trim().split('\r\n');
    expect(head.startsWith('id,kind,what,start')).toBe(true);
    expect(row).toContain('2026-11-02 10:00');
    expect(row).toContain('"Ana, ""la de siempre"""');
    expect(row).toContain('DIEZ,30');
  });
});
