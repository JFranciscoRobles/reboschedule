// What a thing booked says of itself, in words: its fields as its kind has
// them, each that it has. A yes is the field's name ("Covered"), a no is
// nothing; a number goes with its unit ("10 people").

import type { EventType, Resource } from '@reboschedule/core';

export function valuesOf(type: EventType, r: Resource): string[] {
  return type.fields.flatMap((f) => {
    const v = r.values[f.id];
    if (v === undefined || v === '' || v === false) return [];
    if (f.kind === 'yes-no') return [f.label];
    if (f.kind === 'number') return [f.unit ? `${v} ${f.unit}` : `${f.label}: ${v}`];
    return [String(v)];
  });
}
