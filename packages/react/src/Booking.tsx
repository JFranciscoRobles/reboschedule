// Where someone books: who and what kind of appointment, how long, where; a
// month with the days that have times marked; the times of the day chosen, as
// the clock of whoever books says them (their time zone, which they may
// change); their details and what is asked; and, booked, when it is, with the
// ways to put it in their calendar and their own address to see or cancel it.
// When what is booked is a thing (a court, a room), who books chooses first
// which one, among all of them or any free, and for how long, and sees the
// times of that one; and when there is more than one place at a time (the
// courts together, the guards of a shift), each time says how many are left.
// It asks the server's routes (`endpoint`): the times free, then the booking,
// checked again there.

import { formatMoney, type Locale, type Money } from '@reboschedule/core';
import { type FormEvent, useId, useState } from 'react';
import { WORDS } from './i18n';
import { type Booked, useBooking } from './useBooking';
import { valuesOf } from './values';

export type { Booked } from './useBooking';

export interface BookingWidgetProps {
  /** Where the kind's routes are: `https://example.com/s/visit`, its `/slots` and `/book`. */
  endpoint: string;
  locale?: Locale;
  /** The time zone of whoever books; their browser's unless said. */
  timeZone?: string;
  onBooked?: (booked: Booked) => void;
  /** A fetch of one's own, for a test or a runtime. */
  fetch?: typeof fetch;
  className?: string;
}

