import { describe, expect, it } from 'vitest';
import { holdBooking, layoutOf, readEventType, readSeating, rowName, sampleEventTypes, seatsOf, takes, confirmBooking, type Booking } from '../src';

describe('a room of seats', () => {
  const seating = { rows: 3, blocks: [2, 4, 2], prices: { C: 160 } };

  it('makes a seat of each place, row by row, the dearer rows at their price', () => {
    const seats = seatsOf(seating);
    expect(seats).toHaveLength(24);
    expect(seats.slice(0, 3).map((s) => s.id)).toEqual(['A1', 'A2', 'A3']);
    expect(seats.find((s) => s.id === 'C8')?.price).toBe(160);
    expect(seats.find((s) => s.id === 'A8')?.price).toBeNull();
    expect([rowName(0), rowName(25), rowName(26)]).toEqual(['A', 'Z', 'AA']);
  });

  it('is drawn row by row, block by block, an aisle between', () => {
    const type = readEventType({ ...sampleEventTypes('es')[0], seating });
    const [a] = layoutOf(type);
    expect(a.blocks).toEqual([
      ['A1', 'A2'],
      ['A3', 'A4', 'A5', 'A6'],
      ['A7', 'A8'],
    ]);
  });

  it('is read within reason, its seats made of it however many', () => {
    expect(readSeating({ rows: 99, blocks: [0, 50], prices: { A: 10, Z: 5, B: -1 } })).toEqual({ rows: 26, blocks: [1, 40], prices: { A: 10, Z: 5 } });
    expect(readSeating({ rows: 3, blocks: [] })).toBeNull();
    expect(readEventType({ ...sampleEventTypes('es')[0], seating: { rows: 10, blocks: [6, 6] } }).resources).toHaveLength(120);
  });
});

describe('held', () => {
  const booking = { id: 'b', status: 'confirmed', start: '', end: '', payment: { provider: 'x', id: 'p' } } as unknown as Booking;
  it('takes its place until it runs out; confirmed, for good', () => {
    const held = holdBooking(booking, 10, 0);
    expect(takes(held, 9 * 60_000)).toBe(true);
    expect(takes(held, 10 * 60_000)).toBe(false);
    const paid = confirmBooking(held, 'pi');
    expect(paid).toMatchObject({ status: 'confirmed', payment: { paid: 'pi' } });
    expect('held' in paid).toBe(false);
  });
});
