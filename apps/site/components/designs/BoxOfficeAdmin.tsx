'use client';

// The box office as whoever runs it sees it: each show of the next days,
// how full it is and what it made; a show opened, the film's room drawn
// with who sits in each seat, or the night's zones with who bought how many;
// a sale cancelled, its places free again. Drawn on what the demo keeps,
// nothing of the package's look.

import { addDays, type Booking, clockAt, type EventType, formatMoney, layoutOf, startsOn, takes } from '@reboschedule/core';
import { useState, useSyncExternalStore } from 'react';
import type { DemoStore } from '@/lib/demo';
import { type Locale, translator } from '@/lib/i18n';
import { Door } from './Door';
import { SeatingEditor } from './SeatingEditor';
import { formats } from './shared';

export function BoxOfficeAdmin({ store, locale }: { store: DemoStore; locale: Locale }) {
  const t = translator(locale);
  useSyncExternalStore(
    store.subscribe,
    () => store.version,
    () => 0,
  );
  const { types, schedule } = store.data;
  const tz = schedule.timeZone;
  const f = formats(locale, tz);
  const [kind, setKind] = useState(types[0].id);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [door, setDoor] = useState(false);
  const type = types.find((x) => x.id === kind)!;
  const now = Date.now();
  const today = clockAt(now, tz).day;
  // The shows to come: those of the next week for the film, of the next five Saturdays for the night.
  const shows = Array.from({ length: type.horizon + 1 }, (_, i) => {
    const d = addDays(today, i);
    return startsOn(type, schedule, d).map((s) => ({ ...s, day: d }));
  })
    .flat()
    .filter((s) => s.end > now)
    .slice(0, 12);
  // Sold, and held while they are paid for: their places taken until their minutes run out.
  const sold = (start: number) => store.bookings.filter((b) => takes(b) && b.type === type.id && Date.parse(b.start) === start);
  const placesOf = (b: Booking) => b.seats?.length ?? b.places ?? 1;
  const capacity = type.resources.reduce((n, r) => n + (r.capacity ?? type.capacity), 0);
  const shown = shows.find((s) => String(s.start) === open) ?? shows[0];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {types.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={kind === x.id}
            onClick={() => (setKind(x.id), setOpen(null), setEditing(false))}
            className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft hover:border-ink/30 aria-pressed:border-transparent aria-pressed:bg-ink aria-pressed:text-white"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />
            {x.title}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={door}
          onClick={() => (setDoor(!door), setEditing(false))}
          className="ml-auto rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft hover:border-ink/30 aria-pressed:border-transparent aria-pressed:bg-ink aria-pressed:text-white"
        >
          🎟 {t({ en: 'The door', es: 'Entrada' })}
        </button>
        {type.seating && !editing && !door && (
          <button type="button" onClick={() => setEditing(true)} className=" rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft hover:border-ink/30">
            {t({ en: 'Lay out the room', es: 'Configurar la sala' })}
          </button>
        )}
      </div>
      {door ? (
        <Door store={store} locale={locale} type={type.id} />
      ) : editing ? (
        <SeatingEditor type={type} store={store} locale={locale} onDone={() => setEditing(false)} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {shows.map((s) => {
              const list = sold(s.start);
              const n = list.reduce((k, b) => k + placesOf(b), 0);
              const made = list.filter((b) => b.status === 'confirmed').reduce((k, b) => k + (b.price?.amount ?? 0), 0);
              const on = shown?.start === s.start;
              return (
                <li key={s.start}>
                  <button
                    type="button"
                    onClick={() => setOpen(String(s.start))}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${on ? 'border-ink bg-white' : 'border-line bg-surface hover:bg-white'}`}
                  >
                    <span className="flex items-baseline justify-between gap-2 text-sm">
                      <b className="capitalize">
                        {f.weekday(s.day)} {f.dayNumber(s.day)} · {f.time(s.start)}
                      </b>
                      <span className="font-code text-xs text-muted">{formatMoney({ amount: made, currency: type.price?.currency ?? 'MXN' }, locale)}</span>
                    </span>
                    <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-hover">
                      <span className="block h-full rounded-full" style={{ width: `${(n / capacity) * 100}%`, background: type.color }} />
                    </span>
                    <span className="text-xs text-muted">{t({ en: `${n} of ${capacity} sold`, es: `${n} de ${capacity} vendidos` })}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {shown && <Show key={shown.start} type={type} sold={sold(shown.start)} store={store} locale={locale} title={`${f.long(shown.day)} · ${f.time(shown.start)}`} />}
        </div>
      )}
    </div>
  );
}

function Show({ type, sold, store, locale, title }: { type: EventType; sold: Booking[]; store: DemoStore; locale: Locale; title: string }) {
  const t = translator(locale);
  const [chosen, setChosen] = useState<string | null>(null);
  const sale = sold.find((b) => b.id === chosen);
  const bySeat = new Map(sold.flatMap((b) => (b.seats ?? []).map((s) => [s, b] as const)));
  const seated = !!type.seating;
  const f = formats(locale, store.data.schedule.timeZone);

  return (
    <section className="min-w-0 rounded-2xl border border-line bg-white p-4">
      <b className="block font-display text-lg first-letter:uppercase">{title}</b>
      {seated ? (
        <div className="mt-4 overflow-x-auto">
          <div className="mx-auto w-fit">
            <p className="m-0 mb-3 rounded bg-hover py-1 text-center text-[10px] uppercase tracking-[0.3em] text-muted">{t({ en: 'Screen', es: 'Pantalla' })}</p>
            {layoutOf(type).map(({ row, blocks }) => (
              <div key={row} className="mb-1 flex items-center gap-3">
                <span className="-mr-1.5 w-4 text-center text-[11px] text-muted">{row}</span>
                {blocks.map((block) => (
                  <div key={block[0]} className="flex gap-1">
                    {block.map((id) => {
                      const b = bySeat.get(id);
                      const held = b?.status === 'held';
                      return (
                        <button
                          key={id}
                          type="button"
                          disabled={!b}
                          title={b ? `${id} · ${b.name}${held ? ` · ${t({ en: 'held, to pay', es: 'apartado, por pagar' })}` : ''}` : id}
                          onClick={() => b && setChosen(b.id)}
                          className={`size-6 rounded-t-[7px] rounded-b-[3px] text-[9px] font-bold ${b ? (b.id === chosen ? 'bg-ink text-white' : 'cursor-pointer text-white') : 'bg-hover text-muted'}`}
                          style={
                            b && b.id !== chosen
                              ? { background: held ? `repeating-linear-gradient(135deg, ${type.color} 0 4px, color-mix(in srgb, ${type.color} 45%, white) 4px 8px)` : type.color }
                              : undefined
                          }
                        >
                          {b ? b.name[0] : id.slice(row.length)}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {type.resources.map((z) => {
            const mine = sold.filter((b) => b.resource === z.id);
            const n = mine.reduce((k, b) => k + (b.places ?? 1), 0);
            const cap = z.capacity ?? type.capacity;
            return (
              <div key={z.id} className="rounded-xl bg-surface p-3">
                <div className="flex items-baseline justify-between">
                  <b>{z.name}</b>
                  <span className="text-sm text-muted">
                    {n} / {cap}
                  </span>
                </div>
                <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-white">
                  <span className="block h-full rounded-full" style={{ width: `${(n / cap) * 100}%`, background: type.color }} />
                </span>
                <ul className="m-0 mt-2 flex max-h-[200px] list-none flex-col overflow-y-auto p-0 text-sm">
                  {mine.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => setChosen(b.id)}
                        className={`flex w-full justify-between rounded px-1.5 py-0.5 text-left hover:bg-white ${b.id === chosen ? 'bg-white font-semibold' : ''}`}
                      >
                        <span className="truncate">{b.name}</span>
                        <span className="font-code text-xs">
                          {b.status === 'held' ? `${t({ en: 'held', es: 'apartado' })} · ` : ''}×{b.places ?? 1}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      {sale && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
          <span className="mr-auto">
            <b>{sale.name}</b> · {sale.seats ? sale.seats.join(', ') : `${sale.places ?? 1} × ${type.resources.find((r) => r.id === sale.resource)?.name}`}
            {sale.price && ` · ${formatMoney(sale.price, locale)}`}
            {sale.status === 'held' && sale.held && (
              <span className="ml-2 rounded bg-pastel-yellow px-1.5 py-0.5 text-xs">
                {t({ en: 'held, to pay · let go at ', es: 'apartado, por pagar · se libera ' })}
                {f.time(sale.held)}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              store.remove(sale.id);
              setChosen(null);
            }}
            className="rounded-lg border border-line bg-white px-3 py-1.5 font-semibold text-[#b42a2a] hover:bg-pastel-pink"
          >
            {sale.status === 'held' ? t({ en: 'Let the places go', es: 'Liberar los lugares' }) : t({ en: 'Refund and free the places', es: 'Reembolsar y liberar lugares' })}
          </button>
        </div>
      )}
    </section>
  );
}
