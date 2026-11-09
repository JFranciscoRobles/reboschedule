// What booking is made of. Someone's hours (`Schedule`): their time zone, the
// hours of each day of the week, and days that are not as the week says (a
// holiday, a Saturday open). The kinds of appointment they give (`EventType`):
// how long, every how many minutes one may start, the time kept free before
// and after, how soon and how far ahead, where, and what is asked of who
// books; and what is booked when it is not the owner's time but a thing, one
// of several alike (a court, a room), or a place among several (the guards of
// a shift), with hours of its own and lengths to choose from. And an
// appointment booked (`Booking`): when, of what kind, which thing, who, what
// they answered. Times are kept as ISO strings in UTC; the hours, as the
// owner's clock says them, in their time zone.

/** A stretch of a day, as a clock says it: `09:00` to `13:30`. */
export interface Hours {
  from: string;
  to: string;
}

/** The days of the week, Sunday first, as `Date` counts them. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Schedule {
  /** The time zone the hours are in, as IANA names it: `America/Tijuana`. */
  timeZone: string;
  /** The hours of each day of the week; none, a day off. */
  weekly: Record<Weekday, Hours[]>;
  /** Days that are not as the week says, by their date (`YYYY-MM-DD`): their hours, or none for a day off. */
  dates: Record<string, Hours[]>;
}

/** Where an appointment is: in a place, by phone, by a video call, or as written. */
export interface Place {
  kind: 'in-person' | 'phone' | 'video' | 'custom';
  /** The address, the number, the link of the call, or the words. */
  value: string;
}

/** What is asked of who books, besides their name and email. */
export interface Question {
  id: string;
  label: string;
  kind: 'text' | 'long' | 'phone';
  required: boolean;
}

/** What each thing booked says of itself, the same for all of a kind: a court covered or not, its surface; how many a room holds. */
export interface ResourceField {
  id: string;
  label: string;
  kind: 'text' | 'number' | 'yes-no';
  /** Said after a number: `people`, `m²`. */
  unit: string;
}

/** A thing booked, one of several alike: a court, a room. */
export interface Resource {
  id: string;
  name: string;
  /** A picture of it: an address (`https://`, `/`) or an image as data (`data:image/…`). */
  image: string;
  /** What it says of itself, by the ids of its kind's fields. */
  values: Record<string, string | number | boolean>;
  /** Its own price, in its kind's currency and per its kind's unit; its kind's when none. */
  price: number | null;
  /** Its own hours of the week, instead of its kind's: a barber who works Tuesday to Saturday. None, its kind's. */
  hours?: Record<Weekday, Hours[]> | null;
  /** How many may book it at once, instead of its kind's: the 500 of the general floor, the 80 of the VIP. */
  capacity?: number | null;
}

/** An amount of money, as it is said: `{ amount: 900, currency: 'MXN' }`. */
export interface Money {
  amount: number;
  /** ISO 4217: `MXN`, `USD`, `EUR`. */
  currency: string;
}

/** What a kind costs: an amount each hour, or for each booking whatever it lasts. */
export interface Price extends Money {
  /** Each hour; each booking; each place of it (a ticket, a seat); each night or day of a stay. */
  per: 'hour' | 'booking' | 'place' | 'night' | 'day';
}

/** A stay: whole nights (a cabin) or whole days (equipment), from a day to a day, between an hour in and an hour out. */
export interface Stay {
  unit: 'night' | 'day';
  /** The fewest and the most nights (or days) of one. */
  min: number;
  max: number;
  /** When it begins on the first day and ends on the last, as the owner's clock says it: `15:00`, `12:00`. */
  checkIn: string;
  checkOut: string;
}

/** A room of seats, as it is laid out: so many rows, each of blocks of seats with an aisle between, some rows dearer. */
export interface Seating {
  /** How many rows, `A` the first, nearest the screen or the stage: 8, `A` to `H`. */
  rows: number;
  /** How many seats of each row, block by block from the left, an aisle between each: `[3, 6, 3]`. */
  blocks: number[];
  /** The rows that cost otherwise, by their letter: what each seat of them costs, in its kind's currency. */
  prices: Record<string, number>;
}

/** How much of what was paid is given back when whoever booked cancels: so many hours before at least, so much percent. */
export interface RefundRule {
  hours: number;
  percent: number;
}

/** A discount by a code: a percent off, an amount off, or `take` for the price of `pay` (2×1); of some kinds, some days of the week, until a day. */
export interface Coupon {
  code: string;
  /** What it says, as whoever books reads it: `10% off`, `2×1 on Tuesdays`. */
  label: string;
  percent?: number;
  amount?: number;
  /** Of each `take` places (seats, tickets, nights), `pay` paid: 2 and 1, two for one. */
  take?: number;
  pay?: number;
  /** The kinds it is good for, by their ids; all if none. */
  types?: string[];
  /** The days of the week it is good for, as the owner's clock says the booking's day; all if none. */
  days?: Weekday[];
  /** The last day it is good for, as the owner's clock says it. */
  until?: string;
}

