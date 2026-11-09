// A week, as whoever looks after it sees it: its seven days side by side,
// the hours down the side, each booking a block as long as it is (those that
// overlap side by side), each gap a place to give; a line where now is.

import type { Booking, EventType, Locale, Schedule, Slot } from '@reboschedule/core';
import { type CSSProperties, Fragment } from 'react';
import { WORDS } from './i18n';
import { useWeek } from './useCalendar';

export interface BookingWeekProps {
  bookings: Booking[];
  types: EventType[];
  schedule: Schedule;
  /** The id of the kind shown; all of them unless said. */
  type?: string;
  /** A day of the week shown first; this week unless said. */
  day?: string;
  onDay?: (day: string) => void;
  /** The times still free of the kind shown: its gaps, to give away. */
  slots?: Slot[];
  onPick?: (slot: Slot) => void;
  onSelect?: (booking: Booking) => void;
  selected?: string;
  locale?: Locale;
  now?: number;
  className?: string;
}

export function BookingWeek({ bookings, types, schedule, type: only, day, onDay, slots, onPick, onSelect, selected, locale = 'en', now = Date.now(), className }: BookingWeekProps) {
  const w = WORDS[locale];
  const k = useWeek({ bookings, types, schedule, type: only, slots, now, day, onDay });
  const ROW = k.step >= 60 ? 44 : 30;
  const clock = new Intl.DateTimeFormat(locale, { timeZone: schedule.timeZone, hour: 'numeric', minute: '2-digit' });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const range = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const utc = (d: string) => new Date(`${d}T12:00:00Z`);
  const typeOf = (b: Booking) => types.find((t) => t.id === b.type);

  return (
    <div className={`rse rsd rsw${className ? ` ${className}` : ''}`}>
      <section className="rse-part">
        <div className="rsc-head">
          <h2>
            {range.format(utc(k.days[0]))} – {range.format(utc(k.days[6]))}
          </h2>
          <span className="rsc-nav">
            <button type="button" className="rse-button" onClick={() => k.setDay(k.today)}>
              {w.today}
            </button>
            <button type="button" className="rse-icon" aria-label={w.previousWeek} onClick={() => k.moveWeek(-1)}>
              ‹
            </button>
            <button type="button" className="rse-icon" aria-label={w.nextWeek} onClick={() => k.moveWeek(1)}>
              ›
            </button>
          </span>
        </div>
        {k.closed ? (
          <p className="rse-help">{w.closedDay}</p>
        ) : (
          <div className="rsd-scroll">
            <div className="rsd-grid rsw-grid" style={{ '--rsd-cols': 7, '--rsd-rows': k.rows.length, '--rsd-row': `${ROW}px` } as CSSProperties}>
              <span className="rsd-corner" />
              {k.days.map((d, i) => (
                <span key={d} className="rsd-column" data-today={d === k.today || undefined} style={{ gridColumn: i + 2 }}>
                  {weekday.format(utc(d))} <b>{Number(d.slice(8))}</b>
                </span>
              ))}
              {k.rows.map((row, r) => (
                <Fragment key={row.minute}>
                  <span className="rsd-time" style={{ gridRow: r + 2 }}>
                    {row.minute % 60 === 0 ? (row.at.find((t) => t !== null) === undefined ? '' : clock.format(row.at.find((t) => t !== null) as number)) : ''}
                  </span>
                  {k.days.map((d, i) => {
                    const gap = row.gaps[i];
                    return gap && onPick ? (
                      <button
                        key={d}
                        type="button"
                        className="rsd-cell rsd-gap"
                        style={{ gridColumn: i + 2, gridRow: r + 2 }}
                        aria-label={`${w.free} · ${clock.format(new Date(gap.start))}`}
                        onClick={() => onPick(gap)}
                      >
                        +
                      </button>
                    ) : (
                      <span key={d} className="rsd-cell" style={{ gridColumn: i + 2, gridRow: r + 2 }} />
                    );
                  })}
                </Fragment>
              ))}
              {k.blocks.map(({ booking: b, column, row, span, lane, lanes }) => (
                <button
                  key={b.id}
                  type="button"
                  className="rsd-block"
                  aria-current={b.id === selected || undefined}
                  style={
                    {
                      gridColumn: column + 2,
                      gridRow: `${row + 2} / span ${span}`,
                      width: `calc(${100 / lanes}% - 4px)`,
                      marginLeft: `calc(${(100 / lanes) * lane}% + 2px)`,
                      '--rsc-color': typeOf(b)?.color ?? '#8f8f8f',
                    } as CSSProperties
                  }
                  title={[b.name, clock.format(new Date(b.start)), typeOf(b)?.title].filter(Boolean).join(' · ')}
                  onClick={() => onSelect?.(b)}
                >
                  <b>{b.name}</b>
                  <small>{clock.format(new Date(b.start))}</small>
                </button>
              ))}
              {k.now && k.now.row >= 0 && k.now.row <= k.rows.length && (
                <span
                  className="rsd-now rsw-now"
                  style={{ top: `calc(var(--rsd-head) + ${k.now.row * ROW}px)`, left: `calc(64px + (100% - 64px) * ${k.now.column} / 7)`, width: 'calc((100% - 64px) / 7)' }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
