// What the hero shows: both sides of a booking, drawn in CSS alone. On the
// left, the widget of whoever plays: the courts with their pictures and
// prices, the lengths, the times of a day, one of them being chosen; on the
// right, the club's day, a column for each court, where that booking comes in
// as a block of its own, and the word that it was booked.

import { courtPicture } from '@reboschedule/core';
import type { CSSProperties } from 'react';
import { type Locale, translator } from '@/lib/i18n';

const island = 'rounded-[14px] border border-[#e6e3dc] bg-[#fbfaf8]';

/** The club's day as it is before: each court's bookings, from 16:00, a row each half hour. */
const DAY: { court: number; from: number; rows: number; name: string }[] = [
  { court: 0, from: 0, rows: 3, name: 'Iván Cruz' },
  { court: 0, from: 4, rows: 3, name: 'Elena Paz' },
  { court: 1, from: 1, rows: 4, name: 'Beto Ruiz' },
  { court: 2, from: 0, rows: 2, name: 'Carla Gómez' },
  { court: 2, from: 3, rows: 3, name: 'Julia Vega' },
  { court: 3, from: 0, rows: 3, name: 'Diego Soto' },
];
const HOURS = ['16:00', '', '17:00', '', '18:00', '', '19:00', '', '20:00'];

export function HeroPreview({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const courts = [1, 2, 3, 4].map((n) => ({ n, image: courtPicture({ covered: n > 3, color: n === 3 ? '#2f7d5b' : '#3f6aa0' }) }));
  return (
    <div className="relative mx-auto mt-16 max-w-[1040px] text-left" aria-hidden="true">
      <div className="grid gap-2.5 overflow-hidden rounded-[22px] border border-border bg-[#efede8] p-2.5 shadow-editor md:grid-cols-[1fr_1.15fr]">
        {/* Whoever plays. */}
        <div className={`${island} flex flex-col gap-3 p-4`}>
          <div>
            <p className="text-xs font-semibold text-muted">Club Rebo</p>
            <p className="font-display text-lg font-extrabold tracking-[-0.02em]">{t({ en: 'Padel court', es: 'Cancha de pádel' })}</p>
            <p className="mt-0.5 text-xs font-semibold text-ink-soft">⏱ 1 h · 1 h 30 · 2 h · {t({ en: 'From', es: 'Desde' })} $350 MXN / h</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {courts.map((c) => (
              <span key={c.n} className={`rounded-lg border p-1 ${c.n === 4 ? 'border-brand bg-brand-light' : 'border-[#e6e3dc] bg-white'}`}>
                {/* biome-ignore lint/performance/noImgElement: a picture made as data, not a file. */}
                <img src={c.image} alt="" className="w-full rounded-[5px]" />
                <span className={`mt-1 block text-[10.5px] font-bold ${c.n === 4 ? 'text-brand' : 'text-ink'}`}>
                  {t({ en: 'Court', es: 'Cancha' })} {c.n}
                </span>
                <span className="block text-[9.5px] font-semibold text-pastel-green-fg">${c.n > 3 ? 450 : 350} / h</span>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            {['1 h', '1 h 30', '2 h'].map((l) => (
              <span key={l} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${l === '2 h' ? 'border-brand bg-brand text-white' : 'border-[#dddad3] bg-white text-ink-soft'}`}>
                {l}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the days of the week, in their order.
                <span key={i} className="text-faint">
                  {d}
                </span>
              ))}
              {Array.from({ length: 21 }, (_, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: the days of the month, in their order.
                  key={i}
                  className={`grid aspect-square place-items-center rounded-full ${i === 2 ? 'bg-brand text-white' : i > 0 && i % 7 !== 6 ? 'bg-brand-light text-brand' : 'text-faint'}`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{t({ en: 'Evening', es: 'Noche' })}</span>
              {[
                ['18:00', '$1,100'],
                ['18:30', '$1,100'],
                ['19:00', '$1,100'],
              ].map(([time, price], i) => (
                <span
                  key={time}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border-2 border-brand py-1 text-[12px] font-bold text-brand ${i === 1 ? 'animate-chosen' : 'bg-white'}`}
                >
                  {time} <small className="text-[9.5px] font-semibold opacity-80">{price}</small>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* The club. */}
        <div className={`${island} relative flex flex-col gap-2 p-3`}>
          <div className="flex items-center justify-between px-1">
            <span className="font-display text-[15px] font-extrabold">{t({ en: 'Tuesday, November 3', es: 'Martes, 3 de noviembre' })}</span>
            <span className="rounded-md bg-pastel-blue px-2 py-0.5 text-[10.5px] font-bold text-pastel-blue-fg">{t({ en: '6 gaps free', es: '6 huecos libres' })}</span>
          </div>
          <div
            className="grid overflow-hidden rounded-xl border border-[#e6e3dc] bg-white"
            style={{ gridTemplateColumns: '40px repeat(4, minmax(0, 1fr))', gridTemplateRows: `26px repeat(${HOURS.length}, 22px)` } as CSSProperties}
          >
            <span />
            {courts.map((c, i) => (
              <span key={c.n} className="flex items-center gap-1 border-b border-l border-[#eeece7] px-1.5 text-[10px] font-bold" style={{ gridColumn: i + 2, gridRow: 1 }}>
                {/* biome-ignore lint/performance/noImgElement: a picture made as data, not a file. */}
                <img src={c.image} alt="" className="h-3.5 rounded-[3px]" />
                {t({ en: 'Court', es: 'Cancha' })} {c.n}
              </span>
            ))}
            {HOURS.map((h, r) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: the rows of the day, in their order.
                key={r}
                className="border-t border-[#f3f1ec] pr-1.5 pt-0.5 text-right text-[9px] font-semibold text-muted"
                style={{ gridColumn: 1, gridRow: r + 2 }}
              >
                {h}
              </span>
            ))}
            {DAY.map((b) => (
              <span
                key={`${b.court}${b.from}`}
                className="m-[2px] flex flex-col overflow-hidden rounded-md border-l-[3px] border-[#15803d] bg-[#dcebe0] px-1.5 py-0.5 text-[9.5px] font-bold"
                style={{ gridColumn: b.court + 2, gridRow: `${b.from + 2} / span ${b.rows}` }}
              >
                {b.name}
              </span>
            ))}
            {/* The booking just made, coming in. */}
            <span
              className="m-[2px] flex animate-pop-in flex-col overflow-hidden rounded-md border-l-[3px] border-brand bg-brand-light px-1.5 py-0.5 text-[9.5px] font-bold text-ink opacity-0 outline-2 outline-brand"
              style={{ gridColumn: 5, gridRow: '7 / span 4', animationDelay: '2.4s' }}
            >
              Ana López
              <small className="font-semibold text-ink-soft">18:30 – 20:30 · $1,100</small>
            </span>
          </div>
          <span
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 animate-pop-in items-center gap-2 whitespace-nowrap rounded-xl bg-ink px-3.5 py-2 text-[12px] font-semibold text-white opacity-0 shadow-menu"
            style={{ animationDelay: '3s' }}
          >
            <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-[#22c55e] text-[10px]">✓</span>
            {t({ en: 'Ana booked Court 4', es: 'Ana reservó la Cancha 4' })}
          </span>
        </div>
      </div>
    </div>
  );
}
