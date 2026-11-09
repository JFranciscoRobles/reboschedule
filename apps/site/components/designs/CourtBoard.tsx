'use client';

// Courts as a club's board would have them: dark and lime, every court a
// column and every time a row, each free cell a court to take at that time,
// the length and the day above, the booking in a bar below. Nothing of
// ReboSchedule's look: `useBooking`, its times of any court, each saying
// which have a place.

import { formatMoney } from '@reboschedule/core';
import { useBooking } from '@reboschedule/react';
import { useState } from 'react';
import { type DesignProps, empty, endpointOf, Fields, type Filled, formats, told } from './shared';

export function CourtBoard({ store, locale, onBooked }: DesignProps) {
  const es = locale === 'es';
  const type0 = store.data.types[0];
  const b = useBooking({ endpoint: endpointOf(type0), fetch: store.fetch, onBooked: told(onBooked) });
  const [form, setForm] = useState<Filled>(empty);
  const f = formats(locale, b.timeZone);
  if (b.status !== 'ready' || !b.type) return <div className="h-[520px] animate-pulse rounded-3xl bg-[#0b1410]" />;
  const t = b.type;
  const chosen = b.slot?.resources?.length === 1 ? t.resources.find((r) => r.id === b.slot?.resources?.[0]) : undefined;
  const rate = (id: string) => (t.price ? formatMoney({ amount: t.resources.find((r) => r.id === id)?.price ?? t.price.amount, currency: t.price.currency }, locale) : '');

  return (
    <div className="overflow-hidden rounded-3xl bg-[#0b1410] font-display text-[#e8f5e0]">
      <div className="flex flex-wrap items-end gap-4 px-6 pb-4 pt-6">
        <div className="mr-auto">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.3em] text-[#c6f432]">Club Rebo · Padel</p>
          <p className="m-0 mt-1 text-3xl font-extrabold uppercase italic tracking-tight">{es ? 'Tablero de canchas' : 'Court board'}</p>
        </div>
        <div className="flex gap-1 rounded-full bg-white/5 p-1">
          {b.lengths.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => b.setLength(n)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-bold ${b.length === n ? 'bg-[#c6f432] text-[#0b1410]' : 'text-white/70 hover:text-white'}`}
            >
              {n % 60 ? `${Math.floor(n / 60)}:${n % 60}` : `${n / 60}:00`} h
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto px-6 pb-4">
        {[...b.days.keys()].slice(0, 9).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => b.setDay(d)}
            className={`flex-none cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-bold uppercase ${b.day === d ? 'border-[#c6f432] text-[#c6f432]' : 'border-white/10 text-white/60 hover:border-white/30'}`}
          >
            {f.weekday(d)} {f.dayNumber(d)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto px-6 pb-6">
        <table className="w-full min-w-[640px] border-separate border-spacing-1.5 text-sm">
          <thead>
            <tr>
              <th className="w-16" />
              {t.resources.map((r) => (
                <th key={r.id} className="pb-1 text-left align-bottom font-normal">
                  {/* biome-ignore lint/performance/noImgElement: the court's own picture, as data. */}
                  <img src={r.image} alt="" className="mb-1.5 w-full max-w-[120px] rounded-md opacity-90" />
                  <span className="block text-xs font-bold uppercase tracking-wider">{r.name}</span>
                  <span className="block text-[11px] text-[#c6f432]">{rate(r.id)} / h</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.times.map((s) => (
              <tr key={s.start}>
                <td className="pr-2 text-right font-code text-xs text-white/50">{f.time(s.start)}</td>
                {t.resources.map((r) => {
                  const free = s.resources?.includes(r.id);
                  const on = b.slot?.start === s.start && chosen?.id === r.id;
                  return (
                    <td key={r.id} className="p-0">
                      <button
                        type="button"
                        disabled={!free}
                        aria-label={`${r.name} ${f.time(s.start)}`}
                        onClick={() => b.choose({ ...s, resources: [r.id] })}
                        className={`h-9 w-full rounded-md text-xs font-bold uppercase transition ${
                          on
                            ? 'cursor-pointer bg-[#c6f432] text-[#0b1410]'
                            : free
                              ? 'cursor-pointer bg-[#163020] text-[#7fbf5a] hover:bg-[#1f4a2d] hover:text-[#c6f432]'
                              : 'bg-[repeating-linear-gradient(135deg,#ffffff0a_0_6px,transparent_6px_12px)] text-white/20'
                        }`}
                      >
                        {on ? '●' : free ? (es ? 'Libre' : 'Free') : '—'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {b.booked ? (
        <div className="flex flex-wrap items-center gap-4 border-t border-white/10 bg-[#c6f432] px-6 py-4 text-[#0b1410]">
          <span className="text-2xl font-extrabold uppercase italic">✓ {t.resources.find((r) => r.id === b.booked?.booking.resource)?.name}</span>
          <span className="mr-auto font-bold first-letter:uppercase">
            {f.when(b.booked.booking.start)}
            {b.booked.booking.price && ` · ${formatMoney(b.booked.booking.price, locale)}`}
          </span>
          <button type="button" onClick={b.again} className="cursor-pointer rounded-full bg-[#0b1410] px-4 py-2 text-sm font-bold text-[#c6f432]">
            {es ? 'Otra cancha' : 'Another court'}
          </button>
        </div>
      ) : (
        b.slot && (
          <form
            className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-white/5 px-6 py-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await b.book(form);
            }}
          >
            <span className="mr-2 font-extrabold uppercase italic text-[#c6f432]">
              {chosen?.name} · {f.time(b.slot.start)}
            </span>
            <Fields
              type={t}
              value={form}
              onChange={setForm}
              locale={locale}
              input="min-w-0 flex-1 rounded-md border border-white/15 bg-black/30 px-3 py-2 font-text text-sm text-white placeholder:text-white/40"
            />
            <button type="submit" disabled={b.sending} className="cursor-pointer rounded-md bg-[#c6f432] px-5 py-2 text-sm font-extrabold uppercase text-[#0b1410]">
              {b.sending ? '…' : es ? 'Apartar' : 'Book it'}
            </button>
            {b.problems.length > 0 && <p className="m-0 w-full text-sm text-[#ff8a7a]">{b.problems.map((p) => p.message).join(' ')}</p>}
          </form>
        )
      )}
    </div>
  );
}
