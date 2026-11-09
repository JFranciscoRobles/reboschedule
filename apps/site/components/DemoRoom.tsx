'use client';

// A demo, both sides of it: whoever books, with the widget as they would find
// it, and whoever looks after it, with the month and its gaps, the panel to
// give one away, change who has it, move it or delete it. The same bookings
// behind both, kept in this browser: what is booked on one side is seen on
// the other at once, and a word says so.

import '@reboschedule/react/styles.css';
import { type Booking, type EventType, phoneOfBooking, priceOf, type Slot, shortOf } from '@reboschedule/core';
import { ManageBooking } from './designs/ManageBooking';
import { Qr } from './designs/Qr';
import { ReportView } from './designs/ReportView';
import { type Booked, BookingCalendar, BookingDay, BookingPanel, BookingWeek, BookingWidget, EventTypeEditor } from '@reboschedule/react';
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { BarberShop } from '@/components/designs/BarberShop';
import { BoxOffice } from '@/components/designs/BoxOffice';
import { BoxOfficeAdmin } from '@/components/designs/BoxOfficeAdmin';
import { CabinStay } from '@/components/designs/CabinStay';
import { ClassStudio } from '@/components/designs/ClassStudio';
import { ClinicWizard } from '@/components/designs/ClinicWizard';
import { Concierge } from '@/components/designs/Concierge';
import { CourtBoard } from '@/components/designs/CourtBoard';
import { RoomFinder } from '@/components/designs/RoomFinder';
import type { DesignProps } from '@/components/designs/shared';
import { StayTape } from '@/components/designs/StayTape';
import { RosterAdmin } from '@/components/designs/RosterAdmin';
import { RosterMember } from '@/components/designs/RosterMember';
import { DemoStore } from '@/lib/demo';
import { type Locale, translator } from '@/lib/i18n';
import { type ScenarioId, scenarioOf } from '@/lib/scenarios';

type Side = 'visitor' | 'owner' | 'notices' | 'report';

