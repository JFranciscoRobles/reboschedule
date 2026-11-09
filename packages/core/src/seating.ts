// A room of seats as it is laid out: its rows, `A` nearest the screen, each
// of blocks of seats with an aisle between; its seats made of it, a resource
// each, numbered from the left, those of the dearer rows at their price; and
// the room as it is drawn, row by row and block by block.

import type { EventType, Resource, Seating } from './model';

/** The letter of a row by its place, `A` the first; after `Z`, `AA`. */
export const rowName = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : rowName(Math.floor(i / 26) - 1) + rowName(i % 26));

/** The row of a seat, by its id: `C` of `C7`. */
export const rowOf = (seat: string) => seat.replace(/\d+$/, '');

/** The seats of a room, a resource each, row by row: `A1`, `A2`…; each of a dearer row at its price. */
export function seatsOf(seating: Seating): Resource[] {
  const each = seating.blocks.reduce((n, b) => n + b, 0);
  return Array.from({ length: seating.rows }, (_, i) => rowName(i)).flatMap((row) =>
    Array.from({ length: each }, (_, k) => ({ id: `${row}${k + 1}`, name: `${row}${k + 1}`, image: '', values: {}, price: seating.prices[row] ?? null })),
  );
}

/** A room as it is drawn: each row, its blocks of seats (an aisle between each), the ids of its seats in each. */
export function layoutOf(type: EventType): { row: string; blocks: string[][] }[] {
  const rows = [...new Set(type.resources.map((r) => rowOf(r.id)))];
  return rows.map((row) => {
    const seats = type.resources.filter((r) => rowOf(r.id) === row).map((r) => r.id);
    if (!type.seating) return { row, blocks: [seats] };
    let at = 0;
    return { row, blocks: type.seating.blocks.map((n) => seats.slice(at, (at += n))) };
  });
}

/** A seating as given: from one row to 26, from one block to six of one to 40 seats, the prices of rows there are. */
export function readSeating(given: unknown): Seating | null {
  if (!given || typeof given !== 'object') return null;
  const s = given as Record<string, unknown>;
  const whole = (v: unknown, least: number, most: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(most, Math.max(least, Math.round(v))) : least);
  const rows = whole(s.rows, 1, 26);
  const blocks = (Array.isArray(s.blocks) ? s.blocks : []).slice(0, 6).map((b) => whole(b, 1, 40));
  if (!blocks.length) return null;
  const names = new Set(Array.from({ length: rows }, (_, i) => rowName(i)));
  const prices = Object.fromEntries(
    Object.entries(s.prices && typeof s.prices === 'object' ? s.prices : {})
      .filter(([row, n]) => names.has(row) && typeof n === 'number' && Number.isFinite(n) && n >= 0)
      .map(([row, n]) => [row, Math.round((n as number) * 100) / 100]),
  );
  return { rows, blocks, prices };
}
