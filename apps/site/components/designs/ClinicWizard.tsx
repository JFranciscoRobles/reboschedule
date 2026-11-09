'use client';

// A clinic's booking as a patient walks it: four steps, one at a time, the
// step's number lit; the reason first, then the day, the hour, the details;
// clean and blue, as a medical page is. The doctor's own calendar is not
// seen here, only what is left free of it. Nothing of ReboSchedule's look:
// `useBooking`.

import { formatMoney } from '@reboschedule/core';
import { useBooking } from '@reboschedule/react';
import { useState } from 'react';
import { type DesignProps, empty, endpointOf, type Filled, formats, told } from './shared';

export function ClinicWizard({ store, locale, onBooked }: DesignProps) {
  const es = locale === 'es';
  const b = useBooking({ endpoint: endpointOf(store.data.types[0]), fetch: store.fetch, onBooked: told(onBooked) });
  const [form, setForm] = useState<Filled>(empty);
  const [step, setStep] = useState(0);
  const f = formats(locale, b.timeZone);
  if (b.status !== 'ready' || !b.type) return <div className="h-[460px] animate-pulse rounded-2xl bg-[#f0f7fc]" />;
  const t = b.type;
  const reasons = es ? ['Revisión', 'Limpieza', 'Dolor o molestia', 'Ortodoncia', 'Otro'] : ['Check-up', 'Cleaning', 'Pain', 'Braces', 'Other'];
  const steps = es ? ['Motivo', 'Día', 'Hora', 'Tus datos'] : ['Reason', 'Day', 'Time', 'Your details'];
  const input = 'w-full rounded-lg border border-[#cfe1ee] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0369a1] focus:ring-2 focus:ring-[#0369a1]/15';

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d8e8f3] bg-white text-[#0c2a3e]">
      <div className="flex flex-wrap items-center gap-4 bg-[#0369a1] px-6 py-4 text-white">
        <span className="grid size-11 place-items-center rounded-full bg-white/15 text-lg">🦷</span>
        <div className="mr-auto">
          <p className="m-0 font-semibold">{store.data.organizer.name}</p>
          <p className="m-0 text-sm text-white/75">{es ? 'Odontología general · Cédula 1234567' : 'General dentistry · License 1234567'}</p>
        </div>
        {t.price && <span className="rounded-full bg-white/15 px-3 py-1 text-sm">{formatMoney(t.price, locale)}</span>}
      </div>

      {/* The steps, the one at lit. */}
      <ol className="m-0 flex list-none gap-1 border-b border-[#e6f0f7] px-6 py-3 text-sm">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`grid size-6 place-items-center rounded-full text-xs font-bold ${i < step ? 'bg-[#0369a1] text-white' : i === step ? 'border-2 border-[#0369a1] text-[#0369a1]' : 'bg-[#eef4f8] text-[#7a93a5]'}`}
            >
              {i < step ? '✓' : i + 1}
            </span>
            <span className={`hidden sm:inline ${i === step ? 'font-semibold' : 'text-[#7a93a5]'}`}>{s}</span>
            {i < steps.length - 1 && <span className="mx-2 hidden h-px w-8 bg-[#d8e8f3] sm:inline-block" />}
          </li>
        ))}
      </ol>

      <div className="min-h-[280px] p-6">
        {b.booked ? (
          <div className="text-center">
            <p className="m-0 text-5xl">✅</p>
            <p className="m-0 mt-3 text-xl font-semibold">{es ? 'Tu consulta quedó agendada' : 'Your consultation is booked'}</p>
            <p className="m-0 mt-1 text-[#4a6577] first-letter:uppercase">{f.when(b.booked.booking.start)}</p>
            <p className="m-0 mt-1 text-sm text-[#7a93a5]">{t.place.value || b.booked.type.place.value}</p>
            <button
              type="button"
              onClick={() => {
                b.again();
                setStep(0);
              }}
              className="mt-5 cursor-pointer rounded-lg border border-[#cfe1ee] px-4 py-2 text-sm font-semibold text-[#0369a1] hover:bg-[#f0f7fc]"
            >
              {es ? 'Agendar otra' : 'Book another'}
            </button>
          </div>
        ) : step === 0 ? (
          <div>
            <p className="m-0 mb-3 text-lg font-semibold">{es ? '¿Qué te trae?' : 'What brings you?'}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, answers: { ...form.answers, reason: r } });
                    setStep(1);
                  }}
                  className={`cursor-pointer rounded-xl border px-4 py-4 text-left text-sm font-semibold transition hover:border-[#0369a1] hover:bg-[#f0f7fc] ${form.answers.reason === r ? 'border-[#0369a1] bg-[#f0f7fc]' : 'border-[#d8e8f3]'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        ) : step === 1 ? (
          <div>
            <p className="m-0 mb-3 text-lg font-semibold">{es ? '¿Qué día te acomoda?' : 'Which day suits you?'}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {[...b.days.entries()].slice(0, 10).map(([d, slots]) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    b.setDay(d);
                    setStep(2);
                  }}
                  className="cursor-pointer rounded-xl border border-[#d8e8f3] p-3 text-center transition hover:border-[#0369a1] hover:bg-[#f0f7fc]"
                >
                  <span className="block text-xs font-semibold uppercase text-[#7a93a5]">{f.weekday(d)}</span>
                  <span className="block text-2xl font-semibold">{f.dayNumber(d)}</span>
                  <span className="block text-[11px] text-[#0369a1]">{es ? `${slots.length} horarios` : `${slots.length} times`}</span>
                </button>
              ))}
            </div>
          </div>
        ) : step === 2 ? (
          <div>
            <p className="m-0 mb-3 text-lg font-semibold first-letter:uppercase">{b.day && f.long(b.day)}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {b.times.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => {
                    b.choose(s);
                    setStep(3);
                  }}
                  className="cursor-pointer rounded-lg border border-[#d8e8f3] py-2.5 text-sm font-semibold text-[#0369a1] transition hover:bg-[#0369a1] hover:text-white"
                >
                  {f.time(s.start)}
                </button>
              ))}
            </div>
            <p className="m-0 mt-4 text-xs text-[#7a93a5]">{es ? 'Solo se muestran las horas en que la doctora está libre.' : 'Only the hours the doctor is free are shown.'}</p>
          </div>
        ) : (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await b.book(form);
            }}
          >
            <p className="m-0 rounded-lg bg-[#f0f7fc] px-4 py-3 text-sm sm:col-span-2">
              <b className="first-letter:uppercase">{b.slot && f.when(b.slot.start)}</b> · {form.answers.reason}
            </p>
            <input required className={input} placeholder={es ? 'Nombre completo' : 'Full name'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="email" className={input} placeholder={es ? 'Correo' : 'Email'} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {b.problems.length > 0 && <p className="m-0 text-sm text-[#b42a2a] sm:col-span-2">{b.problems.map((p) => p.message).join(' ')}</p>}
            <button type="submit" disabled={b.sending} className="cursor-pointer rounded-lg bg-[#0369a1] py-3 text-sm font-semibold text-white sm:col-span-2">
              {b.sending ? '…' : es ? 'Confirmar consulta' : 'Confirm'}
            </button>
          </form>
        )}
        {!b.booked && step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="mt-5 cursor-pointer text-sm font-semibold text-[#7a93a5] hover:text-[#0369a1]">
            ← {es ? 'Atrás' : 'Back'}
          </button>
        )}
      </div>
    </div>
  );
}
