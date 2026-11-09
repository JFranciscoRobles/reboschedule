'use client';

// The cabins as their owners see them: a strip of four weeks, a row for
// each cabin, each stay a bar over its nights, today marked; how full each
// cabin is in those weeks and what it made; a stay chosen, who and how much,
// and cancelled if need be. Drawn on what the demo keeps, nothing of the
// package's look.

import { addDays, clockAt, formatMoney, takes } from '@reboschedule/core';
import { useState, useSyncExternalStore } from 'react';
import type { DemoStore } from '@/lib/demo';
import { type Locale, translator } from '@/lib/i18n';
import { formats } from './shared';

const DAYS = 28;

export function StayTape({ store, locale }: { store: DemoStore; locale: Locale }) {
  const t = translator(locale);
  useSyncExternalStore(
    store.subscribe,
    () => store.version,
    () => 0,
  );
  const type = store.data.types[0];
  const tz = store.data.schedule.timeZone;
  const today = clockAt(Date.now(), tz).day;
  const [from, setFrom] = useState(addDays(today, -2));
  const [chosen, setChosen] = useState<string | null>(null);
  const f = formats(locale, tz);
  const days = Array.from({ length: DAYS }, (_, i) => addDays(from, i));
  const last = days[DAYS - 1];
  const dayOf = (iso: string) => clockAt(Date.parse(iso), tz).day;
  // Those confirmed, and those held while they are paid for, until their minutes run out.
  const stays = store.bookings.filter((b) => takes(b) && b.type === type.id);
  // The nights of a stay, the day it arrives to the day before it leaves.
  const nights = (b: (typeof stays)[number]) => {
    const out: string[] = [];
    for (let d = dayOf(b.start); d < dayOf(b.end) && out.length < 60; d = addDays(d, 1)) out.push(d);
    return out;
  };
  const booking = stays.find((b) => b.id === chosen);
  const currency = type.price?.currency ?? 'MXN';

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <section className="min-w-0 rounded-2xl border border-line bg-white">
        <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <button type="button" onClick={() => setFrom(addDays(from, -7))} className="rounded-lg px-2 py-1 text-lg hover:bg-hover" aria-label={t({ en: 'A week before', es: 'Una semana antes' })}>
            ‹
          </button>
          <b className="min-w-[170px] text-center font-display">
            {f.dayNumber(from)} {f.month(from)} – {f.dayNumber(last)} {f.month(last)}
          </b>
          <button type="button" onClick={() => setFrom(addDays(from, 7))} className="rounded-lg px-2 py-1 text-lg hover:bg-hover" aria-label={t({ en: 'A week after', es: 'Una semana después' })}>
            ›
          </button>
          <span className="ml-auto text-xs text-muted">{t({ en: 'Each bar, a stay over its nights.', es: 'Cada barra, una estancia sobre sus noches.' })}</span>
        </header>
        <div className="overflow-x-auto">
          <div className="grid min-w-[860px]" style={{ gridTemplateColumns: `110px repeat(${DAYS}, minmax(0, 1fr))` }}>
            <span className="border-b border-line" />
            {days.map((d) => (
              <span key={d} className={`border-b border-l border-line py-1.5 text-center text-[11px] leading-tight ${d === today ? 'bg-[var(--demo-accent)] font-bold text-white' : 'text-muted'}`}>
                <span className="block uppercase">{f.weekday(d).slice(0, 2)}</span>
                {f.dayNumber(d)}
              </span>
            ))}
            {type.resources.map((r) => (
              <div key={r.id} className="contents">
                <span className="flex items-center gap-2 border-b border-line px-3 py-3 text-sm font-semibold">
                  {/* biome-ignore lint/performance/noImgElement: the cabin's own picture, as data. */}
                  <img src={r.image} alt="" className="h-6 w-9 rounded object-cover" />
                  {r.name}
                </span>
                <div className="relative grid border-b border-line" style={{ gridColumn: `span ${DAYS}`, gridTemplateColumns: `repeat(${DAYS}, minmax(0, 1fr))` }}>
                  {days.map((d) => (
                    <span key={d} className={`border-l border-line ${d === today ? 'bg-brand-light/40' : ''}`} />
                  ))}
                  {stays
                    .filter((b) => b.resource === r.id)
                    .map((b) => {
                      const shown = nights(b).filter((d) => d >= from && d <= last);
                      if (!shown.length) return null;
                      const start = days.indexOf(shown[0]);
                      const on = b.id === chosen;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setChosen(on ? null : b.id)}
                          title={`${b.name} · ${shown.length}${b.status === 'held' ? ` · ${t({ en: 'held, to pay', es: 'apartada, por pagar' })}` : ''}`}
                          className={`absolute inset-y-1.5 cursor-pointer truncate rounded-md px-1.5 text-left text-[11px] font-semibold text-white transition ${on ? 'ring-2 ring-ink ring-offset-1' : 'hover:brightness-110'}`}
                          style={{
                            left: `calc(${(start / DAYS) * 100}% + 2px)`,
                            width: `calc(${(shown.length / DAYS) * 100}% - 4px)`,
                            // Held, striped: its place kept while it is paid for.
                            background:
                              b.status === 'held' ? 'repeating-linear-gradient(135deg, var(--demo-accent) 0 6px, color-mix(in srgb, var(--demo-accent) 55%, white) 6px 12px)' : 'var(--demo-accent)',
                          }}
                        >
                          {b.name.split(' ')[0]}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-5">
        {booking ? (
          <section className="rounded-2xl border border-line bg-white p-4">
            <b className="block font-display text-lg">{booking.name}</b>
            <span className="block text-sm text-muted">{booking.email}</span>
            {booking.status === 'held' && booking.held && (
              <p className="m-0 mt-2 rounded-lg bg-pastel-yellow px-2.5 py-1.5 text-xs">
                {t({ en: 'Held while it is paid for: let go at ', es: 'Apartada mientras se paga: se libera a las ' })}
                {f.time(booking.held)}
              </p>
            )}
            <p className="m-0 mt-3 text-sm first-letter:uppercase">{f.when(booking.start)}</p>
            <p className="m-0 text-sm text-muted first-letter:uppercase">
              {t({ en: 'until ', es: 'hasta ' })}
              {f.when(booking.end)}
            </p>
            <p className="m-0 mt-2 text-sm">
              {type.resources.find((r) => r.id === booking.resource)?.name} · {nights(booking).length} {t({ en: 'nights', es: 'noches' })}
              {booking.price && <b> · {formatMoney(booking.price, locale)}</b>}
            </p>
            <button
              type="button"
              onClick={() => {
                store.remove(booking.id);
                setChosen(null);
              }}
              className="mt-4 w-full rounded-lg border border-line py-2 text-sm font-semibold text-[#b42a2a] hover:bg-pastel-pink"
            >
              {booking.status === 'held' ? t({ en: 'Let it go', es: 'Liberarla' }) : t({ en: 'Cancel the stay', es: 'Cancelar la estancia' })}
            </button>
          </section>
        ) : null}
        <section className="rounded-2xl border border-line bg-white p-4">
          <b className="text-sm">{t({ en: 'These four weeks', es: 'Estas cuatro semanas' })}</b>
          {type.resources.map((r) => {
            const mine = stays.filter((b) => b.resource === r.id);
            const taken = mine.flatMap(nights).filter((d) => d >= from && d <= last).length;
            const made = mine.filter((b) => b.status === 'confirmed' && dayOf(b.start) >= from && dayOf(b.start) <= last).reduce((n, b) => n + (b.price?.amount ?? 0), 0);
            return (
              <div key={r.id} className="mt-3 text-sm">
                <div className="flex justify-between">
                  <span>{r.name}</span>
                  <span className="font-code text-xs text-muted">{formatMoney({ amount: made, currency }, locale)}</span>
                </div>
                <span className="mt-1 block h-2 overflow-hidden rounded-full bg-hover">
                  <span className="block h-full rounded-full bg-[var(--demo-accent)]" style={{ width: `${(taken / DAYS) * 100}%` }} />
                </span>
                <span className="text-xs text-muted">{t({ en: `${taken} of ${DAYS} nights`, es: `${taken} de ${DAYS} noches` })}</span>
              </div>
            );
          })}
        </section>
      </aside>
    </div>
  );
}
