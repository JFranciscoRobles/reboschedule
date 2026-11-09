'use client';

// A barbershop as its own page would have it: black and brass, a slab
// serif. The service first, then the barber (each with the days he comes)
// or the first free, the next days in a strip, the times of the day, each
// saying who when none was chosen; and the cut booked. Each service is its
// own kind, the barbers shared by all of them. Nothing of ReboSchedule's
// look: `useBooking`.

import { formatMoney } from '@reboschedule/core';
import { useBooking } from '@reboschedule/react';
import { useState } from 'react';
import { ManageBooking } from './ManageBooking';
import { CouponField, type DesignProps, empty, endpointOf, Fields, type Filled, formats, told } from './shared';

const BRASS = '#c9a24a';

export function BarberShop(props: DesignProps) {
  const es = props.locale === 'es';
  const { types } = props.store.data;
  const [service, setService] = useState(types[0].id);
  return (
    <div className="rounded-[6px] border-[3px] border-[#c9a24a] bg-[#111] p-5 font-[Rockwell,'Roboto_Slab',Georgia,serif] text-[#f1e9d8] sm:p-7">
      <div className="flex flex-wrap items-end gap-3 border-b border-[#c9a24a]/40 pb-4">
        <div className="mr-auto">
          <p className="m-0 text-[11px] uppercase tracking-[0.4em]" style={{ color: BRASS }}>
            {es ? 'Desde 2026 · cita previa' : 'Since 2026 · by appointment'}
          </p>
          <p className="m-0 text-[clamp(28px,4.4vw,44px)] font-bold uppercase leading-none tracking-wide">{props.store.data.organizer.name}</p>
        </div>
        <span className="text-3xl" aria-hidden="true">
          💈
        </span>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {types.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={service === t.id}
            onClick={() => setService(t.id)}
            className="flex cursor-pointer items-baseline gap-2 border border-[#c9a24a]/40 px-4 py-3 text-left transition hover:border-[#c9a24a] aria-pressed:border-[#c9a24a] aria-pressed:bg-[#c9a24a] aria-pressed:text-[#111]"
          >
            <span className="mr-auto text-lg font-bold uppercase">{t.title}</span>
            <span className="font-sans text-xs opacity-70">{t.duration} min</span>
            <span className="font-sans text-sm font-bold">{t.price && formatMoney(t.price, props.locale)}</span>
          </button>
        ))}
      </div>
      <Service key={service} {...props} id={service} />
    </div>
  );
}

