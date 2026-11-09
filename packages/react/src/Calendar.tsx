// What is booked, as a month shows it: each day and who has it. A kind given
// in turns that do not overlap (the shifts of an office) shows each day its
// turns, the first and the second, with the names of who took each
// and the places still free; any other, or all of them, shows each day its
// bookings, the time and the name. Given the times still free (as the
// server's `/slots` says them), it shows the gaps too: each place free of a
// turn, and each day how many times it has free, opened below; each one
// chosen to book it from there. In the owner's time zone, as their hours are
// said.

import type { Booking, EventType, Locale, Schedule, Slot } from '@reboschedule/core';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { WORDS } from './i18n';
import { type MonthDay, useMonth } from './useCalendar';

export interface BookingCalendarProps {
  bookings: Booking[];
  types: EventType[];
  schedule: Schedule;
  /** The id of the kind shown; all of them unless said. */
  type?: string;
  locale?: Locale;
  /** Now, as milliseconds: which day is today, which are past. */
  now?: number;
  /** Told the booking clicked, to show it or to cancel it. */
  onSelect?: (booking: Booking) => void;
  /** The times still free of the kind shown, as its `/slots` gives them: the gaps, shown. */
  slots?: Slot[];
  /** Told a gap chosen, to book it: someone to a shift, a court for someone; or where the booking being moved goes. */
  onPick?: (slot: Slot) => void;
  /** The id of the booking shown beside it, marked. */
  selected?: string;
  /** Whether a booking is being moved: the gaps are where it may go. */
  moving?: boolean;
  /** Told a day's number clicked, to show that day alone. */
  onDay?: (day: string) => void;
  className?: string;
}

/** Words as a title begins them. */
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** How many a day shows of a kind not in turns, before `+N`. */
const MOST = 3;

