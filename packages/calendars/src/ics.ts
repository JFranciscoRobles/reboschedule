// What is busy in a calendar given as iCalendar: the secret address Google,
// Outlook and Apple give of a calendar, read as text. Each event that takes
// time (not one marked free, not one cancelled), at its instant: in UTC, in
// the time zone it names, or a whole day in the owner's; and those that
// repeat (daily or weekly, every so often, so many times or until a day,
// the days left out left out), as far as they touch what is asked.

import { addDays, type Busy, clockAt, instantOf, isTimeZone, weekdayOf } from '@reboschedule/core';

/** A time busy, with what it is called, to show it as such. */
export interface BusyEvent extends Busy {
  title?: string;
}

export interface IcsOptions {
  /** What is asked, ISO: only what touches it is given. */
  from: string;
  to: string;
  /** The time zone of times that name none and of whole days; UTC unless said. */
  timeZone?: string;
}

/** The lines of iCalendar, those folded put back together: a line that begins with a space goes on the one before. */
const unfold = (text: string) => text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);

/** A line as its name, its parameters and its value: `DTSTART;TZID=Europe/Madrid:20261103T090000`. */
function parse(line: string) {
  const colon = line.indexOf(':');
  const head = line.slice(0, colon);
  const [name, ...params] = head.split(';');
  return {
    name: name.toUpperCase(),
    params: Object.fromEntries(params.map((p) => p.split('=') as [string, string]).map(([k, v]) => [k.toUpperCase(), v?.replace(/^"|"$/g, '')])),
    value: line.slice(colon + 1),
  };
}

const unescapeText = (s: string) => s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1');

/** An instant of iCalendar: UTC (`…Z`), in the time zone it names, or in `timeZone`; a whole day (`VALUE=DATE`) begins at its midnight. */
function instant(value: string, params: Record<string, string>, timeZone: string): { ms: number; allDay: boolean } | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, , z] = m;
  const day = `${y}-${mo}-${d}`;
  if (h === undefined) {
    const at = instantOf(day, 0, timeZone);
    return at === null ? null : { ms: at, allDay: true };
  }
  if (z) return { ms: Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi)), allDay: false };
  const zone = params.TZID && isTimeZone(params.TZID) ? params.TZID : timeZone;
  const at = instantOf(day, Number(h) * 60 + Number(mi), zone) ?? instantOf(day, Number(h) * 60 + Number(mi) + 60, zone);
  return at === null ? null : { ms: at, allDay: false };
}

const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** The starts of an event that repeats, from its first, daily or weekly, as far as `until` (ms): the rest of what RRULE says is not read. */
function repeats(first: number, rule: string, zone: string, until: number, except: Set<number>): number[] {
  const r = Object.fromEntries(rule.split(';').map((p) => p.split('=') as [string, string]));
  if (r.FREQ !== 'DAILY' && r.FREQ !== 'WEEKLY') return [first];
  const every = Math.max(1, Number(r.INTERVAL) || 1);
  const count = r.COUNT ? Number(r.COUNT) : Number.POSITIVE_INFINITY;
  const last = r.UNTIL ? (instant(r.UNTIL, {}, zone)?.ms ?? until) : until;
  const { day: firstDay, minute } = clockAt(first, zone);
  const byDay = r.BYDAY ? r.BYDAY.split(',').map((d: string) => DAYS.indexOf(d.slice(-2))) : [weekdayOf(firstDay)];
  const out: number[] = [];
  let made = 0;
  // Each day from the first, as the event's clock says it, while it may still repeat.
  for (let n = 0; made < count && n < 3660; n++) {
    const day = addDays(firstDay, n);
    const weeks = Math.floor(n / 7);
    const on = r.FREQ === 'DAILY' ? n % every === 0 : weeks % every === 0 && byDay.includes(weekdayOf(day));
    if (!on) continue;
    const at = instantOf(day, minute, zone);
    if (at === null) continue;
    if (at > last || at > until) break;
    made++;
    if (!except.has(at)) out.push(at);
  }
  return out;
}

/** What is busy in an iCalendar text, from `from` to `to`. */
export function icsBusy(text: string, { from, to, timeZone = 'UTC' }: IcsOptions): BusyEvent[] {
  const a = Date.parse(from);
  const b = Date.parse(to);
  const out: BusyEvent[] = [];
  let event: ReturnType<typeof parse>[] | null = null;
  for (const line of unfold(text)) {
    if (line === 'BEGIN:VEVENT') event = [];
    else if (line === 'END:VEVENT' && event) {
      const field = (name: string) => event?.find((f) => f.name === name);
      const start = field('DTSTART');
      // Free time, and what was cancelled, take nothing.
      if (start && field('TRANSP')?.value !== 'TRANSPARENT' && field('STATUS')?.value !== 'CANCELLED') {
        const zone = start.params.TZID && isTimeZone(start.params.TZID) ? start.params.TZID : timeZone;
        const first = instant(start.value, start.params, timeZone);
        const end = field('DTEND');
        const last = end ? instant(end.value, end.params, timeZone) : null;
        if (first) {
          const length = last ? last.ms - first.ms : first.allDay ? 86_400_000 : 0;
          const except = new Set(
            event
              .filter((f) => f.name === 'EXDATE')
              .flatMap((f) => f.value.split(',').map((v) => instant(v, f.params, timeZone)?.ms))
              .filter((ms): ms is number => ms !== undefined),
          );
          const rule = field('RRULE')?.value;
          const starts = rule ? repeats(first.ms, rule, zone, b, except) : [first.ms];
          const title = field('SUMMARY') ? unescapeText(field('SUMMARY')!.value) : undefined;
          for (const s of starts) if (s < b && s + length > a) out.push({ start: new Date(s).toISOString(), end: new Date(s + length).toISOString(), ...(title ? { title } : {}) });
        }
      }
      event = null;
    } else if (event && line.includes(':')) event.push(parse(line));
  }
  return out.sort((x, y) => x.start.localeCompare(y.start));
}

/** The same, of the secret address of a calendar, asked for as it is. */
export async function fetchIcsBusy(url: string, options: IcsOptions & { fetch?: typeof fetch }): Promise<BusyEvent[]> {
  const send = options.fetch ?? globalThis.fetch.bind(globalThis);
  const answer = await send(url.replace(/^webcal:/, 'https:'));
  if (!answer.ok) throw new Error(`The calendar could not be read: ${answer.status}`);
  return icsBusy(await answer.text(), options);
}
