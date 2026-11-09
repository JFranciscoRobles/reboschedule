// The demos that need the width of the page, not only of its column of words:
// a module with no 'use client', so that the page, drawn on the server, reads
// the names and not a reference to them.

export const WIDE = new Set(['appointments', 'courts', 'rooms', 'shifts', 'classes', 'clinic', 'cabins', 'barber', 'tickets', 'widget', 'editor', 'headless']);
