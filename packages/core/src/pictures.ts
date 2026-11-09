// Pictures to start from, drawn as SVG and given as data, so a thing booked
// has one before anyone uploads their own: a padel court seen from above
// (its net and its service line; a roof over it when it is covered), and a
// meeting room's table with as many chairs as it holds.

const data = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

/** A padel court from above, in its colour; with a roof over it if it is covered. */
export function courtPicture({ color = '#3f6aa0', covered = false }: { color?: string; covered?: boolean } = {}) {
  const roof = covered ? '<path d="M14 30 120 6l106 24" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' : '';
  return data(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 132"><rect width="240" height="132" rx="26" fill="#232823"/><rect x="20" y="${covered ? 34 : 22}" width="200" height="${covered ? 82 : 88}" rx="16" fill="${color}"/><g fill="none" stroke="#fff" stroke-width="3"><rect x="40" y="${covered ? 46 : 36}" width="160" height="${covered ? 58 : 60}"/><path d="M120 ${covered ? 40 : 28}v${covered ? 70 : 76}M80 ${covered ? 75 : 66}h80"/></g>${roof}</svg>`,
  );
}

/** A meeting room's table from above, with as many chairs as it holds, up to fourteen. */
export function roomPicture(people: number, color = '#7c3aed') {
  const n = Math.max(2, Math.min(14, Math.round(people)));
  const side = Math.ceil(n / 2);
  const width = 40 + side * 24;
  const x0 = 120 - width / 2;
  const chairs: string[] = [];
  for (let i = 0; i < n; i++) {
    const row = i < side ? 0 : 1;
    const k = row ? i - side : i;
    const count = row ? n - side : side;
    const x = 120 - ((count - 1) * 24) / 2 + k * 24;
    chairs.push(`<rect x="${x - 8}" y="${row ? 92 : 24}" width="16" height="14" rx="5" fill="${color}" fill-opacity=".55"/>`);
  }
  return data(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 132"><rect width="240" height="132" rx="26" fill="#f1edf9"/>${chairs.join('')}<rect x="${x0}" y="42" width="${width}" height="46" rx="20" fill="#fff" stroke="${color}" stroke-width="3"/></svg>`,
  );
}