function Service({ store, locale, onBooked, id }: DesignProps & { id: string }) {
  const es = locale === 'es';
  const type = store.data.types.find((x) => x.id === id)!;
  const b = useBooking({ endpoint: endpointOf(type), fetch: store.fetch, onBooked: told(onBooked) });
  const [form, setForm] = useState<Filled>(empty);
  const [managing, setManaging] = useState<string | null>(null);
  const f = formats(locale, b.timeZone);
  if (b.status !== 'ready' || !b.type) return <div className="mt-5 h-[360px] animate-pulse bg-[#1b1b1b]" />;
  const t = b.type;
  const nameOf = (rid?: string) => t.resources.find((r) => r.id === rid)?.name ?? '';
  // The days a barber comes, said short, from his own hours: the days in a row as a stretch (`mar–sáb`), those apart each alone (`lun, mié, vie`).
  const comes = (r: (typeof t.resources)[number]) => {
    const week = [1, 2, 3, 4, 5, 6, 0];
    const works = week.map((d) => (r.hours?.[d as 0] ?? []).length > 0);
    const day = (d: number) => f.weekday(`2026-11-0${d === 0 ? 1 : d + 1}`);
    const stretches: number[][] = [];
    works.forEach((on, i) => {
      if (!on) return;
      const last = stretches[stretches.length - 1];
      if (last && last[last.length - 1] === i - 1) last.push(i);
      else stretches.push([i]);
    });
    // Sunday after Saturday, and Monday after Sunday: the week goes round.
    if (stretches.length > 1 && stretches[0][0] === 0 && stretches[stretches.length - 1].at(-1) === 6) stretches[0] = [...stretches.pop()!, ...stretches[0]];
    const said = stretches.map((s) => (s.length > 2 ? `${day(week[s[0]])}–${day(week[s[s.length - 1]])}` : s.map((i) => day(week[i])).join(', '))).join(', ');
    const h = r.hours?.[week[stretches[0]?.[0] ?? 0] as 0]?.[0];
    return `${said} · ${h?.from.replace(':00', '')}–${h?.to.replace(':00', '')}`;
  };
  const days = [...b.days.keys()].slice(0, 10);

  if (b.booked)
    return (
      <div className="mt-6 border border-[#c9a24a] p-6 text-center">
        <p className="m-0 text-xs uppercase tracking-[0.4em]" style={{ color: BRASS }}>
          {es ? 'Cita confirmada' : 'Booked'}
        </p>
        <p className="m-0 mt-2 text-2xl font-bold uppercase">
          {t.title} · {nameOf(b.booked.booking.resource)}
        </p>
        <p className="m-0 mt-1 font-sans text-[#bdb3a0] first-letter:uppercase">{f.when(b.booked.booking.start)}</p>
        {b.booked.booking.price && <p className="m-0 mt-1 font-sans text-sm">{formatMoney(b.booked.booking.price, locale)}</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={b.again} className="cursor-pointer border border-[#c9a24a] px-5 py-2 font-sans text-sm font-bold uppercase" style={{ color: BRASS }}>
            {es ? 'Otra cita' : 'Book another'}
          </button>
          <button type="button" onClick={() => setManaging(b.booked?.manage ?? null)} className="cursor-pointer border border-[#333] px-5 py-2 font-sans text-sm font-bold uppercase">
            {es ? 'Cambiar o cancelar' : 'Change or cancel'}
          </button>
        </div>
        {managing && <ManageBooking address={managing} store={store} locale={locale} onClose={() => setManaging(null)} />}
      </div>
    );

  return (
    <div className="mt-6">
      <p className="m-0 mb-2 text-xs uppercase tracking-[0.3em]" style={{ color: BRASS }}>
        {es ? 'Con quién' : 'With whom'}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[{ id: '', name: es ? 'El primero libre' : 'First free', image: '' }, ...t.resources].map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={b.resource === r.id}
            onClick={() => b.setResource(r.id)}
            className="flex cursor-pointer items-center gap-3 border border-[#333] bg-[#1a1a1a] p-2 text-left transition hover:border-[#c9a24a]/60 aria-pressed:border-[#c9a24a]"
          >
            {r.image ? (
              // biome-ignore lint/performance/noImgElement: the barber's own picture, as data.
              <img src={r.image} alt="" className="size-11 flex-none rounded-full object-cover" />
            ) : (
              <span className="grid size-11 flex-none place-items-center rounded-full border border-dashed border-[#c9a24a]/60 text-lg">✂</span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-bold uppercase">{r.name}</span>
              {'hours' in r && <span className="block truncate font-sans text-[11px] text-[#9a917f]">{comes(r)}</span>}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={b.day === d}
            onClick={() => b.setDay(d)}
            className="min-w-[64px] flex-none cursor-pointer border border-[#333] py-2 text-center transition aria-pressed:border-[#c9a24a] aria-pressed:bg-[#c9a24a] aria-pressed:text-[#111]"
          >
            <span className="block font-sans text-[11px] uppercase opacity-70">{f.weekday(d)}</span>
            <span className="block text-2xl font-bold">{f.dayNumber(d)}</span>
          </button>
        ))}
        {days.length === 0 && <p className="m-0 font-sans text-sm text-[#9a917f]">{es ? 'No hay horarios en los próximos días.' : 'No times in the next days.'}</p>}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="grid grid-cols-3 content-start gap-1.5 sm:grid-cols-5">
          {b.times.map((s) => {
            const on = b.slot?.start === s.start;
            return (
              <button
                key={s.start}
                type="button"
                onClick={() => b.choose(s)}
                className={`cursor-pointer border px-1 py-2 text-center font-sans transition ${on ? 'border-[#c9a24a] bg-[#c9a24a] text-[#111]' : 'border-[#333] hover:border-[#c9a24a]/60'}`}
              >
                <span className="block text-sm font-bold">{f.time(s.start)}</span>
                {!b.resource && <span className="block truncate text-[10px] opacity-70">{(s.resources ?? []).map(nameOf).join(' · ')}</span>}
              </button>
            );
          })}
        </div>
        <aside className="self-start border border-[#c9a24a]/50 p-4">
          {b.slot ? (
            <form
              className="flex flex-col gap-2.5"
              onSubmit={async (e) => {
                e.preventDefault();
                await b.book(form);
              }}
            >
              <p className="m-0 text-lg font-bold uppercase first-letter:uppercase">{f.when(b.slot.start)}</p>
              <p className="m-0 font-sans text-sm text-[#bdb3a0]">
                {t.title} · {es ? 'con' : 'with'} {nameOf(b.resource || b.slot.resources?.[0])} ·{' '}
                {t.price && formatMoney({ ...t.price, amount: t.price.amount - b.discountFor([t.price.amount], b.slot.start) }, locale)}
              </p>
              <Fields type={t} value={form} onChange={setForm} locale={locale} input="border border-[#333] bg-[#1a1a1a] px-3 py-2 font-sans text-sm outline-none focus:border-[#c9a24a]" />
              {b.coupons && (
                <CouponField
                  value={b.coupon}
                  onChange={b.setCoupon}
                  applied={b.applied}
                  off={t.price ? b.discountFor([t.price.amount], b.slot.start) : 0}
                  locale={locale}
                  good="text-[#c9a24a]"
                  input="border border-[#333] bg-[#1a1a1a] px-3 py-2 font-sans text-sm outline-none focus:border-[#c9a24a]"
                />
              )}
              {b.problems.length > 0 && <p className="m-0 font-sans text-sm text-[#fca5a5]">{b.problems.map((p) => p.message).join(' ')}</p>}
              <button type="submit" disabled={b.sending} className="cursor-pointer py-3 font-sans text-sm font-bold uppercase tracking-wider text-[#111]" style={{ background: BRASS }}>
                {b.sending ? '…' : es ? 'Apartar' : 'Book it'}
              </button>
            </form>
          ) : (
            <p className="m-0 py-6 text-center font-sans text-sm text-[#9a917f]">
              {es ? 'Cada barbero viene sus días: elige uno, o el primero libre.' : 'Each barber comes his own days: choose one, or the first free.'}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