export function BookingCalendar({ bookings, types, schedule, type: only, locale = 'en', now = Date.now(), onSelect, slots, onPick, selected, moving, onDay, className }: BookingCalendarProps) {
  const w = WORDS[locale];
  const m = useMonth({ bookings, types, schedule, type: only, slots, now });
  const { month, today, kind, firstGap, ahead } = m;
  // The days opened to show all they have.
  const [open, setOpen] = useState<string[]>([]);
  // The day whose gaps are shown below.
  const [chosen, setChosen] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  // Below a long month (a phone's), the gaps chosen are brought into sight.
  useEffect(() => {
    if (chosen) panel.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [chosen]);
  const places = kind ? Math.max(1, kind.capacity) * Math.max(1, kind.resources.length) : 1;
  // The day gone to, marked a moment.
  const [flash, setFlash] = useState<string | null>(null);
  const goToGap = () => {
    if (!firstGap) return;
    m.setMonth(firstGap.slice(0, 7));
    if (!m.inTurns) setChosen(firstGap);
    setFlash(firstGap);
    setTimeout(() => setFlash(null), 1600);
  };
  const days = m.weeks.flat();
  const chosenGaps = days.find((d) => d?.day === chosen)?.gaps ?? [];

  const clock = new Intl.DateTimeFormat(locale, { timeZone: schedule.timeZone, hour: 'numeric', minute: '2-digit' });
  const utc = (d: string) => new Date(`${d}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const monthName = upper(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(utc(`${month}-15`)));
  const typeOf = (b: Booking) => types.find((t) => t.id === b.type);
  const resourceOf = (b: Booking) => typeOf(b)?.resources.find((r) => r.id === b.resource)?.name;

  const name = (b: Booking) => (
    <button
      key={b.id}
      type="button"
      className="rsc-name"
      aria-current={b.id === selected || undefined}
      style={{ '--rsc-color': typeOf(b)?.color ?? '#8f8f8f' } as CSSProperties}
      title={[b.name, b.email, resourceOf(b)].filter(Boolean).join(' · ')}
      onClick={() => onSelect?.(b)}
    >
      {b.series ? '↻ ' : ''}
      {b.name}
    </button>
  );

  const cell = ({ day, past, bookings: booked, turns, gaps }: MonthDay) => {
    if (m.inTurns)
      return (
        <>
          {turns.map((t) => (
            <div key={t.start} className="rsc-turn">
              <span className="rsc-part">
                {w.turn(t.n)} <small>{clock.format(t.start)}</small>
              </span>
              {t.who.map(name)}
              {t.gap && onPick
                ? Array.from({ length: t.free }, (_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: the places of a turn, alike.
                    <button key={i} type="button" className="rsc-free rsc-gap" onClick={() => onPick(t.gap!)}>
                      + {w.free}
                    </button>
                  ))
                : !past && t.free > 0 && <span className="rsc-free">{w.freePlaces(t.free)}</span>}
            </div>
          ))}
        </>
      );
    return (
      <>
        {(open.includes(day) ? booked : booked.slice(0, MOST)).map((b) => (
          <span key={b.id} className="rsc-entry">
            <small>{clock.format(new Date(b.start))}</small>
            {name(b)}
          </span>
        ))}
        {booked.length > MOST && !open.includes(day) && (
          <button type="button" className="rsc-more" onClick={() => setOpen([...open, day])}>
            {w.more(booked.length - MOST)}
          </button>
        )}
        {gaps.length ? (
          <button type="button" className="rsc-free rsc-gap" aria-pressed={chosen === day} onClick={() => setChosen(chosen === day ? null : day)}>
            {w.gaps(gaps.length)}
          </button>
        ) : null}
      </>
    );
  };

  return (
    <div className={`rse rsc${className ? ` ${className}` : ''}`} data-moving={moving || undefined}>
      <section className="rse-part">
        <div className="rsc-head">
          <h2>{monthName}</h2>
          <span className="rsc-nav">
            <button type="button" className="rse-button" onClick={() => m.setMonth(today.slice(0, 7))}>
              {w.today}
            </button>
            <button type="button" className="rse-icon" aria-label={w.previous} onClick={() => m.moveMonth(-1)}>
              ‹
            </button>
            <button type="button" className="rse-icon" aria-label={w.next} onClick={() => m.moveMonth(1)}>
              ›
            </button>
          </span>
        </div>
        {slots && kind && (
          <p className="rsc-ahead" data-none={!ahead || undefined}>
            <span>{ahead ? w.gapsAhead(ahead) : w.noGapsAhead}</span>
            {firstGap && (
              <button type="button" className="rse-link" onClick={goToGap}>
                {w.nextGap} →
              </button>
            )}
          </p>
        )}
        <div className="rsc-grid">
          {['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-01'].map((d) => (
            <span key={d} className="rsc-weekday">
              {weekday.format(utc(d))}
            </span>
          ))}
          {days.map((md, i) => {
            if (!md)
              // biome-ignore lint/suspicious/noArrayIndexKey: the empty places of the grid, where they are.
              return <span key={i} className="rsc-blank" />;
            const d = md.day;
            return (
              <div
                key={d}
                className="rsc-day"
                data-flash={d === flash || undefined}
                data-today={d === today || undefined}
                data-past={d < today || undefined}
                data-empty={!md.bookings.length || undefined}
              >
                {onDay ? (
                  <button
                    type="button"
                    className="rsc-date rsc-date-link"
                    aria-label={upper(new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(utc(d)))}
                    onClick={() => onDay(d)}
                  >
                    <span className="rsc-date-weekday">{weekday.format(utc(d))} </span>
                    {Number(d.slice(8))}
                  </button>
                ) : (
                  <span className="rsc-date">
                    <span className="rsc-date-weekday">{weekday.format(utc(d))} </span>
                    {Number(d.slice(8))}
                  </span>
                )}
                {cell(md)}
              </div>
            );
          })}
        </div>
        {chosen && chosenGaps.length > 0 && (
          <div className="rsc-panel" ref={panel}>
            <b>{upper(new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(utc(chosen)))}</b>
            <span className="rsc-panel-times">
              {chosenGaps.map((g) => (
                <button key={g.start} type="button" className="rsc-gap rsc-time" disabled={!onPick} onClick={() => onPick?.(g)}>
                  {clock.format(new Date(g.start))}
                  {places > 1 && <small>{w.left(g.free)}</small>}
                </button>
              ))}
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
