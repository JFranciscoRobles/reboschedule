'use client';

// An agent's appointments, as a house that sells homes would have them: cream
// and serif, the two kinds as large cards, the next days as a strip, the times
// in the parts of the day, and the appointment taking shape beside them, the
// agent's own card above it. Nothing of ReboSchedule's look: `useBooking`.

import type { EventType } from '@reboschedule/core';
import { useBooking } from '@reboschedule/react';
import { useState } from 'react';
import { type DesignProps, empty, endpointOf, Fields, type Filled, formats, told } from './shared';

const ICONS: Record<string, string> = { call: 'M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2', visit: 'M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6' };

export function Concierge({ store, locale, onBooked }: DesignProps) {
  const es = locale === 'es';
  const [kind, setKind] = useState(store.data.types[0].id);
  const type = store.data.types.find((t) => t.id === kind)!;
  return (
    <div className="overflow-hidden rounded-[28px] bg-[#f6f1e7] font-serif text-[#3b2a1f] shadow-[0_30px_60px_-30px_rgba(59,42,31,0.35)]">
      <div className="flex flex-wrap items-center gap-4 border-b border-[#e6dccb] px-7 py-5">
        <span className="grid size-14 place-items-center rounded-full bg-[#b4532a] font-sans text-xl font-bold text-white">LM</span>
        <div className="mr-auto">
          <p className="m-0 text-2xl leading-tight">Laura Méndez</p>
          <p className="m-0 font-sans text-sm text-[#8a7461]">{es ? 'Asesora inmobiliaria · Tijuana' : 'Real estate agent · Tijuana'}</p>
        </div>
        <span className="rounded-full border border-[#d8c9b2] px-3 py-1 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7461]">{es ? 'Agenda en línea' : 'Book online'}</span>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        {store.data.types.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setKind(t.id)}
            className={`flex cursor-pointer gap-4 rounded-2xl border p-5 text-left transition ${kind === t.id ? 'border-[#b4532a] bg-white shadow-[0_8px_24px_-12px_rgba(180,83,42,0.5)]' : 'border-[#e6dccb] hover:bg-white/60'}`}
          >
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              className="flex-none text-[#b4532a]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={ICONS[t.id] ?? ICONS.call} />
            </svg>
            <span>
              <span className="block text-xl">{t.title}</span>
              <span className="mt-1 block font-sans text-sm leading-relaxed text-[#8a7461]">{t.description}</span>
              <span className="mt-2 block font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[#b4532a]">{t.duration} min</span>
            </span>
          </button>
        ))}
      </div>
      <Times key={type.id} type={type} store={store} locale={locale} onBooked={onBooked} />
    </div>
  );
}

function Times({ type, store, locale, onBooked }: DesignProps & { type: EventType }) {
  const es = locale === 'es';
  const b = useBooking({ endpoint: endpointOf(type), fetch: store.fetch, onBooked: told(onBooked) });
  const [form, setForm] = useState<Filled>(empty);
  const f = formats(locale, b.timeZone);
  if (b.status !== 'ready' || !b.type) return <div className="mx-6 mb-6 h-56 animate-pulse rounded-2xl bg-[#efe6d6]" />;
  const t = b.type;

  if (b.booked)
    return (
      <div className="mx-6 mb-6 rounded-2xl bg-white p-8 text-center">
        <p className="m-0 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#b4532a]">{es ? 'Confirmada' : 'Confirmed'}</p>
        <p className="m-0 mt-3 text-3xl">{t.title}</p>
        <p className="m-0 mt-2 text-lg text-[#8a7461] first-letter:uppercase">{f.when(b.booked.booking.start)}</p>
        <button
          type="button"
          onClick={b.again}
          className="mt-6 cursor-pointer rounded-full border border-[#b4532a] px-5 py-2 font-sans text-sm font-semibold text-[#b4532a] hover:bg-[#b4532a] hover:text-white"
        >
          {es ? 'Agendar otra' : 'Book another'}
        </button>
      </div>
    );

  return (
    <div className="grid gap-6 px-6 pb-7 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[...b.days.keys()].slice(0, 10).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => b.setDay(d)}
              className={`flex w-[68px] flex-none cursor-pointer flex-col items-center rounded-2xl py-3 font-sans transition ${b.day === d ? 'bg-[#3b2a1f] text-[#f6f1e7]' : 'bg-white/70 hover:bg-white'}`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">{f.weekday(d)}</span>
              <span className="font-serif text-2xl">{f.dayNumber(d)}</span>
              <span className="text-[11px] capitalize opacity-70">{f.month(d)}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {b.parts.map((p) => (
            <div key={p.part}>
              <p className="m-0 mb-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7461]">
                {{ morning: es ? 'Mañana' : 'Morning', afternoon: es ? 'Tarde' : 'Afternoon', evening: es ? 'Noche' : 'Evening' }[p.part]}
              </p>
              <div className="flex flex-wrap gap-2">
                {p.times.map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    onClick={() => b.choose(s)}
                    className={`cursor-pointer rounded-full px-4 py-2 font-sans text-sm font-semibold transition ${b.slot?.start === s.start ? 'bg-[#b4532a] text-white' : 'bg-white text-[#3b2a1f] hover:ring-1 hover:ring-[#b4532a]'}`}
                  >
                    {f.time(s.start)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <form
        className="flex flex-col gap-3 self-start rounded-2xl bg-white p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await b.book(form)) setForm({ ...form, answers: {} });
        }}
      >
        <p className="m-0 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7461]">{es ? 'Tu cita' : 'Your appointment'}</p>
        <p className="m-0 text-xl">{t.title}</p>
        <p className="m-0 min-h-[1.5em] text-[#b4532a] first-letter:uppercase">{b.slot ? f.when(b.slot.start) : es ? 'Elige un horario' : 'Choose a time'}</p>
        <div className="flex flex-col gap-2 font-sans">
          <Fields type={t} value={form} onChange={setForm} locale={locale} input="w-full rounded-xl border border-[#e6dccb] bg-[#fbf8f2] px-3 py-2 text-sm outline-none focus:border-[#b4532a]" />
        </div>
        {b.problems.length > 0 && <p className="m-0 font-sans text-sm text-[#b42a2a]">{b.problems.map((p) => p.message).join(' ')}</p>}
        <button
          type="submit"
          disabled={!b.slot || b.sending}
          className="cursor-pointer rounded-full bg-[#3b2a1f] py-3 font-sans text-sm font-semibold text-[#f6f1e7] disabled:cursor-default disabled:opacity-40"
        >
          {b.sending ? '…' : es ? 'Confirmar cita' : 'Confirm'}
        </button>
      </form>
    </div>
  );
}
