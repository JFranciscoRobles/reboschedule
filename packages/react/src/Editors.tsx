// What the owner writes: their hours (each day of the week its stretches,
// copied to every day at a click; the days that are not as the week; their
// time zone), each kind of appointment they give (how long, every how many
// minutes, the time kept free around it, how soon and how far ahead, how many
// a day, where, what is asked, its colour; and when it is a thing booked, a
// court or a room, which there are, how many at once, the lengths one may
// choose and the hours it is open), and the list of what is booked.

import {
  type Booking,
  DURATIONS,
  type EventType,
  FIELD_KINDS,
  formatMoney,
  type Hours,
  type Locale,
  newId,
  PLACE_KINDS,
  QUESTION_KINDS,
  type Resource,
  type Schedule,
  WEEKDAYS,
  type Weekday,
} from '@reboschedule/core';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { WORDS } from './i18n';

/** Words as a title begins them. */
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  // biome-ignore lint/a11y/noLabelWithoutControl: the control is the child given.
  <label className="rse-field">
    <span>{label}</span>
    {children}
  </label>
);

/** Buttons that choose one thing, named together. */
function Choice<T extends string | number>({ label, of, value, name, onChange }: { label: string; of: readonly T[]; value: T; name: (v: T) => string; onChange: (v: T) => void }) {
  return (
    <fieldset className="rse-field rse-group">
      <legend>{label}</legend>
      <span className="rse-track">
        {of.map((v) => (
          <button key={String(v)} type="button" className="rse-chip" aria-pressed={value === v} onClick={() => onChange(v)}>
            {name(v)}
          </button>
        ))}
      </span>
    </fieldset>
  );
}

/** Stretches of a day, each two clocks, added and taken away. */
function HoursRow({ hours, onChange, locale }: { hours: Hours[]; onChange: (h: Hours[]) => void; locale: Locale }) {
  const w = WORDS[locale];
  return (
    <span className="rse-hours">
      {hours.map((h, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the stretches of a day, in their order.
        <span key={i} className="rse-range">
          <input
            className="rse-input rse-clock"
            type="time"
            value={h.from}
            aria-label={`${w.hours} ${i + 1}`}
            onChange={(e) => onChange(hours.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))}
          />
          <span aria-hidden="true">–</span>
          <input
            className="rse-input rse-clock"
            type="time"
            value={h.to}
            aria-label={`${w.hours} ${i + 1}`}
            onChange={(e) => onChange(hours.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))}
          />
          <button type="button" className="rse-icon" aria-label={w.remove} title={w.remove} onClick={() => onChange(hours.filter((_, j) => j !== i))}>
            ×
          </button>
        </span>
      ))}
      <button type="button" className="rse-action" onClick={() => onChange([...hours, hours.length ? { from: hours.at(-1)!.to, to: '18:00' } : { from: '09:00', to: '17:00' }])}>
        + {w.addHours}
      </button>
    </span>
  );
}