export interface EventType {
  id: string;
  /** Its address among the owner's: `first-visit`. */
  slug: string;
  title: string;
  description: string;
  /** How long, in minutes; the length chosen first when there are several. */
  duration: number;
  /** Other lengths whoever books may choose, in minutes: a court for an hour, or two; none, only `duration`. */
  lengths: number[];
  /** Every how many minutes one may start; its duration unless said. */
  increment: number;
  /** Minutes kept free before and after each, for the way there, for notes. */
  before: number;
  after: number;
  /** How soon one may be booked, in minutes from now. */
  notice: number;
  /** How far ahead, in days. */
  horizon: number;
  /** How many a day at most; none, as many as fit. */
  perDay: number | null;
  place: Place;
  /** Its own hours of the week, in the owner's time zone, instead of theirs: a court open every day from 7 to 22. None, the owner's. */
  hours: Record<Weekday, Hours[]> | null;
  /** What is booked, one of several alike: courts, rooms. None, the owner's own time. */
  resources: Resource[];
  /** What each of them says of itself: the fields they all have. */
  fields: ResourceField[];
  /** What it costs; none, nothing said of money. */
  price: Price | null;
  /** Booked by nights or days instead of times: a cabin, a car. None, by its times. */
  stay: Stay | null;
  /** Its seats laid out, when it is a room of seats: its resources are made of it, a seat each. None, its resources as they are. */
  seating?: Seating | null;
  /** How much is given back when whoever booked cancels, by how long before: `[{ hours: 48, percent: 100 }, { hours: 24, percent: 50 }]`; nothing after the last. None, all of it. */
  refunds?: RefundRule[] | null;
  /** The percent paid when booked, the rest at the place: 30, of a cabin. None, all of it. */
  deposit?: number | null;
  /** Until how many hours before whoever booked may move it themselves, from its own address. None, they may not. */
  reschedule?: number | null;
  /** How many may book the same time of each: the guards of a shift; one unless said. */
  capacity: number;
  /** Each stretch of its hours one booking, whole: turns of 10 to 14 and 14 to 19, as long as each stretch is. */
  whole: boolean;
  questions: Question[];
  /** How many times a week apart whoever books may take at once (a class every Tuesday): 0, one at a time. */
  series: number;
  /** #rrggbb, to tell it from the others. */
  color: string;
}

/** A time taken: by an appointment, or by the owner's own calendar. */
export interface Busy {
  start: string;
  end: string;
  /** A place of which resource it takes (`''`, the kind with none); not said, it takes all of them: the owner is away. */
  resource?: string;
  /** How many places of it it takes: the four tickets of one booking; one unless said. */
  places?: number;
}

/** A time that may be booked: when it starts and ends, ISO in UTC. */
export interface Slot {
  start: string;
  end: string;
  /** How many places are left at it, of all its resources. */
  free: number;
  /** The resources with a place left, when the kind has any. */
  resources?: string[];
  /** What it costs, for its length and the resource it would be (the one asked, or the first free). */
  price?: Money | null;
}

export interface Booking {
  id: string;
  /** The id of its kind. */
  type: string;
  /** The id of the resource booked; `''` when the kind has none. */
  resource: string;
  /** What it was quoted at when it was booked, by the server; none if its kind has no price. */
  price?: Money | null;
  start: string;
  end: string;
  name: string;
  email: string;
  /** The time zone of who booked, to tell them their time in it. */
  timeZone: string;
  /** What they answered, by the questions' ids. */
  answers: Record<string, string>;
  /** Confirmed; cancelled; or held while it is paid for, its place kept until `held` and free again after. */
  status: 'confirmed' | 'cancelled' | 'held';
  /** Until when a booking held keeps its place, ISO in UTC. */
  held?: string;
  /** Its payment: who takes it, the payment's id there, where to pay it while it is held, and the id of what was paid (to refund it). */
  payment?: { provider: string; id: string; url?: string; paid?: string; amount?: number };
  /** What is left to pay at the place, when only a deposit was paid. */
  due?: Money;
  /** The discount of a code, taken off its price. */
  discount?: { code: string; amount: number };
  /** What was given back when it was cancelled. */
  refunded?: Money;
  /** When whoever booked was reminded of it, ISO. */
  reminded?: string;
  /** Whether they came: arrived (when, in `arrived`), or did not. Not said, not known yet. */
  attended?: 'arrived' | 'no-show';
  arrived?: string;
  /** The id its series shares, when it is one of several the same day of the week. */
  series?: string;
  /** The id of the member of a roster it is given to, when it is a turn of one. */
  member?: string;
  /** How many places it takes together, when more than one: the tickets of a concert. */
  places?: number;
  /** The resources it takes, when more than one: the seats of a cinema, `resource` the first of them. */
  seats?: string[];
  /** How many times it has changed (moved, corrected, cancelled): its invitation's version, for calendars to update it. */
  sequence?: number;
  created: string;
}

export const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];
export const PLACE_KINDS: readonly Place['kind'][] = ['in-person', 'phone', 'video', 'custom'];
export const QUESTION_KINDS: readonly Question['kind'][] = ['text', 'long', 'phone'];
export const FIELD_KINDS: readonly ResourceField['kind'][] = ['text', 'number', 'yes-no'];
export const DURATIONS = [15, 30, 45, 60, 90] as const;

/** A booking again, the same day of the week and the same hour: every `every` weeks, `count` times or until a day. */
export interface Repeat {
  /** Every how many weeks; one unless said. */
  every: number;
  /** How many times, the first one counted. */
  count?: number;
  /** Until which day, as the owner's clock says it, that one counted. */
  until?: string;
}
