'use client';

// The roster as an agent sees it: yellow and black, thick lines. Their own
// next turns, each with a way to ask a change of a colleague of their
// division: their turn for one of the other's, or theirs covered by them;
// the changes asked of them, to accept or decline; the days they cannot,
// marked on the month. Drawn on the engine's roster (`swapProblems`), and
// on what the demo keeps.

import { addDays, type Booking, clockAt, swapProblems } from '@reboschedule/core';
import { useState, useSyncExternalStore } from 'react';
import { type DesignProps, formats } from './shared';

export function RosterMember({ store, locale }: DesignProps) {
  const es = locale === 'es';
  useSyncExternalStore(
    store.subscribe,
    () => store.version,
    () => 0,
  );
  const members = store.members();
  const [me, setMe] = useState(members[0]?.id ?? '');
  const [asking, setAsking] = useState<string | null>(null);
  const tz = store.data.schedule.timeZone;
  const f = formats(locale, tz);
  const type = store.data.types[0];
  const today = clockAt(Date.now(), tz).day;
  const self = store.memberOf(me);
  if (!self) return null;
  const now = new Date().toISOString();
  const confirmed = store.bookings.filter((b) => b.status === 'confirmed');
  const upcoming = (id: string) => confirmed.filter((b) => b.member === id && b.end > now).sort((a, b) => a.start.localeCompare(b.start));
  const mine = upcoming(me);
  const dayOf = (b: Booking) => clockAt(Date.parse(b.start), tz).day;
  const turnText = (b: Booking) => `${f.weekday(dayOf(b))} ${f.dayNumber(dayOf(b))} · ${f.time(b.start)}–${f.time(b.end)}`;
  const colleagues = members.filter((m) => m.group === self.group && m.id !== me);
  const incoming = store.swaps.filter((x) => x.with === me && x.status === 'pending');
  const outgoing = store.swaps.filter((x) => x.by === me);
  const groupName = type.resources.find((r) => r.id === self.group)?.name;
  const card = 'border-4 border-black bg-white p-4';

  return (
    <div className="border-4 border-black bg-[#ffd400] p-5 font-display text-black shadow-[10px_10px_0_#000]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-4 border-black pb-4">
        <div>
          <p className="m-0 text-xs font-extrabold uppercase tracking-[0.25em]">{es ? 'Guardias' : 'Shifts'}</p>
          <p className="m-0 text-[clamp(28px,4.6vw,46px)] font-extrabold uppercase leading-none">{es ? 'Mi rol' : 'My roster'}</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-extrabold uppercase">
          {es ? 'Soy' : 'I am'}
          <select
            value={me}
            onChange={(e) => {
              setMe(e.target.value);
              setAsking(null);
            }}
            className="border-4 border-black bg-white px-2 py-1.5 font-text text-sm font-bold normal-case"
          >
            {type.resources.map((r) => (
              <optgroup key={r.id} label={r.name}>
                {members
                  .filter((m) => m.group === r.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {incoming.length > 0 && (
        <div className="mt-5 flex flex-col gap-3">
          {incoming.map((x) => {
            const theirs = store.bookings.find((b) => b.id === x.from);
            const asked = x.to ? store.bookings.find((b) => b.id === x.to) : null;
            return (
              <div key={x.id} className="flex flex-wrap items-center gap-3 border-4 border-black bg-black p-4 text-[#ffd400]">
                <span className="mr-auto text-sm font-bold">
                  {store.memberOf(x.by)?.name}{' '}
                  {asked
                    ? es
                      ? `te pide cambiar su ${theirs ? turnText(theirs) : ''} por tu ${turnText(asked)}`
                      : `asks to swap their ${theirs ? turnText(theirs) : ''} for your ${turnText(asked)}`
                    : es
                      ? `te pide que le cubras ${theirs ? turnText(theirs) : ''}`
                      : `asks you to cover ${theirs ? turnText(theirs) : ''}`}
                </span>
                <button type="button" onClick={() => store.answer(x.id, true)} className="cursor-pointer bg-[#ffd400] px-4 py-2 text-sm font-extrabold uppercase text-black">
                  {es ? 'Acepto' : 'Accept'}
                </button>
                <button type="button" onClick={() => store.answer(x.id, false)} className="cursor-pointer border-2 border-[#ffd400] px-4 py-1.5 text-sm font-extrabold uppercase">
                  {es ? 'No' : 'Decline'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className={card}>
          <p className="m-0 text-xs font-extrabold uppercase tracking-widest">
            {groupName} · {es ? 'mis próximas guardias' : 'my next turns'}
          </p>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {mine.slice(0, 8).map((b) => (
              <li key={b.id} className="border-2 border-black">
                <div className="flex flex-wrap items-center gap-3 px-3 py-2">
                  <span className="text-3xl font-extrabold leading-none">{f.dayNumber(dayOf(b))}</span>
                  <span className="mr-auto text-sm font-bold uppercase">
                    {f.weekday(dayOf(b))} · {f.time(b.start)}–{f.time(b.end)}
                  </span>
                  {outgoing.some((x) => x.from === b.id && x.status === 'pending') ? (
                    <span className="bg-black px-2 py-1 text-xs font-extrabold uppercase text-[#ffd400]">{es ? 'Cambio pedido' : 'Change asked'}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAsking(asking === b.id ? null : b.id)}
                      className="cursor-pointer border-2 border-black px-3 py-1 text-xs font-extrabold uppercase hover:bg-[#ffd400]"
                    >
                      {es ? 'Pedir cambio' : 'Ask a change'}
                    </button>
                  )}
                </div>
                {asking === b.id && (
                  <div className="border-t-2 border-black bg-[#fff6b8] px-3 py-3 font-text text-sm">
                    <p className="m-0 font-display text-xs font-extrabold uppercase">{es ? 'Que me cubra' : 'Covered by'}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {colleagues.map((c) => {
                        const no = swapProblems(b, null, self, c, store.unavailable, tz).length > 0 || confirmed.some((x) => x.member === c.id && dayOf(x) === dayOf(b));
                        return (
                          <button
                            key={c.id}
                            type="button"
                            disabled={no}
                            onClick={() => {
                              store.ask(b.id, null, me, c.id);
                              setAsking(null);
                            }}
                            className="cursor-pointer border-2 border-black bg-white px-2 py-1 font-bold disabled:cursor-default disabled:opacity-30"
                          >
                            {c.name.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                    <p className="m-0 mt-3 font-display text-xs font-extrabold uppercase">{es ? 'O cambiarla por' : 'Or swap it for'}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {colleagues
                        .flatMap((c) =>
                          upcoming(c.id)
                            .slice(0, 3)
                            .map((x) => ({ c, x })),
                        )
                        .filter(({ c, x }) => !swapProblems(b, x, self, c, store.unavailable, tz).length && dayOf(x) !== dayOf(b))
                        .sort((p, q) => p.x.start.localeCompare(q.x.start))
                        .slice(0, 6)
                        .map(({ c, x }) => (
                          <button
                            key={x.id}
                            type="button"
                            onClick={() => {
                              store.ask(b.id, x.id, me, c.id);
                              setAsking(null);
                            }}
                            className="cursor-pointer border-2 border-black bg-white px-2 py-1 font-bold"
                          >
                            {c.name.split(' ')[0]}: {turnText(x)}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-5">
          <section className={card}>
            <p className="m-0 text-xs font-extrabold uppercase tracking-widest">{es ? 'Días que no puedo' : 'Days I cannot'}</p>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {Array.from({ length: 21 }, (_, n) => addDays(today, n)).map((d) => {
                const off = store.unavailable[me]?.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={!!off}
                    title={f.long(d)}
                    onClick={() => store.setUnavailable(me, d, !off)}
                    className={`aspect-square cursor-pointer border-2 border-black text-xs font-extrabold ${off ? 'bg-black text-[#ffd400] line-through' : 'bg-white hover:bg-[#ffd400]'}`}
                  >
                    {f.dayNumber(d)}
                  </button>
                );
              })}
            </div>
            <p className="m-0 mt-2 font-text text-xs">{es ? 'Quien coordina no te asigna esos días.' : 'The coordinator will not give you those days.'}</p>
          </section>
          {outgoing.length > 0 && (
            <section className={card}>
              <p className="m-0 text-xs font-extrabold uppercase tracking-widest">{es ? 'Lo que pedí' : 'What I asked'}</p>
              <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 font-text text-sm">
                {outgoing.map((x) => (
                  <li key={x.id}>
                    {store.memberOf(x.with)?.name.split(' ')[0]} · <b>{es ? { pending: 'pendiente', accepted: 'aceptado', declined: 'rechazado' }[x.status] : x.status}</b>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
