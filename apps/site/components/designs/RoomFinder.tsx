'use client';

// Rooms as an office finds them: how many are coming first, then the rooms
// they fit in, then that room's day as a line of hours with its free
// stretches to take. Quiet and grey, violet where it matters, the numbers in
// mono. Nothing of ReboSchedule's look: `useBooking`.

import { clockAt, formatMoney } from '@reboschedule/core';
import { useBooking } from '@reboschedule/react';
import { useState } from 'react';
import { type DesignProps, empty, endpointOf, Fields, type Filled, formats, told } from './shared';

export function RoomFinder({ store, locale, onBooked }: DesignProps) {
  const es = locale === 'es';
  const b = useBooking({ endpoint: endpointOf(store.data.types[0]), fetch: store.fetch, onBooked: told(onBooked) });
  const [people, setPeople] = useState(4);
  const [form, setForm] = useState<Filled>(empty);
  const f = formats(locale, b.timeZone);
  if (b.status !== 'ready' || !b.type) return <div className="h-[460px] animate-pulse rounded-2xl bg-[#f4f4f6]" />;
  const t = b.type;
  const holds = (id: string) => Number(t.resources.find((r) => r.id === id)?.values.people ?? 0);
  const fit = t.resources.filter((r) => holds(r.id) >= people);
  const room = t.resources.find((r) => r.id === b.resource);
  // The line of the day: from the first time to the end of the last, each time a mark on it.
  const from = b.times.length ? clockAt(Date.parse(b.times[0].start), b.timeZone).minute : 0;
  const to = b.times.length ? clockAt(Date.parse(b.times[b.times.length - 1].end), b.timeZone).minute : 1;

  return (
    <div className="grid overflow-hidden rounded-2xl border border-[#e7e5ee] bg-white text-[#1d1b26] md:grid-cols-[280px_1fr]">
      <aside className="flex flex-col gap-4 border-b border-[#e7e5ee] bg-[#fafafc] p-5 md:border-b-0 md:border-r">
        <div>
          <p className="m-0 font-code text-[11px] uppercase tracking-[0.18em] text-[#8b88a0]">{es ? '¿Cuántos van?' : 'How many?'}</p>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" onClick={() => setPeople(Math.max(1, people - 1))} className="size-9 cursor-pointer rounded-lg border border-[#e0deea] text-lg hover:bg-white">
              −
            </button>
            <span className="w-12 text-center font-code text-3xl font-medium">{people}</span>
            <button type="button" onClick={() => setPeople(Math.min(20, people + 1))} className="size-9 cursor-pointer rounded-lg border border-[#e0deea] text-lg hover:bg-white">
              +
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="m-0 font-code text-[11px] uppercase tracking-[0.18em] text-[#8b88a0]">
            {fit.length} {es ? 'salas caben' : 'rooms fit'}
          </p>
          {t.resources.map((r) => {
            const fits = holds(r.id) >= people;
            return (
              <button
                key={r.id}
                type="button"
                disabled={!fits}
                onClick={() => b.setResource(r.id)}
                className={`flex items-center gap-3 rounded-xl p-2 text-left transition ${b.resource === r.id ? 'bg-[#6d28d9] text-white' : fits ? 'cursor-pointer hover:bg-white' : 'opacity-35'}`}
              >
                {/* biome-ignore lint/performance/noImgElement: the room's own picture, as data. */}
                <img src={r.image} alt="" className="w-16 rounded-md" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{r.name}</span>
                  <span className={`block font-code text-[11px] ${b.resource === r.id ? 'text-white/70' : 'text-[#8b88a0]'}`}>
                    {holds(r.id)} {es ? 'personas' : 'people'}
                    {r.values.screen ? (es ? ' · pantalla' : ' · screen') : ''}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-col gap-5 p-5">
        {!room ? (
          <div className="grid flex-1 place-items-center py-16 text-center text-[#8b88a0]">
            <p className="m-0 max-w-[260px]">{es ? 'Elige una sala para ver su día.' : 'Choose a room to see its day.'}</p>
          </div>
        ) : b.booked ? (
          <div className="grid flex-1 place-items-center py-12 text-center">
            <div>
              <p className="m-0 font-code text-[11px] uppercase tracking-[0.18em] text-[#6d28d9]">{es ? 'Reservada' : 'Booked'}</p>
              <p className="m-0 mt-2 text-2xl font-semibold">{room.name}</p>
              <p className="m-0 mt-1 text-[#5b5870] first-letter:uppercase">
                {f.when(b.booked.booking.start)} – {f.time(b.booked.booking.end)}
              </p>
              <button type="button" onClick={b.again} className="mt-5 cursor-pointer rounded-lg border border-[#e0deea] px-4 py-2 text-sm font-semibold hover:bg-[#fafafc]">
                {es ? 'Otra reserva' : 'Another'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-auto text-lg font-semibold">{room.name}</span>
              {b.lengths.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => b.setLength(n)}
                  className={`cursor-pointer rounded-md px-2.5 py-1 font-code text-xs ${b.length === n ? 'bg-[#1d1b26] text-white' : 'bg-[#f1f0f5] text-[#5b5870]'}`}
                >
                  {n}′
                </button>
              ))}
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {[...b.days.keys()].slice(0, 7).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => b.setDay(d)}
                  className={`flex-none cursor-pointer rounded-md px-3 py-1.5 text-sm capitalize ${b.day === d ? 'bg-[#ede9fe] font-semibold text-[#6d28d9]' : 'text-[#5b5870] hover:bg-[#f6f5f9]'}`}
                >
                  {f.weekday(d)} {f.dayNumber(d)}
                </button>
              ))}
            </div>
            {/* The day as a line: each free start, a stretch to take, where it falls. */}
            <div>
              <div className="relative h-16 rounded-xl bg-[repeating-linear-gradient(90deg,#f1f0f5_0_1px,transparent_1px_calc(100%/12))]">
                {b.times.map((s) => {
                  const at = clockAt(Date.parse(s.start), b.timeZone).minute;
                  const on = b.slot?.start === s.start;
                  return (
                    <button
                      key={s.start}
                      type="button"
                      title={f.time(s.start)}
                      onClick={() => b.choose(s)}
                      className={`absolute top-2 bottom-2 cursor-pointer rounded-md transition ${on ? 'z-10 bg-[#6d28d9] ring-4 ring-[#ede9fe]' : 'bg-[#c4b5fd] hover:bg-[#8b5cf6]'}`}
                      style={{ left: `${((at - from) / (to - from)) * 100}%`, width: `calc(${((t.increment || t.duration) / (to - from)) * 100}% - 3px)` }}
                    />
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between font-code text-[11px] text-[#8b88a0]">
                <span>{b.times[0] && f.time(b.times[0].start)}</span>
                <span>{b.times.at(-1) && f.time(b.times.at(-1)!.end)}</span>
              </div>
            </div>
            {b.slot && (
              <form
                className="grid gap-2 rounded-xl border border-[#e7e5ee] p-4 sm:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await b.book(form);
                }}
              >
                <p className="m-0 font-semibold sm:col-span-2 first-letter:uppercase">
                  {f.when(b.slot.start)} – {f.time(b.slot.end)}
                  {b.slot.price && <span className="ml-2 font-code text-sm text-[#6d28d9]">{formatMoney(b.slot.price, locale)}</span>}
                </p>
                <Fields type={t} value={form} onChange={setForm} locale={locale} input="rounded-lg border border-[#e0deea] px-3 py-2 text-sm outline-none focus:border-[#6d28d9]" />
                {b.problems.length > 0 && <p className="m-0 text-sm text-[#b42a2a] sm:col-span-2">{b.problems.map((p) => p.message).join(' ')}</p>}
                <button type="submit" disabled={b.sending} className="cursor-pointer rounded-lg bg-[#6d28d9] py-2.5 text-sm font-semibold text-white sm:col-span-2">
                  {b.sending ? '…' : es ? 'Reservar sala' : 'Book the room'}
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}