export function DemoRoom({ id, locale }: { id: ScenarioId; locale: Locale }) {
  const t = translator(locale);
  const scenario = scenarioOf(id)!;
  // Made in the browser only: what it has is kept there, and today is the visitor's. The `v4` of its key leaves
  // behind what was kept of demos older than this one.
  const [store, setStore] = useState<DemoStore | null>(null);
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    setStore(new DemoStore(`reboschedule-demo-v4-${id}-${locale}`, scenario.data(locale, timeZone), locale));
  }, [id, locale, scenario]);

  const [side, setSide] = useState<Side>('visitor');
  // What was booked on the visitor's side since the owner's was last seen.
  const [fresh, setFresh] = useState<Booking[]>([]);
  const [toast, setToast] = useState<Booking | null>(null);
  const [selected, setSelected] = useState<string | undefined>();

  if (!store) return <div className="h-[640px] animate-pulse rounded-3xl bg-surface" aria-busy="true" />;

  const look = (b?: Booking) => {
    setSide('owner');
    setFresh([]);
    setToast(null);
    setSelected(b?.id);
  };

  const tab = (value: Side, label: string, count = 0) => (
    <button
      type="button"
      role="tab"
      aria-selected={side === value}
      onClick={() => (value === 'owner' ? look() : setSide(value))}
      className="relative flex-1 rounded-[10px] px-4 py-2 text-[15px] font-semibold text-ink-soft transition-all aria-selected:bg-white aria-selected:text-ink aria-selected:shadow-[0_1px_3px_rgba(0,0,0,0.16)] sm:flex-none"
    >
      {label}
      {count > 0 && <span className="ml-2 inline-grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">{count}</span>}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label={t({ en: 'Whose side', es: 'De qué lado' })} className="flex w-full gap-1 rounded-xl bg-hover p-1 sm:w-auto">
          {tab('visitor', t(scenario.visitor))}
          {tab('owner', t(scenario.owner), fresh.length)}
          {tab('notices', t({ en: 'Messages', es: 'Avisos' }), store.notices.length)}
          {tab('report', t({ en: 'Reports', es: 'Reportes' }))}
        </div>
        <button
          type="button"
          onClick={() => {
            store.reset();
            setFresh([]);
            setSelected(undefined);
          }}
          className="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-hover hover:text-ink"
        >
          ↺ {t({ en: 'Begin again', es: 'Empezar de nuevo' })}
        </button>
      </div>

      <div className="demo-room mt-5 animate-enter" key={side} style={{ '--demo-accent': scenario.color } as CSSProperties}>
        {side === 'visitor' ? (
          <Visitor
            id={id}
            store={store}
            locale={locale}
            onBooked={(b) => {
              setFresh((f) => [...f, b]);
              setToast(b);
            }}
          />
        ) : side === 'owner' ? (
          store.data.roster ? (
            <RosterAdmin store={store} locale={locale} />
          ) : id === 'cabins' ? (
            <StayTape store={store} locale={locale} />
          ) : id === 'tickets' ? (
            <BoxOfficeAdmin store={store} locale={locale} />
          ) : (
            <Owner store={store} locale={locale} selected={selected} onSelected={setSelected} />
          )
        ) : side === 'report' ? (
          <ReportView store={store} locale={locale} />
        ) : (
          <Notices store={store} locale={locale} />
        )}
      </div>

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-5 z-40 mx-auto flex max-w-[520px] animate-enter items-center gap-3 rounded-2xl bg-ink px-5 py-4 text-white shadow-menu">
          <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[#22c55e] text-sm font-bold">✓</span>
          <span className="mr-auto text-[15px]">{t({ en: `${toast.name} is booked.`, es: `${toast.name} quedó reservado.` })}</span>
          <button type="button" onClick={() => look(toast)} className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/25">
            {t({ en: `See it as ${t(scenario.owner).toLowerCase()}`, es: `Verlo como ${t(scenario.owner).toLowerCase()}` })} →
          </button>
          <button type="button" aria-label={t({ en: 'Close', es: 'Cerrar' })} onClick={() => setToast(null)} className="px-1 text-white/70 hover:text-white">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

/** The kinds of a demo to choose from, when it has more than one. */
function Kinds({ types, chosen, onChoose, all }: { types: EventType[]; chosen: string; onChoose: (id: string) => void; all?: string }) {
  if (types.length < 2) return null;
  const of = [...types.map((t) => ({ id: t.id, title: t.title, color: t.color })), ...(all ? [{ id: '', title: all, color: '#16181d' }] : [])];
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {of.map((k) => (
        <button
          key={k.id}
          type="button"
          aria-pressed={chosen === k.id}
          onClick={() => onChoose(k.id)}
          className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-ink/30 aria-pressed:border-transparent aria-pressed:bg-ink aria-pressed:text-white"
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: k.color }} />
          {k.title}
        </button>
      ))}
    </div>
  );
}

/** Each case's own way of booking, drawn on `useBooking` alone. */
const DESIGNS: Record<ScenarioId, (props: DesignProps) => ReactNode> = {
  appointments: Concierge,
  courts: CourtBoard,
  rooms: RoomFinder,
  shifts: RosterMember,
  classes: ClassStudio,
  clinic: ClinicWizard,
  cabins: CabinStay,
  barber: BarberShop,
  tickets: BoxOffice,
};

