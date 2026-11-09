// A day, as whoever looks after it sees it: a column for each thing booked (a
// court, a room) or each place of a turn, the hours down the side, each
// booking a block as long as it is, and each gap a place to give away, that
// very court at that very time. A line where now is, on today. Without a
// kind, the owner's own day: all their appointments in one column.

import { type Booking, type EventType, formatMoney, type Locale, type Schedule, type Slot } from '@reboschedule/core';
import { type CSSProperties, Fragment } from 'react';
import { WORDS } from './i18n';
import { useDay } from './useCalendar';

export interface BookingDayProps {
  bookings: Booking[];
  types: EventType[];
  schedule: Schedule;
  /** The id of the kind shown; the owner's own appointments, all in one column, unless said. */
  type?: string;
  /** The day shown first (`YYYY-MM-DD`, as the owner's clock says it); today unless said. */
  day?: string;
  /** Told the day shown, as it changes. */
  onDay?: (day: string) => void;
  /** The times still free of the kind shown: its gaps, to give away. */
  slots?: Slot[];
  /** What is busy in the owner's own calendar (Google, Outlook): shown where it is, across the day. */
  away?: { start: string; end: string; title?: string }[];
  /** Told a gap chosen: the slot, its resources only the one of the column. */
  onPick?: (slot: Slot) => void;
  onSelect?: (booking: Booking) => void;
  selected?: string;
  moving?: boolean;
  locale?: Locale;
  now?: number;
  className?: string;
}

const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function BookingDay({ bookings, types, schedule, type: only, day: given, onDay, slots, away, onPick, onSelect, selected, moving, locale = 'en', now = Date.now(), className }: BookingDayProps) {
  const w = WORDS[locale];
  const d = useDay({ bookings, types, schedule, type: only, slots, now, day: given, onDay, away });
  const { day, today, kind, columns, rows, blocks, step } = d;
  // The height of a row, in pixels, what a block is measured in: taller for longer steps, as turns of hours are.
  const ROW = step >= 120 ? 72 : step >= 60 ? 40 : 34;
  const clock = new Intl.DateTimeFormat(locale, { timeZone: schedule.timeZone, hour: 'numeric', minute: '2-digit' });
  const typeOf = (b: Booking) => types.find((t) => t.id === b.type);
  const title = upper(new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`)));
  const nameOf = (c: (typeof columns)[number]) => c.name || (c.place ? w.placeN(c.place) : kind?.title || w.everything);

  return (
    <div className={`rse rsd${className ? ` ${className}` : ''}`} data-moving={moving || undefined}>
      <section className="rse-part">
        <div className="rsc-head">
          <h2>{title}</h2>
          <span className="rsc-nav">
            <button type="button" className="rse-button" onClick={() => d.setDay(today)}>
              {w.today}
            </button>
            <button type="button" className="rse-icon" aria-label={w.previousDay} onClick={() => d.moveDay(-1)}>
              ‹
            </button>
            <button type="button" className="rse-icon" aria-label={w.nextDay} onClick={() => d.moveDay(1)}>
              ›
            </button>
          </span>
        </div>
        {slots && kind && !d.closed && day >= today && (
          <p className="rsc-ahead" data-none={!d.free || undefined}>
            <span>{d.free ? w.gapsToday(d.free) : w.noGapsToday}</span>
          </p>
        )}
        {d.closed ? (
          <p className="rse-help">{w.closedDay}</p>
        ) : (
          <div className="rsd-scroll">
            <div className="rsd-grid" style={{ '--rsd-cols': columns.length, '--rsd-rows': rows.length, '--rsd-row': `${ROW}px` } as CSSProperties}>
              <span className="rsd-corner" />
              {columns.map((c, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the places of a turn have no id but where they are.
                <span key={i} className="rsd-column" style={{ gridColumn: i + 2 }}>
                  {c.image && <img src={c.image} alt="" />}
                  {nameOf(c)}
                </span>
              ))}
              {rows.map((row, r) => (
                <Fragment key={row.minute}>
                  <span className="rsd-time" style={{ gridRow: r + 2 }}>
                    {row.minute % 60 === 0 || step >= 60 ? (row.at === null ? '' : clock.format(row.at)) : ''}
                  </span>
                  {columns.map((c, i) => {
                    const gap = row.gaps[i];
                    return gap && onPick ? (
                      <button
                        // biome-ignore lint/suspicious/noArrayIndexKey: one cell for each column, where it is.
                        key={i}
                        type="button"
                        className="rsd-cell rsd-gap"
                        style={{ gridColumn: i + 2, gridRow: r + 2 }}
                        aria-label={`${w.free} · ${c.name} ${row.at === null ? '' : clock.format(row.at)}`}
                        onClick={() => onPick(gap)}
                      >
                        +
                      </button>
                    ) : (
                      // biome-ignore lint/suspicious/noArrayIndexKey: one cell for each column, where it is.
                      <span key={i} className="rsd-cell" data-off={row.off[i] || undefined} style={{ gridColumn: i + 2, gridRow: r + 2 }} />
                    );
                  })}
                </Fragment>
              ))}
              {d.away.map((a) => (
                <span key={`${a.start}${a.title}`} className="rsd-away" style={{ gridColumn: '2 / -1', gridRow: `${a.row + 2} / span ${a.span}` }} title={a.title}>
                  <b>{a.title || w.away}</b>
                  <small>
                    {clock.format(new Date(a.start))} – {clock.format(new Date(a.end))}
                  </small>
                </span>
              ))}
              {blocks.map(({ booking: b, column, row, span }) => {
                const t = typeOf(b);
                return (
                  <button
                    key={b.id}
                    type="button"
                    className="rsd-block"
                    aria-current={b.id === selected || undefined}
                    style={{ gridColumn: column + 2, gridRow: `${row + 2} / span ${span}`, '--rsc-color': t?.color ?? '#8f8f8f' } as CSSProperties}
                    title={[b.name, b.email].join(' · ')}
                    onClick={() => onSelect?.(b)}
                  >
                    <b>
                      {b.series ? '↻ ' : ''}
                      {b.name}
                    </b>
                    <small>
                      {clock.format(new Date(b.start))} – {clock.format(new Date(b.end))}
                      {!only && t ? ` · ${t.title}` : ''}
                      {b.price ? ` · ${formatMoney(b.price, locale)}` : ''}
                    </small>
                  </button>
                );
              })}
              {d.now !== null && d.now >= 0 && d.now <= rows.length && <span className="rsd-now" style={{ top: `calc(var(--rsd-head) + ${d.now * ROW}px)` }} aria-hidden="true" />}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
