import { describe, expect, it } from 'vitest';
import { formatMoney, makeBooking, priceSlots, quoteOf, readBookingRequest, readEventType, sampleEventTypes, sampleSchedule, slotsOf } from '../src';

const court = sampleEventTypes('es').find((t) => t.id === 'court')!;
const now = Date.parse('2026-11-04T20:00:00Z'); // Wednesday noon, in Tijuana

describe('what it costs', () => {
  it('is the kind’s price each hour for as long as it lasts, or the resource’s own', () => {
    expect(quoteOf(court, { resource: 'court-1', length: 120 })).toEqual({ amount: 700, currency: 'MXN' });
    expect(quoteOf(court, { resource: 'court-4', length: 90 })).toEqual({ amount: 675, currency: 'MXN' });
    expect(quoteOf({ ...court, price: { amount: 500, currency: 'MXN', per: 'booking' } }, { length: 120 })).toEqual({ amount: 500, currency: 'MXN' });
    expect(quoteOf({ ...court, price: null })).toBeNull();
  });

  it('prices each time free, as the resource asked or the first free, or by rules of one’s own', () => {
    const slots = slotsOf(court, sampleSchedule(), { now, from: '2026-11-05', to: '2026-11-05', length: 60 });
    expect(priceSlots(slots, court, { length: 60 })[0].price).toEqual({ amount: 350, currency: 'MXN' });
    expect(priceSlots(slots, court, { length: 60, resource: 'court-5' })[0].price).toEqual({ amount: 450, currency: 'MXN' });
    // An evening that costs a hundred more each hour.
    const evening = priceSlots(slots, court, {
      length: 60,
      quote: ({ type, resource, start, length }) => {
        const base = quoteOf(type, { resource, length })!;
        return new Date(start).getUTCHours() >= 2 && new Date(start).getUTCHours() < 7 ? { ...base, amount: base.amount + 100 } : base;
      },
    });
    expect(evening.find((s) => s.start === '2026-11-06T02:00:00.000Z')?.price).toEqual({ amount: 450, currency: 'MXN' }); // 18:00 in Tijuana
    expect(evening[0].price).toEqual({ amount: 350, currency: 'MXN' });
  });

  it('is quoted when it is booked, whatever the browser says', () => {
    const slots = slotsOf(court, sampleSchedule(), { now, from: '2026-11-05', to: '2026-11-05', length: 90 });
    const b = makeBooking(readBookingRequest({ start: slots[0].start, length: 90, resource: 'court-4', name: 'Ana', email: 'a@x.co', price: { amount: 1, currency: 'MXN' } }), court, now, slots);
    expect(b.price).toEqual({ amount: 675, currency: 'MXN' });
  });

  it('reads a price that is one', () => {
    expect(readEventType({ price: { amount: 350.555, currency: 'mxn' } }).price).toEqual({ amount: 350.56, currency: 'MXN', per: 'hour' });
    expect(readEventType({ price: { amount: -1, currency: 'MXN' } }).price).toBeNull();
    expect(readEventType({ price: { amount: 10, currency: 'pesos' } }).price).toBeNull();
    expect(
      readEventType({
        resources: [
          { name: 'A', price: 99.999 },
          { name: 'B', price: 'free' },
        ],
      }).resources.map((r) => r.price),
    ).toEqual([100, null]);
  });

  it('says an amount with its symbol and its currency, in each language', () => {
    expect(formatMoney({ amount: 900, currency: 'MXN' }, 'es')).toBe('$900 MXN');
    expect(formatMoney({ amount: 1100, currency: 'MXN' }, 'es')).toBe('$1,100 MXN');
    expect(formatMoney({ amount: 1250.5, currency: 'MXN' }, 'en')).toBe('$1,250.50 MXN');
    expect(formatMoney({ amount: 30, currency: 'EUR' }, 'es')).toBe('€30 EUR');
  });
});