function Visitor({ id, store, locale, onBooked }: { id: ScenarioId; store: DemoStore; locale: Locale; onBooked: (b: Booking) => void }) {
  const t = translator(locale);
  const { types } = store.data;
  const [chosen, setChosen] = useState(types[0].id);
  // The case's own design, or the package's widget, to see they are one state.
  const [design, setDesign] = useState<'own' | 'widget'>('own');
  const type = types.find((x) => x.id === chosen) ?? types[0];
  const Design = DESIGNS[id];
  return (
    <div>
      <div className={`mb-4 flex flex-wrap items-center justify-center gap-2 text-sm ${store.data.roster || id === 'cabins' ? 'hidden' : ''}`}>
        <span className="text-muted">{t({ en: 'Drawn with', es: 'Dibujado con' })}</span>
        <div className="flex gap-1 rounded-xl bg-hover p-1">
          {(
            [
              ['own', t({ en: 'its own design (headless)', es: 'su propio diseño (headless)' })],
              ['widget', t({ en: 'the package’s widget', es: 'el widget del paquete' })],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={design === value}
              onClick={() => setDesign(value)}
              className="cursor-pointer rounded-[9px] px-3 py-1.5 font-semibold text-ink-soft aria-pressed:bg-white aria-pressed:text-ink aria-pressed:shadow-[0_1px_3px_rgba(0,0,0,0.16)]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {design === 'own' ? (
        <div className="mx-auto max-w-[1040px]">
          <Design store={store} locale={locale} onBooked={onBooked} />
        </div>
      ) : (
        <div className="mx-auto max-w-[860px]">
          <Kinds types={types} chosen={chosen} onChoose={setChosen} />
          <BookingWidget key={type.id} endpoint={`demo:/s/${type.slug}`} fetch={store.fetch} locale={locale} onBooked={(b: Booked) => onBooked(b.booking)} />
        </div>
      )}
    </div>
  );
}

function Owner({ store, locale, selected, onSelected }: { store: DemoStore; locale: Locale; selected?: string; onSelected: (id?: string) => void }) {
  const t = translator(locale);
  useSyncExternalStore(
    store.subscribe,
    () => store.version,
    () => 0,
  );
  const { types, schedule } = store.data;
  // Kinds that share their resources (a barbershop's services) are seen as the first: the others' bookings fall in its columns.
  const shared = types.length > 1 && types[0].resources.length > 0 && types.every((x) => x.resources.map((r) => r.id).join() === types[0].resources.map((r) => r.id).join());
  const [seen, setSeen] = useState(types.length > 1 && !shared ? '' : types[0].id);
  // Things booked (courts, rooms), and an owner with a calendar of their own, are seen by the day; the rest, by the month.
  const [view, setView] = useState<'month' | 'week' | 'day' | 'settings'>(types.some((x) => x.resources.length) || store.data.away ? 'day' : 'month');
  const [day, setDay] = useState<string | undefined>();
  const [gap, setGap] = useState<{ slot: Slot; type: EventType } | null>(null);
  const [moving, setMoving] = useState(false);
  const [note, setNote] = useState('');
  const type = types.find((x) => x.id === seen);
  const booking = selected ? store.bookings.find((b) => b.id === selected && b.status === 'confirmed') : undefined;
  const bookingType = booking && store.typeOf(booking.type);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the gaps change as what is booked does.
  const slots = useMemo(() => (type ? store.slots(type) : undefined), [type, store.version]);
  // A booking chosen elsewhere (from the word that it was booked) shows the kind it is of, and its day.
  useEffect(() => {
    if (bookingType && seen && bookingType.id !== seen) setSeen(bookingType.id);
  }, [bookingType, seen]);
  const bookingDay = booking ? new Date(booking.start).toLocaleDateString('en-CA', { timeZone: schedule.timeZone }) : undefined;
  // biome-ignore lint/correctness/useExhaustiveDependencies: only when another booking is chosen.
  useEffect(() => {
    if (bookingDay) setDay(bookingDay);
  }, [booking?.id]);

  const close = () => {
    onSelected(undefined);
    setGap(null);
    setMoving(false);
    setNote('');
  };
  const say = (text: string) => {
    setNote(text);
    setTimeout(() => setNote(''), 2600);
  };

  const select = (b: Booking) => {
    setGap(null);
    setMoving(false);
    onSelected(b.id);
  };
  const pick = (slot: Slot) => {
    if (moving && booking) {
      if (store.move(booking.id, slot.start)) {
        setMoving(false);
        say(t({ en: 'Moved.', es: 'Movida.' }));
      } else say(t({ en: 'That gap is no longer free.', es: 'Ese hueco ya no está libre.' }));
      return;
    }
    if (type) {
      onSelected(undefined);
      // Priced as the very resource chosen (a column of the day), not the first free.
      const length = (Date.parse(slot.end) - Date.parse(slot.start)) / 60_000;
      setGap({ slot: { ...slot, price: priceOf(type, { resource: slot.resources?.[0] ?? '', start: slot.start, length }, store.data.quote) }, type });
    }
  };

  let panel = null;
  if (booking && bookingType)
    panel = (
      <BookingPanel
        key={`${booking.id}${booking.start}`}
        type={bookingType}
        booking={booking}
        timeZone={schedule.timeZone}
        locale={locale}
        moving={moving}
        onMove={setMoving}
        onClose={close}
        onSave={(d) => {
          const problems = store.change(booking.id, d);
          if (problems) return problems;
          say(t({ en: 'Saved.', es: 'Guardado.' }));
          close();
        }}
        onAttend={(a) => store.attend(booking.id, a)}
        onDelete={(scope) => {
          store.remove(booking.id, scope);
          close();
          say(t({ en: 'Deleted: the place is free again.', es: 'Eliminada: el lugar quedó libre.' }));
        }}
      />
    );
  else if (gap)
    panel = (
      <BookingPanel
        key={gap.slot.start}
        type={gap.type}
        slot={gap.slot}
        timeZone={schedule.timeZone}
        locale={locale}
        onClose={close}
        onPlan={(repeat) =>
          store.plan(gap.type, gap.slot.start, repeat, {
            length: (Date.parse(gap.slot.end) - Date.parse(gap.slot.start)) / 60_000,
            resource: gap.slot.resources?.length === 1 ? gap.slot.resources[0] : undefined,
            owner: true,
          })
        }
        onSave={(d) => {
          const done = store.book(gap.type, { ...d, start: gap.slot.start, length: (Date.parse(gap.slot.end) - Date.parse(gap.slot.start)) / 60_000, timeZone: schedule.timeZone }, { owner: true });
          if (done.problems) return done.problems.map((p) => p.message);
          close();
          onSelected(done.booking.id);
          const n = done.series?.length ?? 1;
          say(
            n > 1
              ? t({ en: `Given to ${done.booking.name}, ${n} weeks.`, es: `Apartado para ${done.booking.name}, ${n} semanas.` })
              : t({ en: `Given to ${done.booking.name}.`, es: `Apartado para ${done.booking.name}.` }),
          );
        }}
      />
    );

  return (
    <div>
      {store.data.away && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
          <span className="grid size-9 place-items-center rounded-lg bg-[#e8f0fe] text-lg" aria-hidden="true">
            📅
          </span>
          <span className="mr-auto min-w-0 text-sm">
            <b className="block">Google Calendar · {store.data.organizer.name}</b>
            <span className="text-muted">
              {store.connected
                ? t({ en: `Read by its secret iCal address: ${store.away().length} events busy.`, es: `Leído por su dirección iCal secreta: ${store.away().length} eventos ocupados.` })
                : t({ en: 'Not connected: its hours are offered to patients.', es: 'Sin conectar: sus horas se ofrecen a los pacientes.' })}
            </span>
          </span>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              role="switch"
              aria-checked={store.connected}
              checked={store.connected}
              onChange={(e) => store.connect(e.target.checked)}
              className="size-4 accent-[var(--demo-accent)]"
            />
            {store.connected ? t({ en: 'Connected', es: 'Conectado' }) : t({ en: 'Connect', es: 'Conectar' })}
          </label>
        </div>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <Kinds types={types} chosen={seen} onChoose={(id) => (setSeen(id), close())} all={shared ? undefined : t({ en: 'All', es: 'Todas' })} />
        <div className="mb-4 ml-auto flex gap-1 rounded-xl bg-hover p-1">
          {(['month', 'week', 'day', 'settings'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className="rounded-[9px] px-3.5 py-1.5 text-sm font-semibold text-ink-soft aria-pressed:bg-white aria-pressed:text-ink aria-pressed:shadow-[0_1px_3px_rgba(0,0,0,0.16)]"
            >
              {v === 'month' ? t({ en: 'Month', es: 'Mes' }) : v === 'week' ? t({ en: 'Week', es: 'Semana' }) : v === 'day' ? t({ en: 'Day', es: 'Día' }) : `⚙ ${t({ en: 'Settings', es: 'Ajustes' })}`}
            </button>
          ))}
        </div>
      </div>
      {!type && types.length > 1 && (
        <p className="mb-4 text-sm text-muted">{t({ en: 'Choose one kind to see its gaps and give them away.', es: 'Elige un tipo para ver sus huecos y apartarlos.' })}</p>
      )}
      {(panel || note) && view !== 'settings' && (
        <div className="sticky top-[76px] z-20 mb-4">
          {panel}
          {note && !panel && (
            <p role="status" className="animate-enter rounded-2xl bg-pastel-green px-5 py-3 font-semibold text-pastel-green-fg">
              {note}
            </p>
          )}
        </div>
      )}
      {view === 'settings' ? (
        <>
          <p className="mb-4 text-sm text-muted">
            {t({
              en: 'What you change here is what whoever books sees: add a field, upload a picture, and go back to their side.',
              es: 'Lo que cambies aquí es lo que ve quien reserva: agrega un campo, sube una imagen, y vuelve a su lado.',
            })}
          </p>
          <EventTypeEditor key={(type ?? types[0]).id} type={type ?? types[0]} locale={locale} onChange={(next) => store.setType(next)} />
        </>
      ) : view === 'month' ? (
        <BookingCalendar
          key={type?.id ?? 'all'}
          bookings={store.bookings}
          types={types}
          schedule={schedule}
          type={type?.id}
          slots={slots}
          selected={booking?.id}
          moving={moving}
          locale={locale}
          onSelect={select}
          onPick={pick}
          onDay={(d) => (setDay(d), setView('day'))}
        />
      ) : view === 'week' ? (
        <BookingWeek
          key={type?.id ?? 'all'}
          bookings={store.bookings}
          types={types}
          schedule={schedule}
          type={type?.id}
          day={day}
          onDay={setDay}
          slots={slots}
          selected={booking?.id}
          locale={locale}
          onSelect={select}
          onPick={pick}
        />
      ) : (
        <BookingDay
          bookings={store.bookings}
          types={types}
          schedule={schedule}
          type={type?.id}
          day={day}
          onDay={setDay}
          slots={slots}
          selected={booking?.id}
          moving={moving}
          locale={locale}
          onSelect={select}
          onPick={pick}
          away={store.away()}
        />
      )}
    </div>
  );
}

/** The messages whoever booked would have been sent, as the app would send them through its own provider: the newest first. */
function Notices({ store, locale }: { store: DemoStore; locale: Locale }) {
  const t = translator(locale);
  useSyncExternalStore(
    store.subscribe,
    () => store.version,
    () => 0,
  );
  const [open, setOpen] = useState(0);
  if (!store.notices.length)
    return (
      <p className="mx-auto max-w-[520px] rounded-2xl bg-surface px-6 py-10 text-center text-muted">
        {t({
          en: 'Nothing sent yet. Book, move, change or delete a booking: the message whoever booked would get appears here, its invitation attached.',
          es: 'Todavía no sale nada. Reserva, mueve, cambia o elimina una reserva: aquí aparece el aviso que le llegaría a quien reservó, con su invitación adjunta.',
        })}
      </p>
    );
  const badge: Record<string, string> = {
    booked: 'bg-pastel-green text-pastel-green-fg',
    moved: 'bg-pastel-blue text-pastel-blue-fg',
    changed: 'bg-pastel-yellow text-pastel-yellow-fg',
    cancelled: 'bg-pastel-pink text-pastel-pink-fg',
    reminder: 'bg-pastel-blue text-pastel-blue-fg',
    offered: 'bg-pastel-yellow text-pastel-yellow-fg',
  };
  const kind = (k: string) =>
    t({
      en: { offered: 'place free', reminder: 'reminder' }[k] ?? k,
      es: { booked: 'confirmada', moved: 'movida', changed: 'actualizada', cancelled: 'cancelada', reminder: 'recordatorio', offered: 'lugar libre' }[k] ?? k,
    });
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <ul className="m-0 flex max-h-[560px] list-none flex-col gap-1.5 overflow-y-auto p-0">
        {store.notices.map((n, i) => (
          <li key={'waiting' in n ? `${n.waiting.id}offered` : `${n.booking.id}${n.kind}${n.booking.sequence ?? 0}`}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className={`w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition ${open === i ? 'border-ink bg-white' : 'border-line bg-surface hover:bg-white'}`}
            >
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge[n.kind]}`}>{kind(n.kind)}</span>
              <span className="mt-1.5 block truncate text-sm font-semibold">{n.subject}</span>
              <span className="block truncate text-xs text-muted">{n.to.email}</span>
            </button>
          </li>
        ))}
      </ul>
      {store.notices[open] && <Message notice={store.notices[open]} store={store} locale={locale} />}
    </div>
  );
}

function Message({ notice, store, locale }: { notice: DemoStore['notices'][number]; store: DemoStore; locale: Locale }) {
  const t = translator(locale);
  const [managing, setManaging] = useState<string | null>(null);
  // Its entry code, when it carries one; and its short message, to their phone or to one they would leave.
  const ticket = notice.text.match(/RS1\.[\w-]+\.[\w-]+/)?.[0];
  const kind = store.typeOf('booking' in notice ? notice.booking.type : notice.waiting.type);
  const phone = 'booking' in notice && kind ? phoneOfBooking(notice.booking, kind) : null;
  const short = kind
    ? shortOf(notice, kind, store.data.organizer, { locale, phone: phone ?? '+52 664 000 0000', link: 'manage' in notice ? notice.manage : 'https://…', timeZone: store.data.schedule.timeZone })
    : null;
  return (
    <article className="min-w-0 rounded-2xl border border-line bg-white">
      <header className="border-b border-line px-5 py-4 text-sm">
        <p className="m-0 text-muted">
          {t({ en: 'To', es: 'Para' })}: <b className="text-ink">{notice.to.name}</b> &lt;{notice.to.email}&gt;
        </p>
        <p className="m-0 mt-1 font-display text-lg font-bold">{notice.subject}</p>
      </header>
      <div className="grid gap-4 px-5 py-4 xl:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <pre className="m-0 whitespace-pre-wrap font-text text-[15px] leading-relaxed text-ink-soft">{notice.text}</pre>
          {ticket && (
            <div className="mt-3 inline-flex items-center gap-3 rounded-xl border border-line p-2 pr-4 text-sm">
              <Qr text={ticket} size={88} />
              <span>
                <b className="block">{t({ en: 'Attached: the QR', es: 'Adjunto: el QR' })}</b>
                <span className="text-muted">{t({ en: 'shown at the door, read once', es: 'se muestra en la entrada, se lee una vez' })}</span>
              </span>
            </div>
          )}
        </div>
        {/* The same, as a short message to their phone. */}
        {short && (
          <div className="self-start rounded-2xl bg-[#e7ded3] p-3">
            <p className="m-0 mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#3b3b3b]">
              <span className="grid size-5 place-items-center rounded-full bg-[#25d366] text-[10px] text-white">✆</span>
              WhatsApp · {short.to}
              {!phone && <span className="font-normal text-[#6b6b6b]">({t({ en: 'if they leave it', es: 'si lo deja' })})</span>}
            </p>
            <p className="m-0 rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[13px] leading-snug text-[#111] shadow-sm">{short.text}</p>
            <p className="m-0 mt-1.5 text-[11px] text-[#6b6b6b]">
              {t({ en: 'Template', es: 'Plantilla' })}: <span className="font-code">{short.template.name}</span>
            </p>
          </div>
        )}
      </div>
      <footer className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3 text-sm">
        {'ics' in notice && (
          <>
            <a href={`data:text/calendar;charset=utf-8,${encodeURIComponent(notice.ics)}`} download="invite.ics" className="rounded-lg border border-line px-3 py-1.5 font-semibold hover:bg-hover">
              📎 invite.ics
            </a>
            <span className="font-code text-xs text-muted">
              text/calendar; method={notice.method} · SEQUENCE:{notice.booking.sequence ?? (notice.method === 'CANCEL' ? 1 : 0)}
            </span>
          </>
        )}
        {'manage' in notice && notice.manage && (
          <button type="button" onClick={() => setManaging(notice.manage ?? null)} className="rounded-lg bg-ink px-3 py-1.5 font-semibold text-white">
            {t({ en: 'Open my booking', es: 'Abrir mi reserva' })}
          </button>
        )}
        {managing && <ManageBooking address={managing} store={store} locale={locale} onClose={() => setManaging(null)} />}
        <span className="ml-auto text-xs text-muted">{t({ en: 'Sent by your app, with its own provider.', es: 'Lo manda tu aplicación, con su propio proveedor.' })}</span>
      </footer>
    </article>
  );
}
