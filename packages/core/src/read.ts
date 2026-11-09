// What booking reads from whoever gives it: a schedule, a kind of
// appointment, a booking asked for. Only what each has, as long as it may
// be: hours a clock may show, a time zone the system knows, minutes and days
// within reason, questions of the kinds there are.

import {
  type EventType,
  FIELD_KINDS,
  type Hours,
  PLACE_KINDS,
  QUESTION_KINDS,
  type Price,
  type Stay,
  type Question,
  type Repeat,
  type Resource,
  type ResourceField,
  type Schedule,
  WEEKDAYS,
  type Weekday,
} from './model';
import { isTimeZone, minutesOf } from './time';
import { readSeating, seatsOf } from './seating';

const text = (v: unknown, most = 500) => (typeof v === 'string' ? v.slice(0, most) : '');
const object = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const number = (v: unknown, least: number, most: number, otherwise: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(most, Math.max(least, Math.round(v))) : otherwise);
const oneOf = <T>(v: unknown, of: readonly T[], otherwise: T): T => (of.includes(v as T) ? (v as T) : otherwise);

export const newId = () => Math.random().toString(36).slice(2, 10);

/** Hours as given: each a stretch a clock may show, from before to, in their order, none over another. */
export function readHours(given: unknown): Hours[] {
  const hours = (Array.isArray(given) ? given : [])
    .slice(0, 12)
    .map(object)
    .map((h) => ({ from: text(h.from, 5), to: text(h.to, 5) }))
    .filter((h) => {
      const a = minutesOf(h.from);
      const b = minutesOf(h.to);
      return a !== null && b !== null && a < b;
    })
    .sort((x, y) => minutesOf(x.from)! - minutesOf(y.from)!);
  return hours.filter((h, i) => i === 0 || minutesOf(h.from)! >= minutesOf(hours[i - 1].to)!);
}

/** The hours of each day of the week as given. */
const readWeekly = (given: unknown) => {
  const weekly = object(given);
  return Object.fromEntries(WEEKDAYS.map((d) => [d, readHours(weekly[d])])) as Record<Weekday, Hours[]>;
};

/** A schedule as given; its time zone UTC when it is not one the system knows. */
export function readSchedule(given: unknown): Schedule {
  const s = object(given);
  const dates = object(s.dates);
  return {
    timeZone: typeof s.timeZone === 'string' && isTimeZone(s.timeZone) ? s.timeZone : 'UTC',
    weekly: readWeekly(s.weekly),
    dates: Object.fromEntries(
      Object.entries(dates)
        .filter(([day]) => /^\d{4}-\d{2}-\d{2}$/.test(day))
        .slice(0, 400)
        .map(([day, hours]) => [day, readHours(hours)]),
    ),
  };
}

/** A picture as given: an address of the web or of the site, or an image as data no bigger than 300 KB; none otherwise. */
export function readImage(given: unknown): string {
  const v = text(given, 400_000).trim();
  return /^(https?:\/\/|\/)/.test(v) && v.length <= 2000 ? v : /^data:image\/(png|jpe?g|gif|webp|svg\+xml)[;,]/.test(v) ? v : '';
}

/** A stay as given: nights or days, from one to a year, between hours a clock may show; none otherwise. */
export function readStay(given: unknown): Stay | null {
  if (!given || typeof given !== 'object') return null;
  const s = object(given);
  const checkIn = minutesOf(text(s.checkIn, 5)) === null ? '15:00' : text(s.checkIn, 5);
  const checkOut = minutesOf(text(s.checkOut, 5)) === null ? '12:00' : text(s.checkOut, 5);
  const min = number(s.min, 1, 365, 1);
  return { unit: s.unit === 'day' ? 'day' : 'night', min, max: Math.max(min, number(s.max, 1, 365, 30)), checkIn, checkOut };
}

