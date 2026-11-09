'use client';

// The provider's checkout, as the demos stand it in: the booking held, its
// total, the minutes left of its hold counted down; paid with a test card,
// the demo's `/paid` told as Stripe or Mercado Pago would tell the server,
// and the booking asked again (`check`); or let go. A provider's page, not
// the design's: the same plain card for all of them.

import { formatMoney } from '@reboschedule/core';
import type { HeldState } from '@reboschedule/react';
import { useEffect, useState } from 'react';
import type { DemoStore } from '@/lib/demo';
import type { Locale } from '@/lib/i18n';

export function Checkout({ held, check, release, store, locale }: HeldState & { store: DemoStore; locale: Locale }) {
  const es = locale === 'es';
  const [now, setNow] = useState(Date.now());
  const [paying, setPaying] = useState(false);
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);
  if (!held) return null;
  const left = Math.max(0, Date.parse(held.until) - now);
  const clock = `${Math.floor(left / 60_000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
  const what = held.booking.seats?.join(', ') ?? held.type.resources.find((r) => r.id === held.booking.resource)?.name;
  // What is paid now: the deposit, when the kind asks one; the rest, there.
  const price = held.booking.price;
  const charged = price ? { ...price, amount: Math.round((price.amount - (held.booking.due?.amount ?? 0)) * 100) / 100 } : null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 font-sans text-[#1f2937]" role="dialog" aria-modal="true" aria-label={es ? 'Pago' : 'Payment'}>
      <div className="w-full max-w-[380px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#f3f4f6] px-5 py-3 text-xs text-[#6b7280]">
          <span>{es ? 'Pago de prueba · como un checkout de Stripe o Mercado Pago' : 'Test payment · as a Stripe or Mercado Pago checkout'}</span>
        </div>
        <div className="p-5">
          <p className="m-0 text-sm text-[#6b7280]">{held.organizer.name}</p>
          <p className="m-0 mt-0.5 font-semibold">
            {held.type.title}
            {what ? ` · ${what}` : ''}
          </p>
          <p className="m-0 mt-3 text-3xl font-bold">{charged && formatMoney(charged, locale)}</p>
          {held.booking.due && price && (
            <p className="m-0 mt-1 text-sm text-[#6b7280]">
              {es ? 'Anticipo · total ' : 'Deposit · total '}
              {formatMoney(price, locale)} · {es ? 'el resto, ' : 'the rest, '}
              {formatMoney(held.booking.due, locale)}, {es ? 'al llegar' : 'when you arrive'}
            </p>
          )}
          {held.booking.discount && (
            <p className="m-0 mt-1 text-sm text-[#166534]">
              {held.booking.discount.code}: −{formatMoney({ amount: held.booking.discount.amount, currency: price?.currency ?? 'MXN' }, locale)}
            </p>
          )}
          <p className={`m-0 mt-3 rounded-lg px-3 py-2 text-sm ${left < 60_000 ? 'bg-[#fef2f2] text-[#b91c1c]' : 'bg-[#f0fdf4] text-[#166534]'}`}>
            {es ? 'Tu lugar está apartado. Se libera en ' : 'Your place is held. It is let go in '}
            <b className="font-mono">{clock}</b>
          </p>
          <label className="mt-4 block text-xs font-semibold text-[#6b7280]">
            {es ? 'Tarjeta de prueba' : 'Test card'}
            <input readOnly value="4242 4242 4242 4242 · 12/34 · 123" className="mt-1 block w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 font-mono text-sm text-[#374151]" />
          </label>
          <button
            type="button"
            disabled={paying || left === 0}
            onClick={async () => {
              setPaying(true);
              // As the provider would tell the server, at its `/paid`; then the booking, asked again.
              await store.fetch('demo:/s/paid', { method: 'POST', body: JSON.stringify({ booking: held.booking.id }) });
              await check();
              setPaying(false);
            }}
            className="mt-4 w-full cursor-pointer rounded-lg bg-[#111827] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {paying ? (es ? 'Pagando…' : 'Paying…') : `${es ? 'Pagar' : 'Pay'} ${charged ? formatMoney(charged, locale) : ''}`}
          </button>
          <button type="button" disabled={paying} onClick={() => void release()} className="mt-2 w-full cursor-pointer rounded-lg py-2 text-sm text-[#6b7280] hover:bg-[#f3f4f6]">
            {es ? 'Cancelar y liberar el lugar' : 'Cancel and let the place go'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The problems of a booking in words: a hold that ran out before it was paid, said too. */
export const said = (problems: { code: string; message: string }[], locale: Locale) =>
  problems.map((p) => (p.code === 'run-out' ? (locale === 'es' ? 'Se acabó el tiempo para pagar: el lugar se liberó.' : 'The time to pay ran out: the place was let go.') : p.message)).join(' ');
