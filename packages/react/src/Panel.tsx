// A booking as the owner handles it, beside the calendar: a gap given to
// someone (who, what the kind asks, which court if they like), or a booking
// already made, its person changed, moved to another gap (the next one
// chosen in the calendar), or deleted, once it is said so. A gap may be
// given every week, the times of it that are not free said before; a booking
// of a series deleted alone, or with the rest of it. What is asked of the
// server is the application's: it is told, and says what went wrong.

import { type Booking, type EventType, formatMoney, type Locale, type Repeat, type SeriesTime, type Slot } from '@reboschedule/core';
import { type FormEvent, useState } from 'react';
import { WORDS } from './i18n';

export interface BookingDetails {
  name: string;
  email: string;
  answers: Record<string, string>;
  /** The resource chosen, for a new one; any free when none. */
  resource?: string;
  /** The same every week, for a new one: as many times as said. */
  repeat?: Repeat;
}

export interface BookingPanelProps {
  type: EventType;
  /** The booking shown, to change, move or delete; none, a new one at `slot`. */
  booking?: Booking;
  slot?: Slot;
  /** The owner's time zone, as the calendar says the times. */
  timeZone: string;
  locale?: Locale;
  /** Whether it is being moved: the next gap chosen in the calendar is where. */
  moving?: boolean;
  /** Told what was written, to book or to keep; says the problems, if any. */
  onSave(details: BookingDetails): Promise<string[] | undefined> | string[] | undefined;
  /** Told it is to be moved, or no longer. */
  onMove?(moving: boolean): void;
  /** Told it is to be deleted, once it was said so: it alone, or the rest of its series with it. */
  onDelete?(scope: 'one' | 'series'): Promise<void> | void;
  /** Each time of a series asked, and whether it is free (`planSeries`), to say before giving it; none, no series offered. */
  onPlan?(repeat: Repeat): SeriesTime[];
  onClose(): void;
  /** Told it was marked as come or not come (none, unmarked); given, it may be marked once its day has come. */
  onAttend?(attended: 'arrived' | 'no-show' | null): void;
  className?: string;
}

