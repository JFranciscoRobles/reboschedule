import { describe, expect, it } from 'vitest';
import { addDays, clockAt, daysBetween, hhmm, instantOf, isTimeZone, minutesOf, monthOf, weekdayOf } from '../src';

describe('clocks in time zones', () => {
  it('finds the instant a clock shows, and back', () => {
    const ms = instantOf('2026-11-03', 9 * 60, 'America/Tijuana')!;
    expect(new Date(ms).toISOString()).toBe('2026-11-03T17:00:00.000Z');
    expect(clockAt(ms, 'America/Tijuana')).toMatchObject({ day: '2026-11-03', minute: 540, weekday: 2 });
    expect(clockAt(ms, 'Europe/Madrid')).toMatchObject({ day: '2026-11-03', minute: 18 * 60 });
  });

  it('knows summer time: an hour that does not exist that night, and one that comes twice', () => {
    // Spring: from 2:00 to 3:00 the clocks of Tijuana jump.
    expect(instantOf('2026-03-08', 2 * 60 + 30, 'America/Tijuana')).toBeNull();
    expect(new Date(instantOf('2026-03-08', 3 * 60, 'America/Tijuana')!).toISOString()).toBe('2026-03-08T10:00:00.000Z');
    // Summer and winter: seven hours behind, then eight.
    expect(new Date(instantOf('2026-07-01', 9 * 60, 'America/Tijuana')!).toISOString()).toBe('2026-07-01T16:00:00.000Z');
    expect(new Date(instantOf('2026-12-01', 9 * 60, 'America/Tijuana')!).toISOString()).toBe('2026-12-01T17:00:00.000Z');
  });

  it('counts days, minutes and weekdays', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    expect(minutesOf('09:30')).toBe(570);
    expect(minutesOf('24:00')).toBe(1440);
    expect(minutesOf('9:30')).toBeNull();
    expect(hhmm(570)).toBe('09:30');
    expect(weekdayOf('2026-11-01')).toBe(0);
    expect(isTimeZone('America/Tijuana')).toBe(true);
    expect(isTimeZone('Mars/Olympus')).toBe(false);
  });

  it('lays a month out in weeks, Monday first', () => {
    const weeks = monthOf('2026-11');
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
  });
});
