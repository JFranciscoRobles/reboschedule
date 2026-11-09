'use client';

// What the designs of the demos share: what each is given (the demo's server
// in the page, the language, who to tell of a booking), how a time and a day
// are said, and the questions of a kind, each design drawing them its way.

import type { Booking, EventType, Locale } from '@reboschedule/core';
import type { Booked } from '@reboschedule/react';
import type { ReactNode } from 'react';
import type { DemoStore } from '@/lib/demo';

export interface DesignProps {
  store: DemoStore;
  locale: Locale;
  /** Told each booking made, for the word that it was. */
  onBooked: (booking: Booking) => void;
}

/** The routes of a kind, in the demo's server of the page. */
export const endpointOf = (type: EventType) => `demo:/s/${type.slug}`;

/** How times and days are said, in a language and a time zone. */
export function formats(locale: Locale, timeZone: string) {
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, o);
  const time = f({ timeZone, hour: 'numeric', minute: '2-digit' });
  const utc = (day: string) => new Date(`${day}T12:00:00Z`);
  return {
    time: (iso: string | number) => time.format(new Date(iso)),
    weekday: (day: string) => f({ weekday: 'short', timeZone: 'UTC' }).format(utc(day)),
    dayNumber: (day: string) => Number(day.slice(8)),
    month: (day: string) => f({ month: 'short', timeZone: 'UTC' }).format(utc(day)),
    long: (day: string) => f({ weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(utc(day)),
    when: (iso: string) => f({ timeZone, weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)),
  };
}

/** What is filled in to book: who, and the answers to what the kind asks. */
export interface Filled {
  name: string;
  email: string;
  answers: Record<string, string>;
}
export const empty = (): Filled => ({ name: '', email: '', answers: {} });

/** The fields of who books and of what is asked, drawn with the classes a design gives them. */
export function Fields({ type, value, onChange, input, label, locale }: { type: EventType; value: Filled; onChange: (f: Filled) => void; input: string; label?: string; locale: Locale }) {
  const es = locale === 'es';
  const field = (key: string, text: string, control: ReactNode) => (
    // biome-ignore lint/a11y/noLabelWithoutControl: its control is the one given, inside it.
    <label key={key} className={label ? 'flex flex-col gap-1' : 'contents'}>
      {label && <span className={label}>{text}</span>}
      {control}
    </label>
  );
  return (
    <>
      {field(
        'name',
        es ? 'Nombre' : 'Name',
        <input
          required
          className={input}
          placeholder={label ? undefined : es ? 'Nombre' : 'Name'}
          autoComplete="name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />,
      )}
      {field(
        'email',
        es ? 'Correo' : 'Email',
        <input
          required
          type="email"
          className={input}
          placeholder={label ? undefined : es ? 'Correo' : 'Email'}
          autoComplete="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />,
      )}
      {type.questions.map((q) =>
        field(
          q.id,
          `${q.label}${q.required ? ' *' : ''}`,
          q.kind === 'long' ? (
            <textarea
              rows={2}
              required={q.required}
              className={input}
              placeholder={label ? undefined : q.label}
              value={value.answers[q.id] ?? ''}
              onChange={(e) => onChange({ ...value, answers: { ...value.answers, [q.id]: e.target.value } })}
            />
          ) : (
            <input
              required={q.required}
              type={q.kind === 'phone' ? 'tel' : 'text'}
              className={input}
              placeholder={label ? undefined : q.label}
              value={value.answers[q.id] ?? ''}
              onChange={(e) => onChange({ ...value, answers: { ...value.answers, [q.id]: e.target.value } })}
            />
          ),
        ),
      )}
    </>
  );
}

/** The booking made, told to the demo, given back. */
export const told = (onBooked: (b: Booking) => void) => (booked: Booked) => onBooked(booked.booking);

/** A discount's code, as each design draws it: written, and said whether it is good. */
export function CouponField({
  value,
  onChange,
  applied,
  off,
  locale,
  input,
  good,
}: {
  value: string;
  onChange: (code: string) => void;
  applied: { label: string } | null;
  off: number;
  locale: Locale;
  input: string;
  good: string;
}) {
  const es = locale === 'es';
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={es ? 'Código de descuento' : 'Discount code'}
        className={`w-full uppercase ${input}`}
        aria-label={es ? 'Código de descuento' : 'Discount code'}
      />
      {value.trim() && (
        <p className={`m-0 mt-1 text-xs ${applied ? good : 'opacity-70'}`}>
          {applied ? `✓ ${applied.label}${off ? '' : es ? ' · no aplica a esto' : ' · not for this one'}` : es ? 'Ese código no existe.' : 'No such code.'}
        </p>
      )}
    </div>
  );
}