const ZONES = [
  'America/Tijuana',
  'America/Mexico_City',
  'America/Monterrey',
  'America/Cancun',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Bogota',
  'Europe/Madrid',
  'UTC',
];
/** Words as a title begins them: `noviembre de 2026`, `Noviembre de 2026`. */
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function BookingWidget({ endpoint, locale = 'en', timeZone: given, onBooked, fetch, className }: BookingWidgetProps) {
  const w = WORDS[locale];
  const b = useBooking({ endpoint, timeZone: given, onBooked, fetch });
  const zoneId = useId();
  const [form, setForm] = useState<{ name: string; email: string; answers: Record<string, string> }>({ name: '', email: '', answers: {} });
  // Every week, how many times, when the kind lets it; one, once.
  const [weeks, setWeeks] = useState(1);
  const { timeZone, slot, booked, resource, day, times, parts: groups, dayPrice: onePrice } = b;
  const problems = b.problems.map((p) => (p.code === 'failed' ? w.failed : p.code === 'run-out' ? w.runOut : p.message));

  const money = (m: Money) => formatMoney(m, locale);
  const time = (iso: string, long = false) =>
    new Intl.DateTimeFormat(locale, long ? { timeZone, weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' } : { timeZone, hour: 'numeric', minute: '2-digit' }).format(
      new Date(iso),
    );
  const dayName = (d: string, style: 'long' | 'short' = 'long') =>
    new Intl.DateTimeFormat(locale, style === 'long' ? { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' } : { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${b.month}-15T12:00:00Z`));

  async function book(e: FormEvent) {
    e.preventDefault();
    await b.book(form, weeks > 1 ? { repeat: { every: 1, count: weeks } } : {});
  }

  if (b.status === 'failed') return <div className={`rsb${className ? ` ${className}` : ''}`}>{w.failed}</div>;
  if (!b.type || !b.organizer) return <div className={`rsb rsb-loading${className ? ` ${className}` : ''}`}>{w.loading}</div>;
  const { type, lengths } = b;
  const nameOf = (id: string) => type.resources.find((r) => r.id === id)?.name ?? id;
  const active = day;

  const head = (
    <header className="rsb-head">
      <span className="rsb-color" style={{ background: type.color }} />
      <p className="rsb-owner">{b.organizer.name}</p>
      <h2>{type.title}</h2>
      <p className="rsb-facts">
        <span>⏱ {lengths.map(w.minutes).join(' · ')}</span>
        {type.price && (
          <span>
            {w.from(
              money({
                amount: Math.min(type.price.amount, ...type.resources.map((r) => r.price ?? type.price!.amount)),
                currency: type.price.currency,
              }),
            )}
            {type.price.per === 'hour' ? ` ${w.perHour}` : ''}
          </span>
        )}
        {type.resources.length > 0 && <span>▦ {w.resourcesCount(type.resources.length)}</span>}
        <span>
          {{ 'in-person': '📍', phone: '📞', video: '🎥', custom: '•' }[type.place.kind]} {w.places[type.place.kind]}
        </span>
      </p>
      {type.description && <p className="rsb-description">{type.description}</p>}
    </header>
  );

  // Held while it is paid for: where to pay it, until when; or let go.
  if (b.held)
    return (
      <div className={`rsb rsb-done${className ? ` ${className}` : ''}`}>
        {head}
        <div className="rsb-confirm">
          <h3>{w.held}</h3>
          <p>{time(b.held.booking.start, true)}</p>
          {b.held.booking.price && <p className="rsb-total">{w.total(money(b.held.booking.price))}</p>}
          <p className="rsb-where">{w.heldUntil(new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(b.held.until)))}</p>
          <div className="rsb-actions">
            <a className="rsb-button" href={b.held.pay}>
              {w.pay}
            </a>
            <button type="button" className="rsb-link" onClick={() => void b.release()}>
              {w.letGo}
            </button>
          </div>
        </div>
      </div>
    );

  if (booked)
    return (
      <div className={`rsb rsb-done${className ? ` ${className}` : ''}`}>
        {head}
        <div className="rsb-confirm">
          <span className="rsb-check" aria-hidden="true">
            ✓
          </span>
          <h3>{w.booked}</h3>
          <p>{w.bookedFor(time(booked.booking.start, true))}</p>
          {booked.booking.price && <p className="rsb-total">{w.total(money(booked.booking.price))}</p>}
          {booked.series && booked.series.length > 1 && <p className="rsb-where">↻ {w.bookedSeries(booked.series.length)}</p>}
          {booked.skipped && booked.skipped.length > 0 && (
            <p className="rsb-skipped">
              {w.skipped(booked.skipped.length)} {booked.skipped.map((s) => time(s, true)).join(' · ')}
            </p>
          )}
          {booked.booking.resource && (
            <p className="rsb-where rsb-booked-thing">
              {type.resources.find((r) => r.id === booked.booking.resource)?.image && <img src={type.resources.find((r) => r.id === booked.booking.resource)?.image} alt="" />}
              {nameOf(booked.booking.resource)}
            </p>
          )}
          {booked.type.place.value && <p className="rsb-where">{booked.type.place.value}</p>}
          <div className="rsb-actions">
            <a className="rsb-button" href={booked.google} target="_blank" rel="noreferrer">
              {w.addGoogle}
            </a>
            <a className="rsb-button" href={booked.ics}>
              {w.addIcs}
            </a>
            <a className="rsb-link" href={booked.manage}>
              {w.manage}
            </a>
          </div>
          <button
            type="button"
            className="rsb-link"
            onClick={() => {
              setForm({ ...form, answers: {} });
              b.again();
            }}
          >
            {w.bookAnother}
          </button>
        </div>
      </div>
    );

  return (
    <div className={`rsb${className ? ` ${className}` : ''}`}>
      {head}
      {slot ? (
        <form className="rsb-form" onSubmit={book}>
          <button type="button" className="rsb-back" onClick={() => b.choose(null)}>
            ← {w.back}
          </button>
          <p className="rsb-chosen">
            {upper(time(slot.start, true))} – {time(slot.end)}
            {type.resources.length > 0 && ` · ${resource ? nameOf(resource) : w.any}`}
          </p>
          {slot.price && <p className="rsb-total">{w.total(money(slot.price))}</p>}
          {type.series > 1 && (
            <fieldset className="rsb-repeat">
              <legend>{w.repeatTitle}</legend>
              <span className="rsb-chips">
                {[1, ...[4, 8, 12].filter((n) => n <= type.series), ...(type.series > 1 && ![4, 8, 12].includes(type.series) ? [type.series] : [])].map((n) => (
                  <button key={n} type="button" className="rsb-chip" aria-pressed={weeks === n} onClick={() => setWeeks(n)}>
                    {n === 1 ? w.once : w.everyWeek(n)}
                  </button>
                ))}
              </span>
            </fieldset>
          )}
          <h3>{w.details}</h3>
          <label className="rsb-field">
            <span>{w.name}</span>
            <input className="rsb-input" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="rsb-field">
            <span>{w.email}</span>
            <input className="rsb-input" required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          {type.questions.map((q) => (
            // biome-ignore lint/a11y/noLabelWithoutControl: its control is inside it, a paragraph or a line as the question asks.
            <label key={q.id} className="rsb-field">
              <span>
                {q.label}
                {q.required ? ' *' : ''}
              </span>
              {q.kind === 'long' ? (
                <textarea
                  className="rsb-input"
                  rows={3}
                  required={q.required}
                  value={form.answers[q.id] ?? ''}
                  onChange={(e) => setForm({ ...form, answers: { ...form.answers, [q.id]: e.target.value } })}
                />
              ) : (
                <input
                  className="rsb-input"
                  type={q.kind === 'phone' ? 'tel' : 'text'}
                  required={q.required}
                  value={form.answers[q.id] ?? ''}
                  onChange={(e) => setForm({ ...form, answers: { ...form.answers, [q.id]: e.target.value } })}
                />
              )}
            </label>
          ))}
          {b.coupons && (
            <label className="rsb-field">
              <span>{w.coupon}</span>
              <input className="rsb-input" value={b.coupon} onChange={(e) => b.setCoupon(e.target.value)} autoComplete="off" />
              {b.coupon.trim() && <small className="rsb-hint">{b.applied ? `✓ ${b.applied.label}` : w.noCoupon}</small>}
            </label>
          )}
          {problems.length > 0 && (
            <ul className="rsb-problems" role="alert">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <button type="submit" className="rsb-button rsb-primary" disabled={b.sending}>
            {b.sending ? w.booking : w.book}
          </button>
        </form>
      ) : (
        <div className="rsb-pick">
          {type.resources.length > 0 && (
            <fieldset className="rsb-which">
              <legend>{w.which}</legend>
              <span className="rsb-options">
                {[null, ...type.resources].map((r) => {
                  const id = r?.id ?? '';
                  return (
                    <button key={id || 'any'} type="button" className="rsb-option" data-any={!r || undefined} aria-pressed={resource === id} onClick={() => b.setResource(id)}>
                      {r?.image ? (
                        <img className="rsb-option-picture" src={r.image} alt="" />
                      ) : (
                        type.resources.some((x) => x.image) && <span className="rsb-option-picture rsb-option-any" aria-hidden="true" />
                      )}
                      <b>{r ? r.name : w.any}</b>
                      <span className="rsb-option-values">
                        {(r ? valuesOf(type, r) : [w.resourcesCount(type.resources.length)]).map((v) => (
                          <small key={v}>{v}</small>
                        ))}
                        {r && type.price && (
                          <small className="rsb-option-price">
                            {money({ amount: r.price ?? type.price.amount, currency: type.price.currency })}
                            {type.price.per === 'hour' ? ` ${w.perHour}` : ''}
                          </small>
                        )}
                      </span>
                    </button>
                  );
                })}
              </span>
            </fieldset>
          )}
          {lengths.length > 1 && (
            <fieldset className="rsb-lengths">
              <legend>{w.length}</legend>
              <span className="rsb-chips">
                {lengths.map((n) => (
                  <button key={n} type="button" className="rsb-chip" aria-pressed={b.length === n} onClick={() => b.setLength(n)}>
                    {w.minutes(n)}
                  </button>
                ))}
              </span>
            </fieldset>
          )}
          <section className="rsb-month" aria-label={w.pickDay}>
            <div className="rsb-month-head">
              <button type="button" className="rsb-icon" aria-label={w.previous} onClick={() => b.moveMonth(-1)}>
                ‹
              </button>
              <b>{upper(monthName)}</b>
              <button type="button" className="rsb-icon" aria-label={w.next} onClick={() => b.moveMonth(1)}>
                ›
              </button>
            </div>
            <div className="rsb-grid">
              {['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-01'].map((d) => (
                <span key={d} className="rsb-weekday">
                  {dayName(d, 'short')}
                </span>
              ))}
              {b.weeks.flat().map((d, i) =>
                d ? (
                  <button key={d} type="button" className="rsb-day" disabled={!b.days.has(d)} aria-pressed={active === d} aria-label={dayName(d)} onClick={() => b.setDay(d)}>
                    {Number(d.slice(8))}
                  </button>
                ) : (
                  // biome-ignore lint/suspicious/noArrayIndexKey: the empty places of the grid, where they are.
                  <span key={i} />
                ),
              )}
            </div>
            <div className="rsb-zone">
              <label htmlFor={zoneId}>{w.timeZone}</label>
              <select id={zoneId} className="rsb-input" value={timeZone} onChange={(e) => b.setTimeZone(e.target.value)}>
                {[...new Set([timeZone, b.ownerTimeZone, ...ZONES])].map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </section>
          <section className="rsb-times" aria-label={w.pickTime}>
            {active ? (
              <>
                <p className="rsb-day-name">{upper(dayName(active))}</p>
                {onePrice && <p className="rsb-total">{w.total(money(onePrice))}</p>}
                {groups.map((p) => (
                  <div key={p.part} className="rsb-part">
                    {groups.length > 1 && times.length > 6 && <p className="rsb-part-name">{w.dayParts[p.part]}</p>}
                    {p.times.map((s) => (
                      <button key={s.start} type="button" className="rsb-time" onClick={() => b.choose(s)}>
                        {time(s.start)}
                        {((type.resources.length > 0 && !resource) || type.capacity > 1) && <small>{w.left(s.free)}</small>}
                        {!onePrice && s.price && <small className="rsb-time-price">{money(s.price)}</small>}
                      </button>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <p className="rsb-help">{b.days.size ? w.noTimesMonth : w.noneFree}</p>
            )}
            {problems.length > 0 && (
              <ul className="rsb-problems" role="alert">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
