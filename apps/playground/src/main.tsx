// The playground: booking as a visitor does it, the owner's hours and kinds
// of appointment, and what is booked.

import '@reboschedule/react/styles.css';
import type { Booking, EventType, Schedule, Slot } from '@reboschedule/core';
import { BookingCalendar, type BookingDetails, BookingList, BookingPanel, BookingWidget, EventTypeEditor, ScheduleEditor } from '@reboschedule/react';
import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

type Tab = 'book' | 'hours' | 'types' | 'bookings' | 'calendar';

function Playground() {
  const [tab, setTab] = useState<Tab>('book');
  const [state, setState] = useState<{ schedule: Schedule; types: EventType[]; bookings: Booking[] }>();
  const [chosen, setChosen] = useState(0);
  // The kind the calendar shows; all of them when none.
  const [seen, setSeen] = useState('shift');
  // The gaps of the kind the calendar shows.
  const [gaps, setGaps] = useState<Slot[]>();
  // What the panel beside the calendar shows: a gap to give, or a booking to change, move or delete.
  const [panel, setPanel] = useState<{ slot: Slot } | { booking: string } | null>(null);
  const [moving, setMoving] = useState(false);
  const seenType = state?.types.find((t) => t.id === seen);
  const loadGaps = () => (seenType ? fetch(`/s/${seenType.slug}/slots`).then(async (r) => setGaps((await r.json()).slots)) : setGaps(undefined));
  // biome-ignore lint/correctness/useExhaustiveDependencies: asked again for each kind shown, and on each tab.
  useEffect(() => void loadGaps(), [seenType?.slug, tab]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const load = () => fetch('/api/state').then(async (r) => setState(await r.json()));
  // biome-ignore lint/correctness/useExhaustiveDependencies: asked again on each tab, for what was booked in the others.
  useEffect(() => void load(), [tab]);
  // Kept as it is written, once the writing stops.
  const keep = (path: string, body: unknown) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void fetch(path, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), 300);
  };
  if (!state) return null;
  const type = state.types[chosen];
  const refresh = () => Promise.all([load(), loadGaps()]);
  const close = () => (setPanel(null), setMoving(false));
  const problemsOf = async (answer: Response) => ((await answer.json()).problems ?? []).map((p: { message: string }) => p.message) as string[];
  // The booking being moved, to the gap chosen: kept if it is still free there.
  const move = async (slot: Slot) => {
    if (!panel || !('booking' in panel)) return;
    const answer = await fetch(`/api/bookings/${panel.booking}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ start: slot.start }) });
    if (answer.ok) setMoving(false);
    await refresh();
  };
  const side = () => {
    if (!panel) return null;
    if ('slot' in panel) {
      if (!seenType) return null;
      const { slot } = panel;
      return (
        <BookingPanel
          key={slot.start}
          type={seenType}
          slot={slot}
          timeZone={state.schedule.timeZone}
          locale="es"
          onClose={close}
          onSave={async (d: BookingDetails) => {
            const answer = await fetch(`/s/${seenType.slug}/book`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ ...d, start: slot.start, length: (Date.parse(slot.end) - Date.parse(slot.start)) / 60_000, timeZone: state.schedule.timeZone }),
            });
            if (!answer.ok) return problemsOf(answer);
            close();
            await refresh();
          }}
        />
      );
    }
    const booking = state.bookings.find((b) => b.id === panel.booking);
    const kind = booking && state.types.find((t) => t.id === booking.type);
    if (!booking || !kind) return null;
    return (
      <BookingPanel
        key={`${booking.id}${booking.start}`}
        type={kind}
        booking={booking}
        timeZone={state.schedule.timeZone}
        locale="es"
        moving={moving}
        onClose={close}
        onMove={setMoving}
        onSave={async (d: BookingDetails) => {
          const answer = await fetch(`/api/bookings/${booking.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) });
          if (!answer.ok) return problemsOf(answer);
          close();
          await refresh();
        }}
        onDelete={async () => {
          await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE' });
          close();
          await refresh();
        }}
      />
    );
  };
  const button = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        border: 0,
        font: 'inherit',
        fontWeight: 700,
        cursor: 'pointer',
        background: tab === id ? '#292929' : 'transparent',
        color: tab === id ? '#fff' : 'inherit',
      }}
    >
      {label}
    </button>
  );
  const chips = (of: { id: string; title: string; color: string }[], on: (id: string) => boolean, choose: (id: string) => void) => (
    <p style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '0 0 14px' }}>
      {of.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => choose(t.id)}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: `2px solid ${t.color}`,
            background: on(t.id) ? t.color : 'transparent',
            color: on(t.id) ? '#fff' : 'inherit',
            font: 'inherit',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {t.title}
        </button>
      ))}
    </p>
  );
  const pick = chips(
    state.types,
    (id) => id === type.id,
    (id) => setChosen(state.types.findIndex((t) => t.id === id)),
  );
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 18 }}>
        <b style={{ fontSize: 20, marginRight: 'auto' }}>ReboSchedule</b>
        {button('book', 'Reservar')}
        {button('hours', 'Horario')}
        {button('types', 'Tipos de reserva')}
        {button('calendar', 'Calendario')}
        {button('bookings', `Citas (${state.bookings.filter((b) => b.status === 'confirmed').length})`)}
      </header>
      {tab === 'book' && (
        <>
          {pick}
          <BookingWidget key={type.id} endpoint={`/s/${type.slug}`} locale="es" onBooked={() => void load()} />
        </>
      )}
      {tab === 'hours' && <ScheduleEditor schedule={state.schedule} locale="es" onChange={(schedule) => (setState({ ...state, schedule }), keep('/api/schedule', schedule))} />}
      {tab === 'types' && (
        <>
          {pick}
          <EventTypeEditor
            key={type.id}
            type={type}
            locale="es"
            onChange={(t) => {
              const types = state.types.map((x, i) => (i === chosen ? t : x));
              setState({ ...state, types });
              keep('/api/types', types);
            }}
          />
        </>
      )}
      {tab === 'calendar' && (
        <>
          {chips([...state.types, { id: '', title: 'Todas', color: '#292929' }], (id) => id === seen, setSeen)}
          {panel && <div style={{ position: 'sticky', top: 12, zIndex: 2, marginBottom: 14 }}>{side()}</div>}
          <BookingCalendar
            bookings={state.bookings}
            types={state.types}
            schedule={state.schedule}
            type={seen || undefined}
            slots={seen ? gaps : undefined}
            selected={panel && 'booking' in panel ? panel.booking : undefined}
            moving={moving}
            onPick={(slot) => (moving ? void move(slot) : (setPanel({ slot }), setMoving(false)))}
            onSelect={(b) => (setPanel({ booking: b.id }), setMoving(false))}
            locale="es"
          />
        </>
      )}
      {tab === 'bookings' && <BookingList bookings={state.bookings} types={state.types} locale="es" timeZone={state.schedule.timeZone} />}
    </div>
  );
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
