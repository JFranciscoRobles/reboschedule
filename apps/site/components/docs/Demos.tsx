'use client';

// The demos the pages of the documentation put among their words, each by the
// name a page gives it (`<demo name="widget" />`): a case of use with both of
// its sides, the widget alone and what it hands the app, the editors, and the
// engine saying the same times free in two time zones.

import '@reboschedule/react/styles.css';
import { type Booking, type EventType, sampleEventTypes, sampleSchedule, type Schedule, slotsByDay, slotsOf } from '@reboschedule/core';
import { BookingWidget, EventTypeEditor, ScheduleEditor } from '@reboschedule/react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { DemoRoom } from '@/components/DemoRoom';
import { HeadlessCourts } from '@/components/docs/HeadlessCourts';
import { useLocale, useT } from '@/components/i18n';
import { DemoStore } from '@/lib/demo';
import { type ScenarioId, scenarioOf } from '@/lib/scenarios';

/** The names of the demos that are a whole case of use. */
const CASES: ScenarioId[] = ['appointments', 'courts', 'rooms', 'shifts', 'classes', 'clinic', 'cabins', 'barber', 'tickets'];

const Frame = ({ children, note }: { children: ReactNode; note?: string }) => (
  <figure className="not-prose my-8">
    <div className="rounded-3xl border border-border bg-surface p-[clamp(8px,1.6vw,18px)]">{children}</div>
    {note && <figcaption className="mt-2.5 text-center text-sm text-muted">{note}</figcaption>}
  </figure>
);

/** Made in the browser only: its day is the reader's, and so is what it keeps. */
function useClient<T>(make: () => T): T | null {
  const [made, setMade] = useState<T | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: made once, when the page is in the browser.
  useEffect(() => setMade(make()), []);
  return made;
}

const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/** The widget alone, on the courts, and what `onBooked` hands the app, as it hands it. */
function WidgetDemo() {
  const locale = useLocale();
  const t = useT();
  const store = useClient(() => new DemoStore(`reboschedule-docs-widget-${locale}`, scenarioOf('courts')!.data(locale, zone()), locale));
  const [booked, setBooked] = useState<Booking | null>(null);
  if (!store) return <div className="h-[560px] animate-pulse rounded-2xl bg-white" />;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <BookingWidget endpoint={`demo:/s/${store.data.types[0].slug}`} fetch={store.fetch} locale={locale} onBooked={(b) => setBooked(b.booking)} />
      <div className="min-w-0 rounded-2xl bg-[#16181d] p-4 font-code text-[12.5px] leading-relaxed text-[#e7e7ea]">
        <p className="m-0 mb-2 font-text text-xs font-semibold uppercase tracking-wider text-[#9aa0aa]">onBooked({'{ booking }'})</p>
        <pre className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
          {booked ? JSON.stringify(booked, null, 2) : t({ en: '// Book a court to see it here.', es: '// Reserva una cancha para verla aquí.' })}
        </pre>
      </div>
    </div>
  );
}

/** A way of booking a court of one's own, on `useBooking` alone. */
function HeadlessDemo() {
  const locale = useLocale();
  const store = useClient(() => new DemoStore(`reboschedule-docs-headless-${locale}`, scenarioOf('courts')!.data(locale, zone()), locale));
  if (!store) return <div className="h-72 animate-pulse rounded-2xl bg-white" />;
  return <HeadlessCourts endpoint={`demo:/s/${store.data.types[0].slug}`} fetch={store.fetch} locale={locale} />;
}

/** The editor of a kind, on the courts: what it changes, as it changes. */
function EditorDemo() {
  const locale = useLocale();
  const [type, setType] = useState<EventType>(() => sampleEventTypes(locale).find((x) => x.id === 'court')!);
  return <EventTypeEditor type={type} onChange={setType} locale={locale} />;
}

function HoursDemo() {
  const locale = useLocale();
  const [schedule, setSchedule] = useState<Schedule>(() => sampleSchedule());
  return <ScheduleEditor schedule={schedule} onChange={setSchedule} locale={locale} />;
}