/** The days of the week, Monday first as a week is read, each switched on with its stretches, or off. */
function Week({ weekly, onChange, locale }: { weekly: Schedule['weekly']; onChange: (w: Schedule['weekly']) => void; locale: Locale }) {
  const w = WORDS[locale];
  const order: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
  const setDay = (d: Weekday, hours: Hours[]) => onChange({ ...weekly, [d]: hours });
  return (
    <ul className="rse-week">
      {order.map((d) => {
        const hours = weekly[d];
        return (
          <li key={d} className="rse-weekday">
            <label className="rse-switch">
              <input type="checkbox" role="switch" aria-checked={hours.length > 0} checked={hours.length > 0} onChange={(e) => setDay(d, e.target.checked ? [{ from: '09:00', to: '17:00' }] : [])} />
              <b>{w.weekdays[d]}</b>
            </label>
            {hours.length ? <HoursRow hours={hours} onChange={(h) => setDay(d, h)} locale={locale} /> : <span className="rse-off">{w.dayOff}</span>}
            {hours.length > 0 && (
              <button type="button" className="rse-link" onClick={() => onChange(Object.fromEntries(WEEKDAYS.map((x) => [x, weekly[x].length ? hours : []])) as Schedule['weekly'])}>
                {w.copyToAll}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const ZONES = [
  'America/Tijuana',
  'America/Hermosillo',
  'America/Mazatlan',
  'America/Mexico_City',
  'America/Monterrey',
  'America/Cancun',
  'America/Los_Angeles',
  'America/New_York',
  'America/Bogota',
  'Europe/Madrid',
  'UTC',
];

export function ScheduleEditor({ schedule, onChange, locale = 'en', className }: { schedule: Schedule; onChange: (s: Schedule) => void; locale?: Locale; className?: string }) {
  const w = WORDS[locale];
  const [newDay, setNewDay] = useState('');
  return (
    <div className={`rse${className ? ` ${className}` : ''}`}>
      <section className="rse-part">
        <h2>{w.hours}</h2>
        <Field label={w.timeZone}>
          <select className="rse-input" value={schedule.timeZone} onChange={(e) => onChange({ ...schedule, timeZone: e.target.value })}>
            {[...new Set([schedule.timeZone, ...ZONES])].map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </Field>
        <Week weekly={schedule.weekly} onChange={(weekly) => onChange({ ...schedule, weekly })} locale={locale} />
      </section>
      <section className="rse-part">
        <h2>{w.specialDays}</h2>
        <p className="rse-help">{w.specialHint}</p>
        <ul className="rse-week">
          {Object.entries(schedule.dates)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, hours]) => (
              <li key={day} className="rse-weekday">
                <b>{new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`))}</b>
                {hours.length ? (
                  <HoursRow hours={hours} onChange={(h) => onChange({ ...schedule, dates: { ...schedule.dates, [day]: h } })} locale={locale} />
                ) : (
                  <span className="rse-off">
                    {w.closed}{' '}
                    <button type="button" className="rse-link" onClick={() => onChange({ ...schedule, dates: { ...schedule.dates, [day]: [{ from: '09:00', to: '13:00' }] } })}>
                      {w.addHours}
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  className="rse-link"
                  onClick={() => {
                    const { [day]: _, ...rest } = schedule.dates;
                    onChange({ ...schedule, dates: rest });
                  }}
                >
                  {w.remove}
                </button>
              </li>
            ))}
        </ul>
        <span className="rse-range">
          <input className="rse-input" type="date" value={newDay} aria-label={w.addDay} onChange={(e) => setNewDay(e.target.value)} />
          <button
            type="button"
            className="rse-button"
            disabled={!newDay}
            onClick={() => {
              onChange({ ...schedule, dates: { ...schedule.dates, [newDay]: [] } });
              setNewDay('');
            }}
          >
            {w.addDay}
          </button>
        </span>
      </section>
    </div>
  );
}

/** The most a picture uploaded may weigh, as data: what `readImage` keeps. */
const MOST_IMAGE = 300_000;

/** What is booked: the fields each one has, and each one, its picture, its name and what it says of itself. */
function Resources({ type, set, locale }: { type: EventType; set: (patch: Partial<EventType>) => void; locale: Locale }) {
  const w = WORDS[locale];
  const [problem, setProblem] = useState('');
  const change = (id: string, patch: Partial<Resource>) => set({ resources: type.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const upload = (id: string, file: File | undefined) => {
    if (!file) return;
    if (file.size > (MOST_IMAGE * 3) / 4) return setProblem(w.imageTooBig);
    setProblem('');
    const reader = new FileReader();
    reader.onload = () => change(id, { image: String(reader.result) });
    reader.readAsDataURL(file);
  };
  return (
    <fieldset className="rse-field rse-group">
      <legend>{w.resources}</legend>
      <p className="rse-help">{w.resourcesHint}</p>

      <div className="rse-subgroup">
        <b>{w.fieldsTitle}</b>
        <p className="rse-help">{w.fieldsHint}</p>
        {type.fields.map((f, i) => (
          <span key={f.id} className="rse-range">
            <input
              className="rse-input"
              value={f.label}
              placeholder={w.fieldLabel}
              aria-label={`${w.fieldLabel} ${i + 1}`}
              onChange={(e) => set({ fields: type.fields.map((x) => (x.id === f.id ? { ...x, label: e.target.value } : x)) })}
            />
            <select
              className="rse-input rse-narrow"
              value={f.kind}
              aria-label={w.fieldKind}
              onChange={(e) => set({ fields: type.fields.map((x) => (x.id === f.id ? { ...x, kind: e.target.value as typeof f.kind } : x)) })}
            >
              {FIELD_KINDS.map((k) => (
                <option key={k} value={k}>
                  {w.fieldKinds[k]}
                </option>
              ))}
            </select>
            {f.kind === 'number' && (
              <input
                className="rse-input rse-unit"
                value={f.unit}
                placeholder={w.unit}
                aria-label={w.unit}
                onChange={(e) => set({ fields: type.fields.map((x) => (x.id === f.id ? { ...x, unit: e.target.value } : x)) })}
              />
            )}
            <button type="button" className="rse-icon" aria-label={w.remove} title={w.remove} onClick={() => set({ fields: type.fields.filter((x) => x.id !== f.id) })}>
              ×
            </button>
          </span>
        ))}
        {type.fields.length < 12 && (
          <button type="button" className="rse-action" onClick={() => set({ fields: [...type.fields, { id: newId(), label: '', kind: 'text', unit: '' }] })}>
            + {w.addField}
          </button>
        )}
      </div>

      <div className="rse-resources">
        {type.resources.map((r, i) => (
          <div key={r.id} className="rse-resource">
            <label className="rse-picture" title={w.uploadImage}>
              {r.image ? <img src={r.image} alt="" /> : <span>+ {w.uploadImage}</span>}
              <input type="file" accept="image/*" className="rse-hidden" onChange={(e) => upload(r.id, e.target.files?.[0])} />
            </label>
            <div className="rse-resource-body">
              <span className="rse-range">
                <input className="rse-input" value={r.name} placeholder={w.resourceName} aria-label={`${w.resources} ${i + 1}`} onChange={(e) => change(r.id, { name: e.target.value })} />
                <button type="button" className="rse-icon" aria-label={w.remove} title={w.remove} onClick={() => set({ resources: type.resources.filter((x) => x.id !== r.id) })}>
                  ×
                </button>
              </span>
              {type.fields
                .filter((f) => f.label.trim())
                .map((f) =>
                  f.kind === 'yes-no' ? (
                    <label key={f.id} className="rse-switch rse-value">
                      <input
                        type="checkbox"
                        role="switch"
                        aria-checked={r.values[f.id] === true}
                        checked={r.values[f.id] === true}
                        onChange={(e) => change(r.id, { values: { ...r.values, [f.id]: e.target.checked } })}
                      />
                      {f.label}
                    </label>
                  ) : (
                    <label key={f.id} className="rse-value">
                      <span>
                        {f.label}
                        {f.unit ? ` (${f.unit})` : ''}
                      </span>
                      <input
                        className="rse-input"
                        type={f.kind === 'number' ? 'number' : 'text'}
                        value={String(r.values[f.id] ?? '')}
                        onChange={(e) => {
                          const { [f.id]: _, ...rest } = r.values;
                          const v = f.kind === 'number' ? Number(e.target.value) : e.target.value;
                          change(r.id, { values: e.target.value === '' ? rest : { ...rest, [f.id]: v } });
                        }}
                      />
                    </label>
                  ),
                )}
              {type.price && (
                <label className="rse-value">
                  <span>{w.ownPrice}</span>
                  <input
                    className="rse-input"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder={String(type.price.amount)}
                    value={r.price ?? ''}
                    onChange={(e) => change(r.id, { price: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
                  />
                </label>
              )}
              {r.image && (
                <button type="button" className="rse-link" onClick={() => change(r.id, { image: '' })}>
                  {w.removeImage}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {problem && (
        <p className="rse-problem" role="alert">
          {problem}
        </p>
      )}
      {type.resources.length < 50 && (
        <button type="button" className="rse-action" onClick={() => set({ resources: [...type.resources, { id: newId(), name: '', image: '', values: {}, price: null }] })}>
          + {w.addResource}
        </button>
      )}
    </fieldset>
  );
}

export function EventTypeEditor({ type, onChange, locale = 'en', className }: { type: EventType; onChange: (t: EventType) => void; locale?: Locale; className?: string }) {
  const w = WORDS[locale];
  const set = (patch: Partial<EventType>) => onChange({ ...type, ...patch });
  const minutes = (label: string, key: 'increment' | 'before' | 'after' | 'notice', of: number[]) => (
    <Choice label={label} of={of} value={type[key]} name={(n) => (n ? w.minutes(n) : '—')} onChange={(n) => set({ [key]: n })} />
  );
  return (
    <div className={`rse${className ? ` ${className}` : ''}`}>
      <section className="rse-part">
        <h2>
          <span className="rse-dot" style={{ background: type.color }} /> {type.title || w.title}
        </h2>
        <div className="rse-row">
          <Field label={w.title}>
            <input className="rse-input" value={type.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label={w.slug}>
            <input className="rse-input" value={type.slug} maxLength={60} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
          </Field>
        </div>
        <Field label={w.description}>
          <textarea className="rse-input" rows={2} value={type.description} maxLength={1000} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <Choice
          label={w.duration}
          of={[...new Set([...DURATIONS, 120, type.duration])].sort((a, b) => a - b)}
          value={type.duration}
          name={w.minutes}
          onChange={(duration) => set({ duration, increment: type.increment === type.duration ? duration : type.increment, lengths: type.lengths.filter((n) => n !== duration) })}
        />
        <fieldset className="rse-field rse-group">
          <legend>{w.lengths}</legend>
          <span className="rse-track">
            {[...new Set([...DURATIONS, 120, 180, ...type.lengths])]
              .filter((n) => n !== type.duration)
              .sort((a, b) => a - b)
              .map((n) => (
                <button
                  key={n}
                  type="button"
                  className="rse-chip"
                  aria-pressed={type.lengths.includes(n)}
                  onClick={() => set({ lengths: type.lengths.includes(n) ? type.lengths.filter((x) => x !== n) : [...type.lengths, n].sort((a, b) => a - b) })}
                >
                  {w.minutes(n)}
                </button>
              ))}
          </span>
        </fieldset>
        {minutes(
          w.increment,
          'increment',
          [...new Set([15, 30, 60, type.increment])].sort((a, b) => a - b),
        )}
        <div className="rse-row">
          {minutes(w.before, 'before', [0, 10, 15, 30])}
          {minutes(w.after, 'after', [0, 10, 15, 30])}
        </div>
        <div className="rse-row">
          {minutes(w.notice, 'notice', [0, 60, 120, 24 * 60])}
          <Field label={w.horizon}>
            <input className="rse-input" type="number" min={1} max={365} value={type.horizon} onChange={(e) => set({ horizon: Math.max(1, Number(e.target.value) || 1) })} />
          </Field>
          <Field label={w.perDay}>
            <input
              className="rse-input"
              type="number"
              min={1}
              max={100}
              placeholder={w.noLimit}
              value={type.perDay ?? ''}
              onChange={(e) => set({ perDay: e.target.value ? Math.max(1, Number(e.target.value)) : null })}
            />
          </Field>
        </div>
        <fieldset className="rse-field rse-group">
          <legend>
            <label className="rse-switch">
              <input
                type="checkbox"
                role="switch"
                aria-checked={type.price !== null}
                checked={type.price !== null}
                onChange={(e) => set({ price: e.target.checked ? { amount: 0, currency: 'MXN', per: 'hour' } : null })}
              />
              <b>{w.price}</b>
            </label>
          </legend>
          <p className="rse-help">{w.priceHint}</p>
          {type.price && (
            <span className="rse-range">
              <input
                className="rse-input rse-amount"
                type="number"
                min={0}
                step="0.01"
                value={type.price.amount}
                aria-label={w.amount}
                onChange={(e) => set({ price: { ...type.price!, amount: Math.max(0, Number(e.target.value) || 0) } })}
              />
              <input
                className="rse-input rse-currency"
                value={type.price.currency}
                maxLength={3}
                aria-label={w.currency}
                onChange={(e) => set({ price: { ...type.price!, currency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') } })}
              />
              <span className="rse-track">
                {(['hour', 'booking'] as const).map((per) => (
                  <button key={per} type="button" className="rse-chip" aria-pressed={type.price!.per === per} onClick={() => set({ price: { ...type.price!, per } })}>
                    {w.per[per]}
                  </button>
                ))}
              </span>
            </span>
          )}
        </fieldset>
        <Choice label={w.place} of={PLACE_KINDS} value={type.place.kind} name={(k) => w.places[k]} onChange={(kind) => set({ place: { ...type.place, kind } })} />
        <Field label={w.placeValue[type.place.kind]}>
          <input className="rse-input" value={type.place.value} onChange={(e) => set({ place: { ...type.place, value: e.target.value } })} />
        </Field>
        <Resources type={type} set={set} locale={locale} />
        <Field label={w.capacity}>
          <input className="rse-input rse-narrow" type="number" min={1} max={500} value={type.capacity} onChange={(e) => set({ capacity: Math.max(1, Number(e.target.value) || 1) })} />
          <small className="rse-help">{w.capacityHint}</small>
        </Field>
        <fieldset className="rse-field rse-group">
          <legend>
            <label className="rse-switch">
              <input
                type="checkbox"
                role="switch"
                aria-checked={type.hours !== null}
                checked={type.hours !== null}
                onChange={(e) => set({ hours: e.target.checked ? (Object.fromEntries(WEEKDAYS.map((d) => [d, [{ from: '09:00', to: '18:00' }]])) as Schedule['weekly']) : null })}
              />
              <b>{w.ownHours}</b>
            </label>
          </legend>
          <p className="rse-help">{w.ownHoursHint}</p>
          {type.hours && <Week weekly={type.hours} onChange={(hours) => set({ hours })} locale={locale} />}
        </fieldset>
        <fieldset className="rse-field rse-group">
          <legend>{w.questions}</legend>
          {type.questions.map((q, i) => (
            <span key={q.id} className="rse-range">
              <input
                className="rse-input"
                value={q.label}
                aria-label={`${w.questions} ${i + 1}`}
                onChange={(e) => set({ questions: type.questions.map((x) => (x.id === q.id ? { ...x, label: e.target.value } : x)) })}
              />
              <select
                className="rse-input rse-narrow"
                value={q.kind}
                onChange={(e) => set({ questions: type.questions.map((x) => (x.id === q.id ? { ...x, kind: e.target.value as typeof q.kind } : x)) })}
              >
                {QUESTION_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {w.questionKinds[k]}
                  </option>
                ))}
              </select>
              <label className="rse-check">
                <input type="checkbox" checked={q.required} onChange={(e) => set({ questions: type.questions.map((x) => (x.id === q.id ? { ...x, required: e.target.checked } : x)) })} /> {w.required}
              </label>
              <button type="button" className="rse-icon" aria-label={w.remove} title={w.remove} onClick={() => set({ questions: type.questions.filter((x) => x.id !== q.id) })}>
                ×
              </button>
            </span>
          ))}
          {type.questions.length < 10 && (
            <button type="button" className="rse-action" onClick={() => set({ questions: [...type.questions, { id: newId(), label: '', kind: 'text', required: false }] })}>
              + {w.addQuestion}
            </button>
          )}
        </fieldset>
        <label className="rse-color">
          <input type="color" value={type.color} onChange={(e) => set({ color: e.target.value })} /> {w.color}
        </label>
      </section>
    </div>
  );
}

/** What is booked: the coming ones first, the soonest first; then the past and the cancelled. */
export function BookingList({
  bookings,
  types,
  locale = 'en',
  timeZone,
  now = Date.now(),
  className,
}: {
  bookings: Booking[];
  types: EventType[];
  locale?: Locale;
  timeZone: string;
  now?: number;
  className?: string;
}) {
  const w = WORDS[locale];
  const when = new Intl.DateTimeFormat(locale, { timeZone, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const coming = bookings.filter((b) => b.status === 'confirmed' && Date.parse(b.end) > now).sort((a, b) => a.start.localeCompare(b.start));
  const rest = bookings.filter((b) => !coming.includes(b)).sort((a, b) => b.start.localeCompare(a.start));
  const row = (b: Booking) => {
    const type = types.find((t) => t.id === b.type);
    return (
      <li key={b.id} className="rse-booking" data-cancelled={b.status === 'cancelled' || undefined}>
        <span className="rse-dot" style={{ background: type?.color ?? '#8f8f8f' }} />
        <span className="rse-booking-when">{upper(when.format(new Date(b.start)))}</span>
        <span className="rse-booking-who">
          <b>{b.name}</b> · {type?.title ?? b.type}
          {b.price && ` · ${formatMoney(b.price, locale)}`}
          {b.resource && ` · ${type?.resources.find((r) => r.id === b.resource)?.name ?? b.resource}`}
        </span>
        <a className="rse-link" href={`mailto:${b.email}`}>
          {b.email}
        </a>
        {b.status === 'cancelled' && <span className="rse-tag">{w.cancelled}</span>}
      </li>
    );
  };
  return (
    <div className={`rse${className ? ` ${className}` : ''}`}>
      <section className="rse-part">
        <h2>{w.upcoming}</h2>
        {coming.length ? <ul className="rse-bookings">{coming.map(row)}</ul> : <p className="rse-help">{w.noBookings}</p>}
        {rest.length > 0 && (
          <>
            <h3>{w.past}</h3>
            <ul className="rse-bookings">{rest.map(row)}</ul>
          </>
        )}
      </section>
    </div>
  );
}