/** A price as given: an amount not below nothing, a currency of three letters, each hour or for the booking; none otherwise. */
export function readPrice(given: unknown): Price | null {
  const p = object(given);
  const currency = text(p.currency, 10).trim().toUpperCase();
  if (typeof p.amount !== 'number' || !Number.isFinite(p.amount) || p.amount < 0 || !/^[A-Z]{3}$/.test(currency)) return null;
  return { amount: Math.round(p.amount * 100) / 100, currency, per: oneOf(p.per, ['hour', 'booking', 'place', 'night', 'day'] as const, 'hour') };
}

/** The fields each thing of a kind has, as given: a label, of the kinds there are. */
export function readFields(given: unknown): ResourceField[] {
  return (Array.isArray(given) ? given : [])
    .slice(0, 12)
    .map(object)
    .map((f): ResourceField => ({ id: text(f.id, 40) || newId(), label: text(f.label, 80), kind: oneOf(f.kind, FIELD_KINDS, 'text'), unit: text(f.unit, 20) }))
    .filter((f, i, all) => f.label.trim() && all.findIndex((x) => x.id === f.id) === i);
}

/** What a thing says of itself, as its fields have it: a line, a number, a yes or no; nothing for fields it does not have. */
function readValues(given: unknown, fields: ResourceField[]) {
  const v = object(given);
  const out: Record<string, string | number | boolean> = {};
  for (const f of fields) {
    const x = v[f.id];
    if (f.kind === 'number' && typeof x === 'number' && Number.isFinite(x)) out[f.id] = x;
    else if (f.kind === 'yes-no' && typeof x === 'boolean') out[f.id] = x;
    else if (f.kind === 'text' && typeof x === 'string' && x.trim()) out[f.id] = x.slice(0, 120);
  }
  return out;
}

/** A kind of appointment as given: its minutes and days within reason, its place and questions of the kinds there are. */
export function readEventType(given: unknown): EventType {
  const t = object(given);
  const fields = readFields(t.fields);
  const place = object(t.place);
  const duration = number(t.duration, 5, 24 * 60, 30);
  const color = text(t.color, 7);
  const seating = readSeating(t.seating);
  return {
    id: text(t.id, 40) || newId(),
    slug:
      text(t.slug, 60)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '') || 'cita',
    title: text(t.title, 120),
    description: text(t.description, 1000),
    duration,
    lengths: [
      ...new Set(
        (Array.isArray(t.lengths) ? t.lengths : [])
          .slice(0, 12)
          .map((n) => number(n, 5, 24 * 60, 0))
          .filter((n) => n && n !== duration),
      ),
    ].sort((a, b) => a - b),
    increment: number(t.increment, 5, 24 * 60, duration),
    before: number(t.before, 0, 240, 0),
    after: number(t.after, 0, 240, 0),
    notice: number(t.notice, 0, 60 * 24 * 30, 60),
    horizon: number(t.horizon, 1, 365, 30),
    perDay: t.perDay === null || t.perDay === undefined ? null : number(t.perDay, 1, 100, 8),
    place: { kind: oneOf(place.kind, PLACE_KINDS, 'video'), value: text(place.value, 500) },
    hours: t.hours && typeof t.hours === 'object' ? readWeekly(t.hours) : null,
    fields,
    price: readPrice(t.price),
    // A room of seats has its seats made of how it is laid out, as many as it has.
    resources: seating
      ? seatsOf(seating)
      : (Array.isArray(t.resources) ? t.resources : [])
          .slice(0, 50)
          .map(object)
          .map(
            (r): Resource => ({
              id: text(r.id, 40) || newId(),
              name: text(r.name, 120),
              image: readImage(r.image),
              price: typeof r.price === 'number' && Number.isFinite(r.price) && r.price >= 0 ? Math.round(r.price * 100) / 100 : null,
              ...(r.hours && typeof r.hours === 'object' ? { hours: readWeekly(r.hours) } : {}),
              ...(typeof r.capacity === 'number' ? { capacity: number(r.capacity, 1, 5000, 1) } : {}),
              values: readValues(r.values, fields),
            }),
          )
          .filter((r, i, all) => r.name.trim() && all.findIndex((x) => x.id === r.id) === i),
    capacity: number(t.capacity, 1, 500, 1),
    series: number(t.series, 0, 52, 0),
    whole: t.whole === true,
    stay: readStay(t.stay),
    ...(seating ? { seating } : {}),
    // What is given back by how long before, the most hours first; the deposit; until when it may be moved.
    ...(Array.isArray(t.refunds)
      ? {
          refunds: t.refunds
            .slice(0, 6)
            .map(object)
            .map((r) => ({ hours: number(r.hours, 0, 24 * 90, 0), percent: number(r.percent, 0, 100, 0) }))
            .sort((a, b) => b.hours - a.hours),
        }
      : {}),
    ...(typeof t.deposit === 'number' ? { deposit: number(t.deposit, 1, 100, 100) } : {}),
    ...(typeof t.reschedule === 'number' ? { reschedule: number(t.reschedule, 0, 24 * 90, 24) } : {}),
    questions: (Array.isArray(t.questions) ? t.questions : [])
      .slice(0, 10)
      .map(object)
      .map((q): Question => ({ id: text(q.id, 40) || newId(), label: text(q.label, 200), kind: oneOf(q.kind, QUESTION_KINDS, 'text'), required: q.required === true }))
      .filter((q) => q.label.trim()),
    color: /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : '#3b63fb',
  };
}

