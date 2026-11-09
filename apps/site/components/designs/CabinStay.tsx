'use client';

// Cabins as a lodge in the woods has them: cream paper, a serif, forest
// green. The cabins first, each with its picture, how many it sleeps and
// what a night costs; then the month, the day one arrives and the day one
// leaves chosen on it, the nights between lit, those taken struck; and the
// stay, its nights and its total, booked. Nothing of ReboSchedule's look:
// `useStay`.

import { addDays, formatMoney, stayResource, unitsOf } from '@reboschedule/core';
import { useStay } from '@reboschedule/react';
import { useState } from 'react';
import { Checkout, said } from './Checkout';
import { ManageBooking } from './ManageBooking';
import { CouponField, type DesignProps, empty, endpointOf, Fields, type Filled, formats, told } from './shared';

export function CabinStay({ store, locale, onBooked }: DesignProps) {
  const es = locale === 'es';
  const type = store.data.types[0];
  const s = useStay({ endpoint: endpointOf(type), fetch: store.fetch, onBooked: told(onBooked) });
  const [form, setForm] = useState<Filled>(empty);
  const [managing, setManaging] = useState<string | null>(null);
  const f = formats(locale, store.data.schedule.timeZone);
  if (s.status !== 'ready' || !s.type) return <div className="h-[560px] animate-pulse rounded-[28px] bg-[#f3eee3]" />;
  const t = s.type;
  const stay = t.stay!;
  const money = (amount: number) => formatMoney({ amount, currency: t.price?.currency ?? 'MXN' }, locale);
  const nightOf = (r: (typeof t.resources)[number]) => r.price ?? t.price?.amount ?? 0;
  // A night is free for the cabin chosen, or for any when none is.
  const free = (day: string) => {
    const has = s.nights.get(day);
    return !!has && (s.resource ? has.includes(s.resource) : has.length > 0);
  };
  // The days one may leave on: a cabin (the one chosen, or any) has every night until then, no more than the most.
  const all = [...s.nights].map(([day, resources]) => ({ day, resources }));
  const canLeave = (day: string) => !!s.arrive && day > s.arrive && unitsOf(t, s.arrive, day) <= (stay.max ?? 365) && stayResource(t, all, s.arrive, day, s.resource || undefined) !== null;
  // The days one may arrive on: a cabin has the fewest nights from then.
  const canArrive = (day: string) => free(day) && stayResource(t, all, day, addDays(day, stay.min ?? 1), s.resource || undefined) !== null;
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${s.month}-15T12:00:00Z`));
  const cabin = t.resources.find((r) => r.id === s.fits);
  const short = s.units > 0 && s.units < (stay.min ?? 1);

  return (
    <div className="rounded-[28px] bg-[#f6f1e7] p-6 font-[Georgia,serif] text-[#2b2a22] sm:p-8">
      <Checkout held={s.held} check={s.check} release={s.release} store={store} locale={locale} />
      <p className="m-0 text-xs uppercase tracking-[0.3em] text-[#15803d]">{store.data.organizer.name}</p>
      <p className="m-0 mt-1 text-[clamp(26px,4vw,40px)] leading-tight">{t.title}</p>
      <p className="m-0 mt-1 text-[#6b6552]">{t.description}</p>

      {/* The cabins, one of them chosen or any. */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {t.resources.map((r) => {
          const on = s.resource === r.id;
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={on}
              onClick={() => s.setResource(on ? '' : r.id)}
              className={`cursor-pointer overflow-hidden rounded-2xl border-2 bg-white text-left transition ${on ? 'border-[#15803d] shadow-[0_12px_28px_-16px_rgba(21,128,61,0.8)]' : 'border-transparent hover:border-[#cfc5ad]'}`}
            >
              {/* biome-ignore lint/performance/noImgElement: the cabin's own picture, as data. */}
              <img src={r.image} alt="" className="block aspect-[240/132] w-full object-cover" />
              <span className="block px-3 py-2.5">
                <span className="block text-lg">{r.name}</span>
                <span className="block font-sans text-xs text-[#6b6552]">
                  {es ? `Para ${r.values.people}` : `Sleeps ${r.values.people}`}
                  {r.values.tub ? ' · jacuzzi' : ''}
                </span>
                <span className="mt-1 block font-sans text-sm font-semibold text-[#15803d]">
                  {money(nightOf(r))} <span className="font-normal text-[#6b6552]">/ {es ? 'noche' : 'night'}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => s.moveMonth(-1)} className="cursor-pointer rounded-full px-3 py-1 text-xl hover:bg-[#f3eee3]" aria-label={es ? 'Mes anterior' : 'Previous month'}>
              ‹
            </button>
            <b className="flex-1 text-center text-lg font-normal first-letter:uppercase">{monthName}</b>
            <button type="button" onClick={() => s.moveMonth(1)} className="cursor-pointer rounded-full px-3 py-1 text-xl hover:bg-[#f3eee3]" aria-label={es ? 'Mes siguiente' : 'Next month'}>
              ›
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 font-sans text-sm">
            {['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-01'].map((d) => (
              <span key={d} className="py-1 text-center text-[11px] uppercase tracking-wider text-[#a39b84]">
                {f.weekday(d)}
              </span>
            ))}
            {s.weeks.flat().map((day, i) => {
              // biome-ignore lint/suspicious/noArrayIndexKey: the empty places of the month, where they are.
              if (!day) return <span key={i} />;
              const open = free(day);
              const inside = s.within(day);
              const ends = day === s.arrive || day === s.leave;
              // The day one leaves need not be a free night: it is the morning after the last.
              const leaving = !!s.arrive && !s.leave && day > s.arrive;
              const can = ends || (leaving ? canLeave(day) : open && canArrive(day));
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!can}
                  onClick={() => s.pick(day)}
                  className={`aspect-square cursor-pointer rounded-xl text-[15px] transition disabled:cursor-default ${
                    ends
                      ? 'bg-[#15803d] font-bold text-white'
                      : inside
                        ? 'bg-[#dcefe1] text-[#14532d]'
                        : can
                          ? leaving
                            ? 'bg-[#f0f7f1] hover:bg-[#dcefe1]'
                            : 'hover:bg-[#f3eee3]'
                          : 'text-[#cfc5ad] line-through'
                  }`}
                >
                  {f.dayNumber(day)}
                </button>
              );
            })}
          </div>
          <p className="m-0 mt-3 font-sans text-xs text-[#6b6552]">
            {!s.arrive
              ? es
                ? 'Elige el día que llegas.'
                : 'Choose the day you arrive.'
              : !s.leave
                ? es
                  ? 'Ahora el día que te vas.'
                  : 'Now the day you leave.'
                : es
                  ? `Entrada ${stay.checkIn} · salida ${stay.checkOut}. Tachadas: noches ocupadas.`
                  : `In ${stay.checkIn} · out ${stay.checkOut}. Struck out: nights taken.`}
          </p>
        </section>

        <aside className="self-start rounded-2xl bg-[#14532d] p-5 font-sans text-[#f6f1e7]">
          {s.booked ? (
            <div>
              <p className="m-0 font-[Georgia,serif] text-2xl">{es ? '¡Te esperamos!' : 'See you there!'}</p>
              <p className="m-0 mt-2 text-sm first-letter:uppercase">{f.when(s.booked.booking.start)}</p>
              <p className="m-0 text-sm text-[#bbd7c3] first-letter:uppercase">
                {es ? 'hasta ' : 'until '}
                {f.when(s.booked.booking.end)}
              </p>
              <p className="m-0 mt-3 text-sm">
                {t.resources.find((r) => r.id === s.booked?.booking.resource)?.name}
                {s.booked.booking.price && ` · ${formatMoney(s.booked.booking.price, locale)}`}
              </p>
              {s.booked.booking.due && (
                <p className="m-0 mt-1 text-sm text-[#bbd7c3]">
                  {es ? 'Por pagar al llegar: ' : 'To pay when you arrive: '}
                  {formatMoney(s.booked.booking.due, locale)}
                </p>
              )}
              <button type="button" onClick={s.again} className="mt-4 w-full cursor-pointer rounded-full bg-[#f6f1e7] py-2.5 text-sm font-semibold text-[#14532d]">
                {es ? 'Reservar otra estancia' : 'Book another stay'}
              </button>
              <button type="button" onClick={() => setManaging(s.booked?.manage ?? null)} className="mt-2 w-full cursor-pointer rounded-full border border-[#f6f1e7]/40 py-2.5 text-sm font-semibold">
                {es ? 'Cambiar fechas o cancelar' : 'Change dates or cancel'}
              </button>
              {managing && <ManageBooking address={managing} store={store} locale={locale} onClose={() => setManaging(null)} />}
            </div>
          ) : s.arrive && s.leave ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await s.book(form);
              }}
            >
              <p className="m-0 font-[Georgia,serif] text-2xl">
                {s.units} {es ? (s.units === 1 ? 'noche' : 'noches') : s.units === 1 ? 'night' : 'nights'}
              </p>
              <p className="m-0 text-sm text-[#bbd7c3]">
                {f.dayNumber(s.arrive)} {f.month(s.arrive)} → {f.dayNumber(s.leave)} {f.month(s.leave)}
              </p>
              {short ? (
                <p className="m-0 rounded-xl bg-[#f6f1e7]/10 px-3 py-2 text-sm">{es ? `Son ${stay.min} noches como mínimo.` : `It is ${stay.min} nights at the least.`}</p>
              ) : cabin ? (
                <div className="rounded-xl bg-[#f6f1e7]/10 px-3 py-2 text-sm">
                  <p className="m-0">
                    {cabin.name} · {s.units} × {money(nightOf(cabin))}
                    {s.discount > 0 && ` − ${money(s.discount)}`} = <b className="text-base">{s.price && formatMoney(s.price, locale)}</b>
                  </p>
                  {t.deposit && s.price && (
                    <p className="m-0 mt-1 text-xs text-[#bbd7c3]">
                      {es ? `Hoy pagas el ${t.deposit}%: ` : `Today you pay ${t.deposit}%: `}
                      <b className="text-[#f6f1e7]">{money(Math.round(s.price.amount * t.deposit) / 100)}</b>
                      {es ? ' · el resto al llegar' : ' · the rest when you arrive'}
                    </p>
                  )}
                </div>
              ) : (
                <p className="m-0 rounded-xl bg-[#f6f1e7]/10 px-3 py-2 text-sm">
                  {s.resource
                    ? es
                      ? 'Esa cabaña no tiene todas esas noches.'
                      : 'That cabin is not free all those nights.'
                    : es
                      ? 'Ninguna cabaña tiene todas esas noches.'
                      : 'No cabin is free all those nights.'}
                </p>
              )}
              <Fields
                type={t}
                value={form}
                onChange={setForm}
                locale={locale}
                input="rounded-xl border-0 bg-[#f6f1e7] px-3 py-2.5 text-sm text-[#2b2a22] outline-none focus:ring-2 focus:ring-[#86efac]"
              />
              {s.coupons && (
                <CouponField
                  value={s.coupon}
                  onChange={s.setCoupon}
                  applied={s.applied}
                  off={s.discount}
                  locale={locale}
                  good="text-[#86efac]"
                  input="rounded-xl border-0 bg-[#f6f1e7] px-3 py-2.5 text-sm text-[#2b2a22] outline-none focus:ring-2 focus:ring-[#86efac]"
                />
              )}
              {s.problems.length > 0 && <p className="m-0 text-sm text-[#fecaca]">{said(s.problems, locale)}</p>}
              <button type="submit" disabled={s.sending || !cabin || short} className="cursor-pointer rounded-full bg-[#86efac] py-3 text-sm font-bold text-[#14532d] disabled:opacity-40">
                {s.sending ? '…' : es ? 'Reservar la estancia' : 'Book the stay'}
              </button>
            </form>
          ) : (
            <div className="py-6 text-center">
              <p className="m-0 text-4xl">🌲</p>
              <p className="m-0 mt-2 text-sm text-[#bbd7c3]">
                {es ? `De ${stay.min} a ${stay.max} noches. Elige una cabaña o deja que te toque la que esté libre.` : `${stay.min} to ${stay.max} nights. Choose a cabin, or take whichever is free.`}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
