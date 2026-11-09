'use client';

// What was booked, as whoever runs it reads it: this month, the last thirty
// days or the next thirty; what came in, how many, what was given back, who
// came and who did not, what codes took off and what is left to charge
// there; the money of each day as columns (a tooltip on each, a table for
// all), how full each resource was, the codes used; and every booking as a
// CSV. `reportOf` and `bookingsCsv` of the core, drawn here.

import { addDays, bookingsCsv, clockAt, formatMoney, type Report, reportOf } from '@reboschedule/core';
import { useMemo, useState, useSyncExternalStore } from 'react';
import type { DemoStore } from '@/lib/demo';
import { type Locale, translator } from '@/lib/i18n';
import { formats } from './shared';

/** The mark's color: the brand's teal, a step more vivid so it reads as color, not gray. */
const MARK = '#0d9488';

type Range = 'month' | 'last' | 'next';

export function ReportView({ store, locale }: { store: DemoStore; locale: Locale }) {
  const t = translator(locale);
  useSyncExternalStore(
    store.subscribe,
    () => store.version,
    () => 0,
  );
  const { types, schedule } = store.data;
  const tz = schedule.timeZone;
  const f = formats(locale, tz);
  // The demos' bookings are mostly ahead: the next days first.
  const [range, setRange] = useState<Range>('next');
  const [table, setTable] = useState(false);
  const today = clockAt(Date.now(), tz).day;
  const span = useMemo(() => {
    if (range === 'last') return { from: addDays(today, -29), to: today };
    if (range === 'next') return { from: today, to: addDays(today, 29) };
    const first = `${today.slice(0, 7)}-01`;
    const [y, m] = first.split('-').map(Number);
    return { from: first, to: addDays(`${new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)}`, -1) };
  }, [range, today]);
  const r = useMemo(() => reportOf(store.bookings, types, schedule, span), [store.bookings, types, schedule, span]);
  const money = (amount: number) => formatMoney({ amount, currency: r.currency }, locale);

  const download = () => {
    const blob = new Blob([bookingsCsv(store.bookings, types, schedule)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${store.data.organizer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-reservas.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const tiles: { label: string; value: string; note?: string }[] = [
    {
      label: t({ en: 'Came in', es: 'Ingresos' }),
      value: money(r.totals.revenue),
      note: r.totals.refunded ? t({ en: `after ${money(r.totals.refunded)} given back`, es: `ya sin ${money(r.totals.refunded)} devueltos` }) : undefined,
    },
    {
      label: t({ en: 'Bookings', es: 'Reservas' }),
      value: String(r.totals.bookings),
      note: r.totals.places !== r.totals.bookings ? t({ en: `${r.totals.places} places`, es: `${r.totals.places} lugares` }) : undefined,
    },
    { label: t({ en: 'Cancelled', es: 'Canceladas' }), value: String(r.totals.cancelled) },
    {
      label: t({ en: 'Did not come', es: 'No vinieron' }),
      value: r.totals.arrived + r.totals.noShows ? `${Math.round(r.totals.noShowRate * 100)}%` : '—',
      note: t({ en: `${r.totals.arrived} came · ${r.totals.noShows} did not`, es: `${r.totals.arrived} llegaron · ${r.totals.noShows} no` }),
    },
    { label: t({ en: 'Codes took off', es: 'Descuentos' }), value: money(r.totals.discounts) },
    ...(r.totals.due ? [{ label: t({ en: 'To charge there', es: 'Por cobrar allá' }), value: money(r.totals.due) }] : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <fieldset className="m-0 flex min-w-0 gap-1 rounded-xl border-0 bg-hover p-1" aria-label={t({ en: 'Which days', es: 'Qué días' })}>
          {(
            [
              ['last', t({ en: 'Last 30 days', es: 'Últimos 30 días' })],
              ['month', t({ en: 'This month', es: 'Este mes' })],
              ['next', t({ en: 'Next 30 days', es: 'Próximos 30 días' })],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={range === v}
              onClick={() => setRange(v)}
              className="rounded-[9px] px-3.5 py-1.5 text-sm font-semibold text-ink-soft aria-pressed:bg-white aria-pressed:text-ink aria-pressed:shadow-[0_1px_3px_rgba(0,0,0,0.16)]"
            >
              {label}
            </button>
          ))}
        </fieldset>
        <span className="text-sm text-muted">
          {f.dayNumber(span.from)} {f.month(span.from)} – {f.dayNumber(span.to)} {f.month(span.to)}
        </span>
        <button type="button" onClick={download} className="ml-auto rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-semibold hover:bg-hover">
          ⬇ {t({ en: 'All bookings, CSV', es: 'Todas las reservas, CSV' })}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((x) => (
          <div key={x.label} className="rounded-2xl border border-line bg-white px-4 py-3">
            <p className="m-0 text-xs font-semibold text-muted">{x.label}</p>
            <p className="m-0 mt-1 whitespace-nowrap font-display text-[clamp(18px,1.7vw,24px)] font-bold tabular-nums">{x.value}</p>
            {x.note && <p className="m-0 text-xs text-muted">{x.note}</p>}
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <b className="font-display text-lg">{t({ en: 'What came in each day', es: 'Lo que entró cada día' })}</b>
          <span className="text-xs text-muted">{t({ en: 'by the day each booking is', es: 'por el día de cada reserva' })}</span>
          <button type="button" onClick={() => setTable(!table)} className="ml-auto text-sm font-semibold text-ink-soft underline">
            {table ? t({ en: 'See the chart', es: 'Ver la gráfica' }) : t({ en: 'See as a table', es: 'Ver como tabla' })}
          </button>
        </div>
        {table ? <DaysTable r={r} money={money} f={f} t={t} /> : <Columns r={r} money={money} f={f} t={t} />}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
          <b className="font-display text-lg">{t({ en: 'How full each one was', es: 'Qué tan lleno estuvo cada uno' })}</b>
          <p className="m-0 text-xs text-muted">{t({ en: 'of the hours (or nights) it had open', es: 'de las horas (o noches) que tuvo abiertas' })}</p>
          <Occupancy r={r} store={store} money={money} />
        </section>
        <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
          <b className="font-display text-lg">{t({ en: 'Codes used', es: 'Códigos usados' })}</b>
          {r.coupons.length ? (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="pb-1 font-semibold">{t({ en: 'Code', es: 'Código' })}</th>
                  <th className="pb-1 text-right font-semibold">{t({ en: 'Uses', es: 'Usos' })}</th>
                  <th className="pb-1 text-right font-semibold">{t({ en: 'Took off', es: 'Descontó' })}</th>
                </tr>
              </thead>
              <tbody>
                {r.coupons.map((c) => (
                  <tr key={c.code} className="border-t border-line">
                    <td className="py-1.5 font-code text-xs">{c.code}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.uses}</td>
                    <td className="py-1.5 text-right tabular-nums">{money(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="m-0 mt-3 text-sm text-muted">{t({ en: 'No code used these days.', es: 'Ningún código usado en estos días.' })}</p>
          )}
        </section>
      </div>
    </div>
  );
}

type Say = ReturnType<typeof translator>;
type Fmt = ReturnType<typeof formats>;

/** A round top for the axis: 1, 2 or 5 times a power of ten, at least the most. */
const niceTop = (most: number) => {
  if (most <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(most));
  return ([1, 2, 5, 10].find((k) => k * p >= most) ?? 10) * p;
};

/** The money of each day as columns, one hue, a tooltip on each. */
function Columns({ r, money, f, t }: { r: Report; money: (n: number) => string; f: Fmt; t: Say }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = niceTop(Math.max(...r.days.map((d) => d.revenue)));
  const H = 200;
  const ticks = [0, top / 2, top];
  const day = hover === null ? null : r.days[hover];
  return (
    <div className="relative mt-4 flex gap-2">
      {/* The axis: three clean values, recessive. */}
      <div className="relative w-16 flex-none text-right text-[11px] text-muted tabular-nums" style={{ height: H }}>
        {ticks.map((v) => (
          <span key={v} className="absolute right-1 -translate-y-1/2" style={{ top: H - (v / top) * H }}>
            {v >= 10_000 ? `${Math.round(v / 1000)}K` : v.toLocaleString()}
          </span>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        {ticks.map((v) => (
          <span key={v} className="absolute inset-x-0 border-t border-line" style={{ top: H - (v / top) * H }} aria-hidden="true" />
        ))}
        <div className="relative flex items-end gap-[2px]" style={{ height: H }}>
          {r.days.map((d, i) => (
            // The whole band is the target, taller and wider than the column in it.
            <button
              key={d.day}
              type="button"
              className="flex h-full min-w-0 flex-1 cursor-default items-end justify-center bg-transparent p-0"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${f.long(d.day)}: ${money(d.revenue)}`}
            >
              <span
                className="block w-full max-w-6 rounded-t-[4px] transition-opacity"
                style={{ height: Math.max(d.revenue > 0 ? 2 : 0, (d.revenue / top) * H), background: MARK, opacity: hover === null || hover === i ? 1 : 0.45 }}
              />
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span>
            {f.dayNumber(r.days[0].day)} {f.month(r.days[0].day)}
          </span>
          <span>
            {f.dayNumber(r.days[r.days.length - 1].day)} {f.month(r.days[r.days.length - 1].day)}
          </span>
        </div>
        {day && hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-max -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-menu"
            style={{ left: `${((hover + 0.5) / r.days.length) * 100}%` }}
          >
            <b className="block first-letter:uppercase">{f.long(day.day)}</b>
            {money(day.revenue)} · {t({ en: `${day.bookings} bookings`, es: `${day.bookings} reservas` })}
            {day.refunded > 0 && <span className="block opacity-80">{t({ en: `${money(day.refunded)} given back`, es: `${money(day.refunded)} devueltos` })}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function DaysTable({ r, money, f, t }: { r: Report; money: (n: number) => string; f: Fmt; t: Say }) {
  return (
    <div className="mt-3 max-h-[320px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white">
          <tr className="text-left text-xs text-muted">
            <th className="pb-1 font-semibold">{t({ en: 'Day', es: 'Día' })}</th>
            <th className="pb-1 text-right font-semibold">{t({ en: 'Bookings', es: 'Reservas' })}</th>
            <th className="pb-1 text-right font-semibold">{t({ en: 'Came in', es: 'Entró' })}</th>
            <th className="pb-1 text-right font-semibold">{t({ en: 'Given back', es: 'Devuelto' })}</th>
            <th className="pb-1 text-right font-semibold">{t({ en: 'Cancelled', es: 'Canceladas' })}</th>
          </tr>
        </thead>
        <tbody>
          {r.days.map((d) => (
            <tr key={d.day} className="border-t border-line">
              <td className="py-1 first-letter:uppercase">{f.long(d.day)}</td>
              <td className="py-1 text-right tabular-nums">{d.bookings}</td>
              <td className="py-1 text-right tabular-nums">{money(d.revenue)}</td>
              <td className="py-1 text-right tabular-nums">{d.refunded ? money(d.refunded) : '—'}</td>
              <td className="py-1 text-right tabular-nums">{d.cancelled || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** How full each resource was, the fullest first; a room of seats as one. */
function Occupancy({ r, store, money }: { r: Report; store: DemoStore; money: (n: number) => string }) {
  const rows = store.data.types.flatMap((type) => {
    const mine = r.resources.filter((x) => x.type === type.id);
    if (!type.seating || !mine.length) return mine.map((x) => ({ ...x, label: store.data.types.length > 1 && type.resources.length ? `${x.name} · ${type.title}` : x.name }));
    // The seats of a room, one row: the room's share of its seats' hours.
    return [
      {
        ...mine[0],
        label: type.title,
        occupancy: mine.reduce((n, x) => n + x.occupancy, 0) / mine.length,
        revenue: mine.reduce((n, x) => n + x.revenue, 0),
      },
    ];
  });
  return (
    <ul className="m-0 mt-3 flex max-h-[340px] list-none flex-col gap-2.5 overflow-y-auto p-0">
      {[...rows]
        .sort((a, b) => b.occupancy - a.occupancy)
        .map((x) => (
          <li key={`${x.type}${x.resource}`} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate" title={x.label}>
              {x.label}
            </span>
            <span className="h-3 overflow-hidden rounded-r-[4px] bg-hover" title={money(x.revenue)}>
              <span className="block h-full rounded-r-[4px]" style={{ width: `${Math.round(x.occupancy * 100)}%`, background: MARK }} />
            </span>
            <span className="w-10 text-right tabular-nums text-ink-soft">{Math.round(x.occupancy * 100)}%</span>
          </li>
        ))}
    </ul>
  );
}