const ZONES = ['America/Tijuana', 'America/Mexico_City', 'America/New_York', 'America/Bogota', 'Europe/Madrid', 'Asia/Tokyo'];

/** The engine: the same times free of a call, as the owner's clock in Tijuana says them, and as whoever books says them in theirs. */
function SlotsDemo() {
  const locale = useLocale();
  const t = useT();
  const now = useClient(() => Date.now());
  const [visitor, setVisitor] = useState('Europe/Madrid');
  const call = useMemo(() => sampleEventTypes(locale)[0], [locale]);
  const schedule = useMemo(() => sampleSchedule('America/Tijuana'), []);
  if (now === null) return <div className="h-[300px] animate-pulse rounded-2xl bg-white" />;
  const free = slotsOf(call, schedule, { now }).slice(0, 12);
  const days = slotsByDay(free, visitor);
  const clock = (iso: string, tz: string) => new Intl.DateTimeFormat(locale, { timeZone: tz, weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  return (
    <div className="rounded-2xl bg-white p-4">
      <label className="flex flex-wrap items-center gap-3 text-sm font-semibold">
        {t({ en: 'Whoever books is in', es: 'Quien reserva está en' })}
        <select value={visitor} onChange={(e) => setVisitor(e.target.value)} className="rounded-lg border border-border-strong px-3 py-1.5 font-normal">
          {ZONES.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
      </label>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[460px] border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="py-2 pr-4 font-semibold">{t({ en: 'The owner, in Tijuana', es: 'Quien atiende, en Tijuana' })}</th>
              <th className="py-2 pr-4 font-semibold">
                {t({ en: 'Whoever books, in', es: 'Quien reserva, en' })} {visitor.split('/')[1]?.replace(/_/g, ' ')}
              </th>
              <th className="py-2 font-semibold">UTC</th>
            </tr>
          </thead>
          <tbody>
            {free.map((s) => (
              <tr key={s.start} className="border-t border-border">
                <td className="py-1.5 pr-4">{clock(s.start, 'America/Tijuana')}</td>
                <td className="py-1.5 pr-4 font-semibold text-brand">{clock(s.start, visitor)}</td>
                <td className="py-1.5 font-code text-xs text-muted">{s.start.slice(0, 16)}Z</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 mt-3 text-xs text-muted">
        {t({ en: 'Days for whoever books, by slotsByDay:', es: 'Días para quien reserva, con slotsByDay:' })} {[...days.keys()].join(', ')}
      </p>
    </div>
  );
}

export function Demo({ name }: { name: string }) {
  const locale = useLocale();
  const t = useT();
  if ((CASES as string[]).includes(name))
    return (
      <Frame note={t({ en: 'Kept in this browser. “Begin again” puts it back as it was.', es: 'Se guarda en este navegador. “Empezar de nuevo” lo deja como estaba.' })}>
        <DemoRoom id={name as ScenarioId} locale={locale} />
      </Frame>
    );
  if (name === 'widget')
    return (
      <Frame>
        <WidgetDemo />
      </Frame>
    );
  if (name === 'headless')
    return (
      <Frame note={t({ en: 'The same state as the widget, with nothing of its look: useBooking and Tailwind.', es: 'El mismo estado que el widget, sin nada de su aspecto: useBooking y Tailwind.' })}>
        <HeadlessDemo />
      </Frame>
    );
  if (name === 'editor')
    return (
      <Frame
        note={t({
          en: 'The courts as the sample has them: add a field, upload a picture, change a price.',
          es: 'Las canchas como las trae la muestra: agrega un campo, sube una imagen, cambia un precio.',
        })}
      >
        <EditorDemo />
      </Frame>
    );
  if (name === 'hours')
    return (
      <Frame>
        <HoursDemo />
      </Frame>
    );
  if (name === 'slots')
    return (
      <Frame>
        <SlotsDemo />
      </Frame>
    );
  return null;
}
