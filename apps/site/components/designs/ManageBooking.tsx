'use client';

// A booking's own page, as whoever booked it opens it from their message:
// when and what, what is left to pay there; moved by themselves to another
// time (or another first day of the same nights) while its kind lets them;
// cancelled, saying first what is given back. `useManage`, in a plain card.

import { formatMoney } from '@reboschedule/core';
import { useManage } from '@reboschedule/react';
import type { DemoStore } from '@/lib/demo';
import { type Locale, translator } from '@/lib/i18n';
import { formats } from './shared';

export function ManageBooking({ address, store, locale, onClose }: { address: string; store: DemoStore; locale: Locale; onClose: () => void }) {
  const t = translator(locale);
  const m = useManage({ address, fetch: store.fetch, timeZone: store.data.schedule.timeZone });
  const f = formats(locale, store.data.schedule.timeZone);
  const managed = m.managed;
  const b = managed?.booking;
  const what = b && (b.seats?.join(', ') || managed?.type.resources.find((r) => r.id === b.resource)?.name);
  const said = m.problems.map((p) => (p.code === 'failed' ? t({ en: 'It could not be done.', es: 'No se pudo.' }) : p.message)).join(' ');

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={t({ en: 'My booking', es: 'Mi reserva' })}>
      <div className="max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-2xl bg-white p-5 text-ink shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted">{t({ en: 'My booking', es: 'Mi reserva' })}</p>
          <button type="button" onClick={onClose} className="-mt-1 rounded-lg px-2 text-xl leading-none text-muted hover:bg-hover" aria-label={t({ en: 'Close', es: 'Cerrar' })}>
            ×
          </button>
        </div>
        {!managed || !b ? (
          <div className="mt-3 h-40 animate-pulse rounded-xl bg-surface" />
        ) : (
          <>
            <p className="m-0 mt-1 font-display text-xl font-bold">
              {managed.type.title}
              {what ? ` · ${what}` : ''}
            </p>
            <p className="m-0 mt-1 text-ink-soft first-letter:uppercase">{f.when(b.start)}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className={`rounded-full px-2.5 py-1 font-semibold ${b.status === 'cancelled' ? 'bg-pastel-pink text-pastel-pink-fg' : 'bg-pastel-green text-pastel-green-fg'}`}>
                {b.status === 'cancelled'
                  ? t({ en: 'Cancelled', es: 'Cancelada' })
                  : b.status === 'held'
                    ? t({ en: 'Held, to pay', es: 'Apartada, por pagar' })
                    : t({ en: 'Confirmed', es: 'Confirmada' })}
              </span>
              {b.price && <span className="rounded-full bg-surface px-2.5 py-1">{formatMoney(b.price, locale)}</span>}
              {b.discount && <span className="rounded-full bg-surface px-2.5 py-1">{b.discount.code}</span>}
              {b.due && b.status === 'confirmed' && (
                <span className="rounded-full bg-pastel-yellow px-2.5 py-1 text-pastel-yellow-fg">
                  {t({ en: 'Left to pay there: ', es: 'Por pagar allá: ' })}
                  {formatMoney(b.due, locale)}
                </span>
              )}
              {b.refunded && (
                <span className="rounded-full bg-surface px-2.5 py-1">
                  {t({ en: 'Given back: ', es: 'Devuelto: ' })}
                  {formatMoney(b.refunded, locale)}
                </span>
              )}
            </div>

            {m.choosing ? (
              <div className="mt-4">
                <p className="m-0 text-sm font-semibold">
                  {managed.type.stay ? t({ en: 'The new day you arrive', es: 'El nuevo día que llegas' }) : t({ en: 'The new time', es: 'El nuevo horario' })}
                </p>
                <div className="mt-2 flex max-h-[260px] flex-col gap-2 overflow-y-auto">
                  {managed.type.stay
                    ? m.arrivals.slice(0, 40).map((d) => (
                        <button
                          key={d}
                          type="button"
                          disabled={m.sending}
                          onClick={() => void m.move(d)}
                          className="rounded-lg border border-line px-3 py-2 text-left text-sm first-letter:uppercase hover:border-ink/40"
                        >
                          {f.long(d)}
                        </button>
                      ))
                    : [...m.times.entries()].slice(0, 7).map(([day, slots]) => (
                        <div key={day}>
                          <p className="m-0 text-xs font-semibold text-muted first-letter:uppercase">{f.long(day)}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {slots.map((s) => (
                              <button
                                key={s.start}
                                type="button"
                                disabled={m.sending}
                                onClick={() => void m.move(s.start)}
                                className="rounded-lg border border-line px-2.5 py-1 text-sm hover:border-ink/40"
                              >
                                {f.time(s.start)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  {(managed.type.stay ? !m.arrivals.length : !m.times.size) && <p className="m-0 text-sm text-muted">{t({ en: 'Looking for room…', es: 'Buscando lugar…' })}</p>}
                </div>
                <button type="button" onClick={() => m.choose(false)} className="mt-3 text-sm text-muted underline">
                  {t({ en: 'Keep it as it is', es: 'Dejarla como está' })}
                </button>
              </div>
            ) : (
              b.status !== 'cancelled' && (
                <div className="mt-5 flex flex-col gap-2">
                  {m.canMove ? (
                    <button type="button" onClick={() => m.choose(true)} className="rounded-lg bg-ink py-2.5 text-sm font-semibold text-white">
                      {t({ en: 'Change the date', es: 'Cambiar la fecha' })}
                    </button>
                  ) : (
                    managed.moveUntil === null && <p className="m-0 text-xs text-muted">{t({ en: 'This kind cannot be moved from here.', es: 'Esta reserva no se puede cambiar desde aquí.' })}</p>
                  )}
                  {managed.moveUntil && (
                    <p className="m-0 text-xs text-muted">
                      {m.canMove ? t({ en: 'You may change it until ', es: 'Puedes cambiarla hasta ' }) : t({ en: 'It could be changed until ', es: 'Se podía cambiar hasta ' })}
                      {f.when(managed.moveUntil)}.
                    </p>
                  )}
                  {m.canCancel && (
                    <button
                      type="button"
                      disabled={m.sending}
                      onClick={() => void m.cancel()}
                      className="rounded-lg border border-line py-2.5 text-sm font-semibold text-[#b42a2a] hover:bg-pastel-pink"
                    >
                      {t({ en: 'Cancel it', es: 'Cancelarla' })}
                      {managed.refund &&
                        (managed.refund.amount > 0
                          ? ` · ${t({ en: 'you get back ', es: 'se te devuelven ' })}${formatMoney(managed.refund, locale)}`
                          : ` · ${t({ en: 'no refund this close', es: 'sin reembolso a estas alturas' })}`)}
                    </button>
                  )}
                </div>
              )
            )}
            {said && <p className="m-0 mt-3 text-sm text-[#b42a2a]">{said}</p>}
          </>
        )}
      </div>
    </div>
  );
}
