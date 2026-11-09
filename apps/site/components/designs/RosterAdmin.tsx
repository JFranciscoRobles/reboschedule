'use client';

// The roster as whoever coordinates it sees it: a calendar of the month for
// each division, one under the other, each day its two turns, each given by hand
// to someone of its division (those who cannot that day said so); the rest
// of the month given automatically, as evenly as can be; how many each one
// has; and the changes the agents asked of each other. Drawn on the engine's
// roster (`turnsOf`, `assignRoster`), nothing of the package's look.

import { clockAt, monthOf, turnsOf } from '@reboschedule/core';
import { useState, useSyncExternalStore } from 'react';
import type { DemoStore } from '@/lib/demo';
import { type Locale, translator } from '@/lib/i18n';
import { formats } from './shared';

export function RosterAdmin({ store, locale }: { store: DemoStore; locale: Locale }) {
  const t = translator(locale);
  useSyncExternalStore(
    store.subscribe,
    () => store.version,
    () => 0,
  );
  const { schedule } = store.data;
  const type = store.data.types[0];
  const tz = schedule.timeZone;
  const today = clockAt(Date.now(), tz).day;
  const [month, setMonth] = useState(today.slice(0, 7));
  const [note, setNote] = useState('');
  const f = formats(locale, tz);
  const members = store.members();
  const turns = turnsOf(type, schedule, month);
  const holder = new Map(store.bookings.filter((b) => b.status === 'confirmed').map((b) => [`${b.resource}|${Date.parse(b.start)}`, b]));
  const groupName = (id: string) => type.resources.find((r) => r.id === id)?.name ?? id;
  const mine = (id: string) => store.bookings.filter((b) => b.status === 'confirmed' && b.member === id && clockAt(Date.parse(b.start), tz).day.startsWith(month)).length;
  const most = Math.max(1, ...members.map((m) => mine(m.id)));
  const from = month === today.slice(0, 7) ? today : `${month}-01`;
  const move = (by: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + by, 1));
    setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  };
  const say = (text: string) => {
    setNote(text);
    setTimeout(() => setNote(''), 3200);
  };
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-15T12:00:00Z`));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <section className="min-w-0 rounded-2xl border border-line bg-white">
        <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <button type="button" onClick={() => move(-1)} className="rounded-lg px-2 py-1 text-lg hover:bg-hover" aria-label={t({ en: 'Previous month', es: 'Mes anterior' })}>
            ‹
          </button>
          <b className="min-w-[150px] text-center font-display text-lg first-letter:uppercase">{monthName}</b>
          <button type="button" onClick={() => move(1)} className="rounded-lg px-2 py-1 text-lg hover:bg-hover" aria-label={t({ en: 'Next month', es: 'Mes siguiente' })}>
            ›
          </button>
          <span className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const { given, unfilled } = store.autoAssign(month, from);
                say(
                  t({
                    en: `${given} turns given${unfilled.length ? `, ${unfilled.length} no one could cover` : ''}.`,
                    es: `Se asignaron ${given} turnos${unfilled.length ? `, ${unfilled.length} sin nadie que pueda` : ''}.`,
                  }),
                );
              }}
              className="rounded-lg bg-[var(--demo-accent)] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              ⚡ {t({ en: 'Give the rest automatically', es: 'Asignar lo que falta automáticamente' })}
            </button>
            <button
              type="button"
              onClick={() => {
                store.clearFrom(month, from);
                say(t({ en: 'The turns from today were let go.', es: 'Se liberaron los turnos desde hoy.' }));
              }}
              className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-hover"
            >
              {t({ en: 'Clear from today', es: 'Vaciar desde hoy' })}
            </button>
          </span>
        </header>
        {note && (
          <p role="status" className="m-0 animate-enter bg-pastel-green px-4 py-2 text-sm font-semibold text-pastel-green-fg">
            {note}
          </p>
        )}
        {type.resources.map(({ id: g, name }) => (
          <div key={g} className="border-t border-line first:border-t-0">
            <p className="m-0 flex items-center gap-2 px-4 py-2.5 font-display text-[15px] font-bold">
              <span className="size-2.5 rounded-full bg-[var(--demo-accent)]" />
              {name}
              <span className="ml-auto font-text text-xs font-normal text-muted">{t({ en: 'Dashed: nobody yet', es: 'Punteado: sin nadie' })}</span>
            </p>
            <div className="grid grid-cols-7 border-l border-t border-line text-sm">
              {['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-01'].map((d) => (
                <span key={d} className="border-b border-r border-line bg-surface py-1.5 text-center text-xs font-semibold uppercase text-muted">
                  {f.weekday(d)}
                </span>
              ))}
              {monthOf(month)
                .flat()
                .map((day, i) => {
                  // biome-ignore lint/suspicious/noArrayIndexKey: the empty places of the month, where they are.
                  if (!day) return <span key={i} className="border-b border-r border-line bg-surface/60" />;
                  const past = day < today;
                  return (
                    <div
                      key={day}
                      className={`flex min-h-[78px] min-w-0 flex-col gap-1 border-b border-r border-line p-1.5 ${day === today ? 'bg-brand-light/40' : past ? 'bg-surface/60 opacity-60' : ''}`}
                    >
                      <span className={`self-start rounded-full px-1.5 text-xs font-bold ${day === today ? 'bg-[var(--demo-accent)] text-white' : ''}`}>{f.dayNumber(day)}</span>
                      <div className="flex min-w-0 flex-col gap-1">
                        {turns
                          .filter((x) => x.day === day && x.group === g)
                          .map((turn) => {
                            const has = holder.get(`${turn.group}|${Date.parse(turn.start)}`);
                            return (
                              <label key={turn.start} className="flex min-w-0 items-center gap-1">
                                <span className="w-9 flex-none font-code text-[10px] text-muted">{f.time(turn.start).replace(/:00/, '')}</span>
                                <select
                                  disabled={past}
                                  value={has?.member ?? ''}
                                  onChange={(e) => store.assign(turn, e.target.value)}
                                  aria-label={`${groupName(g)} ${f.long(day)} ${f.time(turn.start)}`}
                                  className={`min-w-0 flex-1 truncate rounded-md border px-1 py-0.5 text-xs ${has ? 'border-transparent bg-hover font-semibold' : 'border-dashed border-[var(--demo-accent)] text-[var(--demo-accent)]'}`}
                                >
                                  <option value="">{t({ en: '— nobody', es: '— nadie' })}</option>
                                  {members
                                    .filter((m) => m.group === g)
                                    .map((m) => {
                                      const cannot = store.unavailable[m.id]?.includes(day);
                                      return (
                                        <option key={m.id} value={m.id} disabled={cannot}>
                                          {m.name.split(' ')[0]}
                                          {cannot ? t({ en: ' (cannot)', es: ' (no puede)' }) : ''}
                                        </option>
                                      );
                                    })}
                                </select>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </section>

      <aside className="flex flex-col gap-5">
        <section className="rounded-2xl border border-line bg-white p-4">
          <b className="text-sm">{t({ en: 'Turns this month', es: 'Turnos este mes' })}</b>
          {type.resources.map((r) => (
            <div key={r.id} className="mt-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted">{r.name}</p>
              {members
                .filter((m) => m.group === r.id)
                .map((m) => (
                  <div key={m.id} className="mt-1.5 flex items-center gap-2 text-sm">
                    <span className="w-24 truncate">{m.name.split(' ')[0]}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-hover">
                      <span className="block h-full rounded-full bg-[var(--demo-accent)]" style={{ width: `${(mine(m.id) / most) * 100}%` }} />
                    </span>
                    <span className="w-6 text-right font-code text-xs">{mine(m.id)}</span>
                  </div>
                ))}
            </div>
          ))}
        </section>
        <section className="rounded-2xl border border-line bg-white p-4">
          <b className="text-sm">{t({ en: 'Changes between agents', es: 'Cambios entre asesores' })}</b>
          {store.swaps.length === 0 && <p className="m-0 mt-2 text-sm text-muted">{t({ en: 'None asked.', es: 'Ninguno pedido.' })}</p>}
          <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
            {store.swaps.map((x) => (
              <li key={x.id} className="rounded-lg bg-surface px-3 py-2 text-sm">
                <b>{store.memberOf(x.by)?.name.split(' ')[0]}</b> → <b>{store.memberOf(x.with)?.name.split(' ')[0]}</b>{' '}
                <span className="text-muted">{x.to ? t({ en: 'swap', es: 'cambio' }) : t({ en: 'to cover', es: 'cubrir' })}</span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${x.status === 'pending' ? 'bg-pastel-yellow text-pastel-yellow-fg' : x.status === 'accepted' ? 'bg-pastel-green text-pastel-green-fg' : 'bg-pastel-pink text-pastel-pink-fg'}`}
                >
                  {t({ en: x.status, es: { pending: 'pendiente', accepted: 'aceptado', declined: 'rechazado' }[x.status] })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
