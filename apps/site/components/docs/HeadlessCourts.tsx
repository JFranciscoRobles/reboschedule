'use client';

// A way of booking a court that is none of the package's: the courts as a
// row of pictures, the next days as tabs, the times as a strip with their
// price, and the booking in one line. Nothing of ReboSchedule's but its state,
// `useBooking`; the look is Tailwind's. Its code is the one the page shows.

import { formatMoney } from '@reboschedule/core';
import { type Booked, useBooking } from '@reboschedule/react';
import { useState } from 'react';

export function HeadlessCourts({ endpoint, fetch, locale }: { endpoint: string; fetch: typeof globalThis.fetch; locale: 'en' | 'es' }) {
  const b = useBooking({ endpoint, fetch });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const es = locale === 'es';
  const clock = (iso: string) => new Intl.DateTimeFormat(locale, { timeZone: b.timeZone, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  const dayName = (d: string) => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));

  if (b.status !== 'ready' || !b.type) return <div className="h-72 animate-pulse rounded-2xl bg-white/10" />;
  if (b.booked) return <Done booked={b.booked} again={b.again} es={es} clock={clock} />;

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-[#0f1a17] p-5 text-white">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="m-0 font-display text-xl font-extrabold">{b.type.title}</h3>
        <span className="text-sm text-white/60">{b.lengths.map((n) => `${n / 60} h`).join(' · ')}</span>
      </div>

      {/* The courts, as pictures; any free, first. */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[null, ...b.type.resources].map((r) => (
          <button
            key={r?.id ?? 'any'}
            type="button"
            onClick={() => b.setResource(r?.id ?? '')}
            className={`flex w-28 flex-none cursor-pointer flex-col gap-1.5 rounded-xl p-1.5 text-left text-xs font-semibold transition ${b.resource === (r?.id ?? '') ? 'bg-[#2dd4bf] text-[#0f1a17]' : 'bg-white/5 hover:bg-white/10'}`}
          >
            {r ? (
              // biome-ignore lint/performance/noImgElement: the court's own picture, as data.
              <img src={r.image} alt="" className="aspect-[240/132] w-full rounded-lg object-cover" />
            ) : (
              <span className="grid aspect-[240/132] w-full place-items-center rounded-lg bg-white/10 text-lg">✱</span>
            )}
            {r ? r.name : es ? 'Cualquiera' : 'Any'}
          </button>
        ))}
      </div>

      {/* How long, and the next days with times, as tabs. */}
      <div className="flex flex-wrap items-center gap-2">
        {b.lengths.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => b.setLength(n)}
            className={`cursor-pointer rounded-full px-3 py-1 text-sm font-semibold ${b.length === n ? 'bg-white text-[#0f1a17]' : 'bg-white/10'}`}
          >
            {n % 60 ? `${Math.floor(n / 60)} h ${n % 60}` : `${n / 60} h`}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-white/20" />
        {[...b.days.keys()].slice(0, 6).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => b.setDay(d)}
            className={`cursor-pointer rounded-lg px-2.5 py-1 text-sm font-semibold capitalize ${b.day === d ? 'bg-[#2dd4bf] text-[#0f1a17]' : 'text-white/70 hover:bg-white/10'}`}
          >
            {dayName(d)}
          </button>
        ))}
      </div>

      {/* The times of the day, as a strip, each with its price. */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {b.times.map((s) => (
          <button
            key={s.start}
            type="button"
            onClick={() => b.choose(s)}
            className={`flex flex-none cursor-pointer flex-col items-center rounded-xl border px-3.5 py-2 ${b.slot?.start === s.start ? 'border-[#2dd4bf] bg-[#2dd4bf]/15' : 'border-white/15 hover:border-white/40'}`}
          >
            <b>{clock(s.start)}</b>
            {s.price && <small className="text-[11px] text-white/60">{formatMoney(s.price, locale)}</small>}
          </button>
        ))}
      </div>

      {/* Who, in one line. */}
      {b.slot && (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await b.book({ name, email, answers: { phone } });
          }}
        >
          {[
            [name, setName, es ? 'Nombre' : 'Name', 'text'],
            [email, setEmail, es ? 'Correo' : 'Email', 'email'],
            [phone, setPhone, es ? 'Teléfono' : 'Phone', 'tel'],
          ].map(([value, set, label, kind]) => (
            <input
              key={label as string}
              required
              type={kind as string}
              placeholder={label as string}
              value={value as string}
              onChange={(e) => (set as (v: string) => void)(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
          ))}
          <button type="submit" disabled={b.sending} className="cursor-pointer rounded-lg bg-[#2dd4bf] px-4 py-2 text-sm font-bold text-[#0f1a17]">
            {b.sending ? '…' : `${es ? 'Reservar' : 'Book'}${b.slot.price ? ` · ${formatMoney(b.slot.price, locale)}` : ''}`}
          </button>
          {b.problems.length > 0 && <p className="m-0 w-full text-sm text-[#fca5a5]">{b.problems.map((p) => p.message).join(' ')}</p>}
        </form>
      )}
    </div>
  );
}

function Done({ booked, again, es, clock }: { booked: Booked; again: () => void; es: boolean; clock: (iso: string) => string }) {
  const court = booked.type.resources.find((r) => r.id === booked.booking.resource);
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#0f1a17] p-5 text-white">
      {/* biome-ignore lint/performance/noImgElement: the court's own picture, as data. */}
      {court && <img src={court.image} alt="" className="w-32 rounded-lg" />}
      <div className="min-w-0 flex-1">
        <p className="m-0 font-display text-lg font-extrabold">
          ✓ {court?.name} · {clock(booked.booking.start)}
        </p>
        <p className="m-0 mt-1 text-sm text-white/60">
          {booked.booking.name} · {booked.booking.email}
        </p>
      </div>
      <button type="button" onClick={again} className="cursor-pointer rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
        {es ? 'Reservar otra' : 'Book another'}
      </button>
    </div>
  );
}
