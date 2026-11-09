'use client';

// Classes as a yoga studio has them: soft, rose and sage, the next classes
// as a list by day with the places left, a class taken once or every week
// for a month or two (the total said), and, booked, every date of it, those
// that were full struck out. Nothing of ReboSchedule's look: `useBooking`.

import { formatMoney } from '@reboschedule/core';
import { useBooking } from '@reboschedule/react';
import { useState } from 'react';
import { type DesignProps, empty, endpointOf, Fields, type Filled, formats, told } from './shared';

export function ClassStudio({ store, locale, onBooked }: DesignProps) {
  const es = locale === 'es';
  const b = useBooking({ endpoint: endpointOf(store.data.types[0]), fetch: store.fetch, onBooked: told(onBooked) });
  const [form, setForm] = useState<Filled>(empty);
  const [weeks, setWeeks] = useState(1);
  const f = formats(locale, b.timeZone);
  if (b.status !== 'ready' || !b.type) return <div className="h-[480px] animate-pulse rounded-[32px] bg-[#fbeff3]" />;
  const t = b.type;
  const capacity = t.capacity;
  const days = [...b.days.entries()].slice(0, 6);

  return (
    <div className="grid gap-6 rounded-[32px] bg-[#fbf3f5] p-6 text-[#4a2b3a] lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.25em] text-[#be185d]">{es ? 'Estudio Rebo' : 'Rebo Studio'}</p>
        <p className="m-0 mt-1 font-display text-3xl font-extrabold tracking-tight">{t.title}</p>
        <p className="m-0 mt-1 text-[#8a6a78]">{t.description}</p>
        <div className="mt-5 flex flex-col gap-4">
          {days.map(([day, slots]) => (
            <div key={day}>
              <p className="m-0 mb-2 text-sm font-semibold first-letter:uppercase text-[#8a6a78]">{f.long(day)}</p>
              <div className="flex flex-col gap-2">
                {slots.map((s) => {
                  const on = b.slot?.start === s.start;
                  const taken = capacity - s.free;
                  return (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => b.choose(s)}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl px-4 py-3 text-left transition ${on ? 'bg-[#be185d] text-white shadow-[0_10px_24px_-12px_rgba(190,24,93,0.7)]' : 'bg-white hover:bg-[#fff7f9]'}`}
                    >
                      <span className="w-16 font-display text-xl font-extrabold">{f.time(s.start)}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">{t.title}</span>
                        {/* The places, as dots: taken, and left. */}
                        <span className="mt-1.5 flex gap-1" role="img" aria-label={es ? `quedan ${s.free}` : `${s.free} left`}>
                          {Array.from({ length: capacity }, (_, i) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: the places of a class, alike.
                            <span key={i} className={`size-2 rounded-full ${i < taken ? (on ? 'bg-white/40' : 'bg-[#e7c9d4]') : on ? 'bg-white' : 'bg-[#7fae8f]'}`} />
                          ))}
                        </span>
                      </span>
                      <span className={`text-sm font-semibold ${on ? '' : 'text-[#5f8f6f]'}`}>{es ? `${s.free} libres` : `${s.free} left`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="self-start rounded-[24px] bg-white p-5">
        {b.booked ? (
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-[#5f8f6f]">{es ? 'Te esperamos' : 'See you there'}</p>
            <p className="m-0 mt-2 font-display text-xl font-extrabold">
              {b.booked.series && b.booked.series.length > 1 ? (es ? `${b.booked.series.length} clases` : `${b.booked.series.length} classes`) : t.title}
            </p>
            <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0 text-sm">
              {(b.booked.series ?? [b.booked.booking]).map((x) => (
                <li key={x.id} className="first-letter:uppercase">
                  ✓ {f.when(x.start)}
                </li>
              ))}
              {(b.booked.skipped ?? []).map((x) => (
                <li key={x} className="text-[#b07a90] line-through first-letter:uppercase">
                  {f.when(x)}
                </li>
              ))}
            </ul>
            {(b.booked.skipped ?? []).length > 0 && <p className="m-0 mt-2 text-xs text-[#8a6a78]">{es ? 'Las tachadas estaban llenas.' : 'Those struck out were full.'}</p>}
            <button type="button" onClick={b.again} className="mt-4 w-full cursor-pointer rounded-full bg-[#fbeff3] py-2.5 text-sm font-semibold text-[#be185d]">
              {es ? 'Tomar otra clase' : 'Take another'}
            </button>
          </div>
        ) : b.slot ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await b.book(form, weeks > 1 ? { repeat: { every: 1, count: weeks } } : {});
            }}
          >
            <p className="m-0 font-display text-lg font-extrabold first-letter:uppercase">{f.when(b.slot.start)}</p>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#fbf3f5] p-1.5">
              {[1, 4, t.series].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setWeeks(n)}
                  className={`cursor-pointer rounded-xl py-2 text-xs font-semibold ${weeks === n ? 'bg-white text-[#be185d] shadow-sm' : 'text-[#8a6a78]'}`}
                >
                  {n === 1 ? (es ? 'Una vez' : 'Once') : es ? `${n} semanas` : `${n} weeks`}
                </button>
              ))}
            </div>
            {t.price && (
              <p className="m-0 text-sm text-[#8a6a78]">
                {weeks > 1 ? (es ? `Cada ${f.weekday(b.day ?? '')}, ${weeks} veces: ` : `Every ${f.weekday(b.day ?? '')}, ${weeks} times: `) : ''}
                <b className="text-[#4a2b3a]">{formatMoney({ amount: t.price.amount * weeks, currency: t.price.currency }, locale)}</b>
              </p>
            )}
            <Fields type={t} value={form} onChange={setForm} locale={locale} input="rounded-xl border border-[#f0dde4] bg-[#fffafb] px-3 py-2 text-sm outline-none focus:border-[#be185d]" />
            {b.problems.length > 0 && <p className="m-0 text-sm text-[#b42a2a]">{b.problems.map((p) => p.message).join(' ')}</p>}
            <button type="submit" disabled={b.sending} className="cursor-pointer rounded-full bg-[#be185d] py-3 text-sm font-semibold text-white">
              {b.sending ? '…' : es ? 'Apartar mi lugar' : 'Save my place'}
            </button>
          </form>
        ) : (
          <div className="py-8 text-center text-[#8a6a78]">
            <p className="m-0 text-4xl">🧘</p>
            <p className="m-0 mt-2 text-sm">{es ? 'Elige una clase. Puedes tomarla cada semana.' : 'Choose a class. You can take it every week.'}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