/** Words as a title begins them. */
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function BookingPanel({ type, booking, slot, timeZone, locale = 'en', moving = false, onSave, onMove, onDelete, onPlan, onClose, onAttend, className }: BookingPanelProps) {
  const w = WORDS[locale];
  const [form, setForm] = useState<BookingDetails>({
    name: booking?.name ?? '',
    email: booking?.email ?? '',
    answers: { ...booking?.answers },
    resource: slot?.resources?.length === 1 ? slot.resources[0] : '',
  });
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  // How many weeks, for a new one given every week; one, once.
  const [weeks, setWeeks] = useState(1);
  const repeat: Repeat | undefined = weeks > 1 ? { every: 1, count: weeks } : undefined;
  const plan = repeat && onPlan ? onPlan(repeat) : [];
  const day = new Intl.DateTimeFormat(locale, { timeZone, weekday: 'short', day: 'numeric', month: 'short' });
  const start = booking?.start ?? slot?.start ?? '';
  const end = booking?.end ?? slot?.end ?? '';
  const when = new Intl.DateTimeFormat(locale, { timeZone, weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
  const clock = new Intl.DateTimeFormat(locale, { timeZone, hour: 'numeric', minute: '2-digit' });
  const nameOf = (id: string) => type.resources.find((r) => r.id === id)?.name ?? id;

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setProblems((await onSave({ ...form, resource: form.resource || undefined, ...(repeat ? { repeat } : {}) })) || []);
    } catch {
      setProblems([w.failed]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`rse rsp${className ? ` ${className}` : ''}`} data-moving={moving || undefined} onSubmit={save}>
      <header className="rsp-head">
        <span className="rse-dot" style={{ background: type.color }} />
        <span className="rsp-what">
          <b>{type.title}</b>
          {start && (
            <span>
              {upper(when.format(new Date(start)))} – {clock.format(new Date(end))}
              {booking?.resource ? ` · ${nameOf(booking.resource)}` : ''}
              {(booking?.price ?? slot?.price) ? ` · ${formatMoney((booking?.price ?? slot?.price)!, locale)}` : ''}
            </span>
          )}
        </span>
        <button type="button" className="rse-icon" aria-label={w.close} title={w.close} onClick={onClose}>
          ×
        </button>
      </header>
      {moving ? (
        <p className="rsp-moving" role="status">
          {w.moving}
        </p>
      ) : (
        <>
          <div className="rsp-fields">
            <label className="rse-field">
              <span>{w.name}</span>
              <input className="rse-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="rse-field">
              <span>{w.email}</span>
              <input className="rse-input" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            {type.questions.map((q) => (
              <label key={q.id} className="rse-field">
                <span>
                  {q.label}
                  {q.required ? ' *' : ''}
                </span>
                <input
                  className="rse-input"
                  type={q.kind === 'phone' ? 'tel' : 'text'}
                  required={q.required}
                  value={form.answers[q.id] ?? ''}
                  onChange={(e) => setForm({ ...form, answers: { ...form.answers, [q.id]: e.target.value } })}
                />
              </label>
            ))}
            {!booking && slot?.resources && slot.resources.length > 1 && (
              <label className="rse-field">
                <span>{w.which}</span>
                <select className="rse-input" value={form.resource} onChange={(e) => setForm({ ...form, resource: e.target.value })}>
                  <option value="">{w.any}</option>
                  {slot.resources.map((id) => (
                    <option key={id} value={id}>
                      {nameOf(id)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {!booking && onPlan && (
            <div className="rsp-repeat">
              <span className="rse-track">
                {[1, 4, 8, 12].map((n) => (
                  <button key={n} type="button" className="rse-chip" aria-pressed={weeks === n} onClick={() => setWeeks(n)}>
                    {n === 1 ? w.once : w.everyWeek(n)}
                  </button>
                ))}
              </span>
              {plan.length > 1 && (
                <ul className="rsp-plan" aria-label={w.everyWeek(weeks)}>
                  {plan.map((p) => (
                    <li key={p.start} data-taken={p.resource === null || undefined}>
                      {p.resource === null ? '✕' : '✓'} {day.format(new Date(p.start))}
                    </li>
                  ))}
                </ul>
              )}
              {plan.some((p) => p.resource === null) && <p className="rse-help">{w.someTaken(plan.filter((p) => p.resource === null).length)}</p>}
            </div>
          )}
          {booking?.series && <p className="rse-help">↻ {w.inSeries}</p>}
          {problems.length > 0 && (
            <ul className="rsp-problems" role="alert">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </>
      )}
      {asking && !moving ? (
        <div className="rsp-actions rsp-ask" role="alertdialog" aria-label={w.deleteBooking}>
          <span>{w.confirmDelete(booking?.name ?? '')}</span>
          {(booking?.series ? (['one', 'series'] as const) : (['one'] as const)).map((scope) => (
            <button
              key={scope}
              type="button"
              className="rse-button rse-danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onDelete?.(scope);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {booking?.series ? (scope === 'one' ? w.onlyThis : w.wholeSeries) : w.yesDelete}
            </button>
          ))}
          <button type="button" className="rse-button" onClick={() => setAsking(false)}>
            {w.keep}
          </button>
        </div>
      ) : (
        <div className="rsp-actions">
          {/* Its day come: whether they came. */}
          {booking && onAttend && booking.status === 'confirmed' && Date.parse(booking.start) - Date.now() < 12 * 3_600_000 && (
            <fieldset className="rsp-attend" aria-label={w.attendance}>
              {(['arrived', 'no-show'] as const).map((a) => (
                <button key={a} type="button" className="rse-button" data-attend={a} aria-pressed={booking.attended === a} onClick={() => onAttend(booking.attended === a ? null : a)}>
                  {a === 'arrived' ? `✓ ${w.arrived}` : `✕ ${w.noShow}`}
                </button>
              ))}
            </fieldset>
          )}
          {!moving && (
            <button type="submit" className="rse-button rse-primary" disabled={busy}>
              {busy ? w.saving : booking ? w.save : w.assign}
            </button>
          )}
          {booking && onMove && (
            <button type="button" className="rse-button" aria-pressed={moving} onClick={() => onMove(!moving)}>
              {moving ? w.keep : w.move}
            </button>
          )}
          {booking && onDelete && !moving && (
            <button type="button" className="rse-button rse-danger-quiet" onClick={() => setAsking(true)}>
              {w.deleteBooking}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