/** A repetition as given: every one to twelve weeks, up to 52 times or until a day; none if it says nothing of either. */
export function readRepeat(given: unknown): Repeat | undefined {
  const r = object(given);
  const count = typeof r.count === 'number' ? Math.min(52, Math.max(1, Math.round(r.count))) : undefined;
  const until = typeof r.until === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.until) ? r.until : undefined;
  if (!count && !until) return undefined;
  return { every: number(r.every, 1, 12, 1), ...(count ? { count } : {}), ...(until ? { until } : {}) };
}

/** A booking asked for: when, for how long and which thing if they chose, who, from which time zone, what they answered. */
export interface BookingRequest {
  start: string;
  /** Minutes, of the lengths the kind has; its duration when none. */
  length?: number;
  /** The id of a resource; the first with a place when none. */
  resource?: string;
  /** The same again, every week, as many times as asked, if the kind lets it. */
  repeat?: Repeat;
  /** How many places together: tickets of a concert. */
  places?: number;
  /** The resources asked, each one: the seats of a cinema. */
  seats?: string[];
  /** The first and the last day of a stay (the day one leaves, for nights). */
  arrive?: string;
  leave?: string;
  /** A discount's code, as whoever books wrote it. */
  coupon?: string;
  name: string;
  email: string;
  timeZone: string;
  answers: Record<string, string>;
}

export function readBookingRequest(given: unknown): BookingRequest {
  const b = object(given);
  const answers = object(b.answers);
  return {
    start: text(b.start, 40),
    length: typeof b.length === 'number' && Number.isFinite(b.length) ? Math.round(b.length) : undefined,
    resource: text(b.resource, 40) || undefined,
    repeat: readRepeat(b.repeat),
    places: typeof b.places === 'number' ? number(b.places, 1, 20, 1) : undefined,
    seats: Array.isArray(b.seats) ? [...new Set(b.seats.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 40)))].slice(0, 20) : undefined,
    arrive: typeof b.arrive === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.arrive) ? b.arrive : undefined,
    leave: typeof b.leave === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.leave) ? b.leave : undefined,
    coupon: text(b.coupon, 40).trim().toUpperCase() || undefined,
    name: text(b.name, 120).trim(),
    email: text(b.email, 200).trim(),
    timeZone: typeof b.timeZone === 'string' && isTimeZone(b.timeZone) ? b.timeZone : 'UTC',
    answers: Object.fromEntries(
      Object.entries(answers)
        .slice(0, 10)
        .map(([k, v]) => [k.slice(0, 40), text(v, 2000)]),
    ),
  };
}
