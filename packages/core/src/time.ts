// Time as clocks say it, in any time zone, with nothing but `Intl`: the
// day and the minute a clock shows at an instant, and the instant a clock
// shows a day and a minute. Where the clocks change (summer time), a minute
// that does not exist that night is no instant at all, and is said so.

/** Days as `YYYY-MM-DD`; minutes of a day from 0 to 1439. */
export type Day = string;

const formatters = new Map<string, Intl.DateTimeFormat>();
const formatter = (timeZone: string) => {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    formatters.set(timeZone, f);
  }
  return f;
};

/** Whether a time zone is one the system knows: `America/Tijuana`, `UTC`. */
export function isTimeZone(timeZone: string) {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** What a clock in `timeZone` shows at an instant: its day, and the minute of it. */
export function clockAt(ms: number, timeZone: string): { day: Day; minute: number; weekday: number } {
  const parts = Object.fromEntries(
    formatter(timeZone)
      .formatToParts(new Date(ms))
      .map((p) => [p.type, p.value]),
  );
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  return { day, minute: Number(parts.hour) * 60 + Number(parts.minute), weekday: weekdayOf(day) };
}

/** How far ahead of UTC a time zone is at an instant, in milliseconds. */
function offsetAt(ms: number, timeZone: string) {
  const p = Object.fromEntries(
    formatter(timeZone)
      .formatToParts(new Date(ms))
      .map((x) => [x.type, Number(x.value)]),
  );
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
}

/** The instant a clock in `timeZone` shows `day` at `minute`; none if that minute does not exist there that night. */
export function instantOf(day: Day, minute: number, timeZone: string): number | null {
  const [y, m, d] = day.split('-').map(Number);
  const wall = Date.UTC(y, m - 1, d, Math.floor(minute / 60), minute % 60);
  let ms = wall - offsetAt(wall, timeZone);
  ms = wall - offsetAt(ms, timeZone);
  const back = clockAt(ms, timeZone);
  return back.day === day && back.minute === minute ? ms : null;
}

/** The day `n` days after `day`. */
export const addDays = (day: Day, n: number): Day => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** The day of the week of a day, Sunday 0. */
export const weekdayOf = (day: Day) => new Date(`${day}T12:00:00Z`).getUTCDay();

/** A clock's `HH:MM` as minutes of the day; none if it is not one. */
export function minutesOf(hhmm: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm) ?? (hhmm === '24:00' ? ['', '24', '00'] : null);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Minutes of the day as a clock's `HH:MM`. */
export const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** The days from `from` to `to`, both in. */
export function daysBetween(from: Day, to: Day): Day[] {
  const out: Day[] = [];
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}
