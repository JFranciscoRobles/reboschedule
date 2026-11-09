// The demos, each a case of use with its own people: an agent who gives
// calls and visits, a padel club, an office with meeting rooms, and the
// office's shifts. What each one is, what to try in it, and what it has
// booked when it begins, laid out around today.

import { icsBusy } from '@reboschedule/calendars';
import {
  addDays,
  assignRoster,
  type Booking,
  clockAt,
  type EventType,
  instantOf,
  seatsOf,
  type Locale,
  newId,
  occurrencesOf,
  quoteOf,
  sampleEventTypes,
  sampleSchedule,
  type Schedule,
  startsOn,
} from '@reboschedule/core';
import type { DemoData } from './demo';
import type { L } from './i18n';

export type ScenarioId = 'appointments' | 'courts' | 'rooms' | 'shifts' | 'classes' | 'clinic' | 'cabins' | 'barber' | 'tickets';

export interface Scenario {
  id: ScenarioId;
  title: L;
  /** One line, for its card. */
  lead: L;
  /** Who uses it and for what, above the demo. */
  story: L;
  /** Who books, and who looks after it. */
  visitor: L;
  owner: L;
  /** What to try, in order. */
  tries: L[];
  color: string;
  /** An icon of 24 by 24, its paths drawn with the current colour. */
  icon: string;
  data: (locale: Locale, timeZone: string) => DemoData;
}

const PEOPLE = ['Ana López', 'Beto Ruiz', 'Carla Gómez', 'Diego Soto', 'Elena Paz', 'Fer Castro', 'Gael Ríos', 'Hilda Mora', 'Iván Cruz', 'Julia Vega'];
const emailOf = (name: string) =>
  `${name
    .split(' ')[0]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z]/g, '')}@example.com`;
/** The same choices each time the demo begins: a number of 0 to 1 for each place of each day. */
const chance = (...n: number[]) => {
  let h = 2166136261;
  for (const x of n) h = Math.imul(h ^ (x + 97), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

/** The bookings of a kind from `from` to `to` days from today, where `fill` says so: who, at each start of each day. */
function seed(type: EventType, data: Omit<DemoData, 'seed'>, from: number, to: number, fill: (day: number, start: number, place: number) => boolean, length = type.duration) {
  const out: Booking[] = [];
  const today = clockAt(Date.now(), data.schedule.timeZone).day;
  const places = type.resources.length ? type.resources.map((r) => r.id) : Array.from({ length: type.capacity }, () => '');
  let n = 0;
  for (let i = from; i <= to; i++) {
    const day = addDays(today, i);
    for (const [p, resource] of places.entries()) {
      // Each place busy until the end of what it has, so nothing is booked over anything.
      let until = 0;
      for (const [j, t] of startsOn(type, data.schedule, day, length).entries()) {
        if (t.start < until || !fill(i, j, p)) continue;
        const name = PEOPLE[(((n++ * 7 + i + p) % PEOPLE.length) + PEOPLE.length) % PEOPLE.length];
        until = t.start + length * 60_000;
        out.push({
          id: `seed-${type.id}-${i}-${j}-${p}`,
          type: type.id,
          resource,
          start: new Date(t.start).toISOString(),
          end: new Date(until).toISOString(),
          name,
          email: emailOf(name),
          timeZone: data.schedule.timeZone,
          answers: {},
          status: 'confirmed',
          created: new Date().toISOString(),
        });
      }
    }
  }
  return out;
}

/** When the evening begins, 18:00 as the club's clock says it, on the day of an instant. */
const eveningOf = (start: string, timeZone: string) => Date.parse(start) + (18 * 60 - clockAt(Date.parse(start), timeZone).minute) * 60_000;

/** The clinic's doctor's own Google Calendar, as its secret iCal address gives it, around today: what `icsBusy` reads. */
function doctorsCalendar(timeZone: string) {
  const today = clockAt(Date.now(), timeZone).day;
  // The n-th weekday from today (0 is the next one, today if it is one): her calendar is of the days she works.
  const workday = (n: number) => {
    let d = today;
    for (let k = -1; ; d = addDays(d, 1)) {
      const w = new Date(`${d}T12:00:00Z`).getUTCDay();
      if (w !== 0 && w !== 6 && ++k === n) return d;
    }
  };
  const at = (n: number, hhmm: string) => `${workday(n).replace(/-/g, '')}T${hhmm.replace(':', '')}00`;
  const event = (lines: string[]) => ['BEGIN:VEVENT', `UID:${newId()}@google.com`, ...lines, 'END:VEVENT'];
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Google Inc//Google Calendar 70.9054//EN',
    ...event([`DTSTART;TZID=${timeZone}:${at(1, '10:00')}`, `DTEND;TZID=${timeZone}:${at(1, '11:30')}`, 'SUMMARY:Comida con proveedores']),
    ...event([`DTSTART;TZID=${timeZone}:${at(2, '16:00')}`, `DTEND;TZID=${timeZone}:${at(2, '18:30')}`, 'SUMMARY:Cirugía en el Hospital Ángeles']),
    ...event([`DTSTART;VALUE=DATE:${workday(5).replace(/-/g, '')}`, `DTEND;VALUE=DATE:${addDays(workday(5), 1).replace(/-/g, '')}`, 'SUMMARY:Congreso de ortodoncia']),
    ...event([`DTSTART;TZID=${timeZone}:${at(0, '12:00')}`, `DTEND;TZID=${timeZone}:${at(0, '13:00')}`, 'RRULE:FREQ=WEEKLY;COUNT=8', 'SUMMARY:Junta de clínica']),
    ...event([`DTSTART;TZID=${timeZone}:${at(3, '09:00')}`, `DTEND;TZID=${timeZone}:${at(3, '09:30')}`, 'TRANSP:TRANSPARENT', 'SUMMARY:Recordatorio: pedir material']),
    'END:VCALENDAR',
  ].join('\r\n');
}

/** The hours of a clinic: weekdays, a morning and an afternoon. */
const clinicHours = (timeZone: string): Schedule => {
  const day = [
    { from: '09:00', to: '14:00' },
    { from: '16:00', to: '19:00' },
  ];
  return { timeZone, weekly: { 0: [], 1: day, 2: day, 3: day, 4: day, 5: day, 6: [] }, dates: {} };
};

/** A picture drawn as data: a cabin among pines, in its colour. */
const cabinPicture = (color: string, pines = 2) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 132"><rect width="240" height="132" rx="26" fill="#e9f1ea"/><path d="M0 108h240v24H0z" fill="#cfe0d1"/>${Array.from({ length: pines }, (_, i) => `<path d="M${30 + i * 170} 104l18-50 18 50z" fill="#2f6b45"/>`).join('')}<path d="M70 108V70l50-34 50 34v38z" fill="${color}"/><path d="M62 72l58-42 58 42" fill="none" stroke="#3b2a1f" stroke-width="7" stroke-linejoin="round"/><rect x="108" y="80" width="24" height="28" rx="3" fill="#3b2a1f"/><rect x="82" y="76" width="16" height="14" rx="2" fill="#fde68a"/><rect x="142" y="76" width="16" height="14" rx="2" fill="#fde68a"/></svg>`,
  )}`;

/** A barber's face drawn as data: their initials in their colour. */
const avatar = (initials: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 132"><rect width="240" height="132" rx="26" fill="${color}"/><circle cx="120" cy="66" r="40" fill="#fff" fill-opacity=".18"/><text x="120" y="82" text-anchor="middle" font-family="Georgia,serif" font-size="46" font-weight="700" fill="#fff">${initials}</text></svg>`)}`;

/** A poster drawn as data: a title on its gradient. */
const poster = (title: string, from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 340"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="240" height="340" rx="18" fill="url(#g)"/><circle cx="190" cy="60" r="46" fill="#fff" fill-opacity=".15"/><text x="20" y="128" font-family="Arial Black,Arial,sans-serif" font-size="22" font-weight="900" fill="#fff">${title}</text></svg>`,
  )}`;

/** The instant a clock shows a day and a minute, as a number. */
const clockInstant = (day: string, minute: number, timeZone: string) => instantOf(day, minute, timeZone) ?? Date.parse(`${day}T12:00:00Z`);

const kind = (locale: Locale, id: string) => sampleEventTypes(locale).find((t) => t.id === id)!;

export const SCENARIOS: Scenario[] = [
  {
    id: 'appointments',
    title: { en: 'An agent’s appointments', es: 'Citas de un asesor' },
    lead: { en: 'A first call and visits to homes, in their hours, never two at once.', es: 'Una primera llamada y visitas a propiedades, en su horario, nunca dos a la vez.' },
    story: {
      en: 'Laura sells homes. Whoever is interested books a call of thirty minutes, or a visit of an hour with time kept free to get there; she sees her week and moves what she must.',
      es: 'Laura vende casas. Quien se interesa agenda una llamada de treinta minutos, o una visita de una hora con tiempo libre para llegar; ella ve su semana y mueve lo que haga falta.',
    },
    visitor: { en: 'Whoever books', es: 'Quien agenda' },
    owner: { en: 'Laura, the agent', es: 'Laura, la asesora' },
    tries: [
      { en: 'Book a visit: the hour around it stays free.', es: 'Agenda una visita: la hora alrededor queda libre.' },
      { en: 'Change the time zone: the times are said in yours.', es: 'Cambia la zona horaria: los horarios se dicen en la tuya.' },
      { en: 'Go to Laura’s calendar and move it to another day.', es: 'Ve al calendario de Laura y muévela a otro día.' },
    ],
    color: '#0e7490',
    icon: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    data: (locale, timeZone) => {
      const base = { organizer: { name: 'Laura Méndez', email: 'laura@example.com' }, schedule: sampleSchedule(timeZone), types: [kind(locale, 'call'), kind(locale, 'visit')] };
      return {
        ...base,
        seed: () => {
          const calls = seed(base.types[0], base, -5, 12, (i, j) => chance(1, i, j) < 0.18);
          // Visits only where no call is, nor the half hour kept free around them.
          const near = (b: Booking) => calls.some((c) => Date.parse(c.start) < Date.parse(b.end) + 30 * 60_000 && Date.parse(c.end) > Date.parse(b.start) - 30 * 60_000);
          return [...calls, ...seed(base.types[1], base, -5, 12, (i, j) => chance(2, i, j) < 0.2).filter((v) => !near(v))];
        },
      };
    },
  },
  {
    id: 'courts',
    title: { en: 'Sports courts', es: 'Canchas deportivas' },
    lead: {
      en: 'Five padel courts, each with its price, for an hour, an hour and a half or two; the evening costs more.',
      es: 'Cinco canchas de pádel, cada una con su precio, por una hora, hora y media o dos; en la noche cuesta más.',
    },
    story: {
      en: 'A club with five courts, two of them covered, open every day. Players choose a court or any free, and for how long; the club sees each court’s day.',
      es: 'Un club con cinco canchas, dos techadas, abierto todos los días. Quien juega elige una cancha o cualquiera libre, y por cuánto tiempo; el club ve el día de cada cancha.',
    },
    visitor: { en: 'A player', es: 'Quien juega' },
    owner: { en: 'The club', es: 'El club' },
    tries: [
      { en: 'Choose a covered court and two hours: only its times are left.', es: 'Elige una cancha techada y dos horas: quedan solo sus horarios.' },
      { en: 'From 18:00 an hour costs a hundred more: each time says its price.', es: 'Desde las 18:00 la hora cuesta $100 más: cada horario dice su precio.' },
      { en: 'In the club’s calendar, open a day’s gaps and give one away.', es: 'En el calendario del club, abre los huecos de un día y aparta uno.' },
    ],
    color: '#15803d',
    icon: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 12h16M12 3v18"/>',
    data: (locale, timeZone) => {
      const base = { organizer: { name: 'Club Rebo', email: 'club@example.com' }, schedule: sampleSchedule(timeZone), types: [kind(locale, 'court')] };
      return {
        ...base,
        seed: () => seed(base.types[0], base, -3, 9, (i, j, p) => chance(3, i, j, p) < (i < 3 ? 0.45 : 0.2), 90),
        // The evening costs a hundred more each hour of it: a rule of the club's own, over the courts' prices.
        quote: ({ type, resource, start, length }) => {
          const price = quoteOf(type, { resource, length });
          if (!price) return null;
          const from = Date.parse(start);
          const evening = Math.max(0, from + length * 60_000 - Math.max(from, eveningOf(start, timeZone))) / 3_600_000;
          return { ...price, amount: price.amount + Math.round(evening * 100) };
        },
      };
    },
  },
  {
    id: 'rooms',
    title: { en: 'Meeting rooms', es: 'Salas de juntas' },
    lead: { en: 'Five rooms of different sizes, from half an hour to three, on weekdays.', es: 'Cinco salas de distintos tamaños, de media hora a tres, entre semana.' },
    story: {
      en: 'An office shares its rooms. Whoever needs one picks it by how many people it holds, and for how long; the office sees who has each, and when.',
      es: 'Una oficina comparte sus salas. Quien necesita una la elige por cuántas personas caben, y por cuánto tiempo; la oficina ve quién tiene cada una, y cuándo.',
    },
    visitor: { en: 'Whoever needs a room', es: 'Quien necesita sala' },
    owner: { en: 'The office', es: 'La oficina' },
    tries: [
      { en: 'Choose the Board room for three hours.', es: 'Elige la Sala Ejecutiva por tres horas.' },
      { en: 'Saturday and Sunday are closed: the calendar has no gaps there.', es: 'Sábado y domingo están cerradas: el calendario no tiene huecos ahí.' },
      { en: 'Open a booking in the calendar and change who has it.', es: 'Abre una reserva en el calendario y cambia quién la tiene.' },
    ],
    color: '#7c3aed',
    icon: '<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 16v4M17 16v4M7 8V5M17 8V5"/>',
    data: (locale, timeZone) => {
      const base = { organizer: { name: locale === 'es' ? 'Oficina Rebo' : 'Rebo office', email: 'office@example.com' }, schedule: sampleSchedule(timeZone), types: [kind(locale, 'room')] };
      return { ...base, seed: () => seed(base.types[0], base, -3, 9, (i, j, p) => chance(4, i, j, p) < 0.12, 60) };
    },
  },
  {
    id: 'shifts',
    title: { en: 'Office shifts', es: 'Guardias' },
    lead: {
      en: 'Two divisions, two turns a day, one agent each: the month given automatically or by hand, and the agents swapping among themselves.',
      es: 'Dos divisiones, dos turnos al día, un asesor en cada uno: el mes asignado automático o a mano, y los asesores cambiando entre ellos.',
    },
    story: {
      en: 'A real estate office keeps guard at its front desk in two divisions, residential and commercial, each with its group of agents. Every day each division has a turn from 10 to 2 and one from 2 to 7. The coordinator gives the month, automatically by who can or by hand; the agents look at their turns, say the days they cannot, and ask each other for changes.',
      es: 'Una inmobiliaria cubre su recepción en dos divisiones, residencial y comercial, cada una con su grupo de asesores. Cada día cada división tiene un turno de 10 a 2 y uno de 2 a 7. Quien coordina asigna el mes, automáticamente según quién puede o a mano; los asesores ven sus guardias, dicen qué días no pueden, y se piden cambios entre ellos.',
    },
    visitor: { en: 'An agent', es: 'Un asesor' },
    owner: { en: 'Who coordinates', es: 'Quien coordina' },
    tries: [
      {
        en: 'As Ana, accept the change Beto asked you: both are told, the invitation updated.',
        es: 'Como Ana, acepta el cambio que te pidió Beto: a los dos se les avisa, con la invitación actualizada.',
      },
      {
        en: 'Mark the days you cannot, then, as the coordinator, give the rest of the month again.',
        es: 'Marca los días que no puedes; luego, como quien coordina, vuelve a asignar lo que falta del mes.',
      },
      { en: 'Change a turn by hand from the roster.', es: 'Cambia un turno a mano desde el rol.' },
    ],
    color: '#c2410c',
    icon: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    data: (locale, timeZone) => {
      const es = locale === 'es';
      const turns = [
        { from: '10:00', to: '14:00' },
        { from: '14:00', to: '19:00' },
      ];
      const shift: EventType = {
        ...kind(locale, 'shift'),
        description: es ? 'Recepción de la oficina: de 10 a 2 y de 2 a 7, un asesor por turno en cada división.' : 'The front desk: 10 to 2 and 2 to 7, one agent a turn in each division.',
        hours: { 0: turns, 1: turns, 2: turns, 3: turns, 4: turns, 5: turns, 6: turns },
        whole: true,
        duration: 60,
        increment: 60,
        capacity: 1,
        horizon: 62,
        resources: [
          { id: 'res', name: es ? 'Residencial' : 'Residential', image: '', values: {}, price: null },
          { id: 'com', name: es ? 'Comercial' : 'Commercial', image: '', values: {}, price: null },
        ],
      };
      const member = (id: string, name: string, group: string) => ({ id, name, email: emailOf(name), group });
      const members = [
        member('ana', 'Ana López', 'res'),
        member('beto', 'Beto Ruiz', 'res'),
        member('carla', 'Carla Gómez', 'res'),
        member('hilda', 'Hilda Mora', 'res'),
        member('diego', 'Diego Soto', 'com'),
        member('elena', 'Elena Paz', 'com'),
        member('fer', 'Fer Castro', 'com'),
      ];
      const today = clockAt(Date.now(), timeZone).day;
      const month = today.slice(0, 7);
      // Days some cannot, this month and the next.
      const unavailable = () => ({
        carla: [addDays(today, 3), addDays(today, 4)],
        diego: [addDays(today, 6)],
        hilda: [addDays(today, 10), addDays(today, 11), addDays(today, 12)],
      });
      const base = { organizer: { name: es ? 'Inmobiliaria Rebo' : 'Rebo Realty', email: 'office@example.com' }, schedule: sampleSchedule(timeZone), types: [shift] };
      const seedRoster = () => {
        const next = addDays(`${month}-01`, 40).slice(0, 7);
        const first = assignRoster({ type: shift, schedule: base.schedule, month, members, unavailable: unavailable() });
        const second = assignRoster({ type: shift, schedule: base.schedule, month: next, members, unavailable: unavailable() });
        return [...first.bookings, ...second.bookings];
      };
      let seeded: Booking[] | null = null;
      const bookings = () => (seeded ??= seedRoster());
      return {
        ...base,
        seed: () => (seeded = seedRoster()),
        roster: {
          members,
          unavailable,
          // Beto asks Ana to swap his next turn for hers.
          swaps: () => {
            const all = bookings();
            const upcoming = (id: string) => all.filter((b) => b.member === id && b.start > new Date().toISOString()).sort((x, y) => x.start.localeCompare(y.start));
            const [beto] = upcoming('beto');
            // Hers on another day, so the swap is of two days.
            const ana = upcoming('ana').find((b) => beto && clockAt(Date.parse(b.start), timeZone).day !== clockAt(Date.parse(beto.start), timeZone).day);
            return beto && ana ? [{ id: 'swap-1', from: beto.id, to: ana.id, by: 'beto', with: 'ana', status: 'pending' as const, created: new Date().toISOString() }] : [];
          },
        },
      };
    },
  },
  {
    id: 'classes',
    title: { en: 'Weekly classes', es: 'Clases semanales' },
    lead: { en: 'Twelve places a class, booked once or every week: the weeks that are full are said.', es: 'Doce lugares por clase, reservada una vez o cada semana: las semanas llenas se dicen.' },
    story: {
      en: 'A yoga studio gives its classes at seven, at seven again in the evening, and on Saturday morning. Whoever comes takes a place once, or every week for a month or two; the studio sees each class and who comes.',
      es: 'Un estudio de yoga da sus clases a las siete, otra vez a las siete de la noche, y el sábado en la mañana. Quien viene toma un lugar una vez, o cada semana por uno o dos meses; el estudio ve cada clase y quién viene.',
    },
    visitor: { en: 'Whoever comes', es: 'Quien viene' },
    owner: { en: 'The studio', es: 'El estudio' },
    tries: [
      {
        en: 'Take a class every week for eight weeks: those that are full are left out, and said.',
        es: 'Toma una clase cada semana por ocho semanas: las que están llenas se dejan fuera, y se dicen.',
      },
      { en: 'Look at the messages: one for the whole series, its invitation attached.', es: 'Mira los avisos: uno por toda la serie, con su invitación adjunta.' },
      { en: 'As the studio, delete one class of a series, or the rest of it.', es: 'Como el estudio, elimina una clase de una serie, o las que siguen.' },
    ],
    color: '#be185d',
    icon: '<path d="M12 4a2 2 0 1 0 0 .01M6 20l3-6 3 2 3-2 3 6M8 10h8"/>',
    data: (locale, timeZone) => {
      const es = locale === 'es';
      const morningAndEvening = [
        { from: '07:00', to: '08:00' },
        { from: '19:00', to: '20:00' },
      ];
      const yoga: EventType = {
        ...kind(locale, 'call'),
        id: 'class',
        slug: es ? 'clase' : 'class',
        title: es ? 'Yoga en grupo' : 'Group yoga',
        description: es ? 'Una hora, doce lugares. Trae tu tapete.' : 'An hour, twelve places. Bring your mat.',
        duration: 60,
        increment: 60,
        after: 0,
        notice: 60,
        horizon: 60,
        place: { kind: 'in-person', value: es ? 'Estudio Rebo, Calle Ocho 8' : 'Rebo Studio, 8 Eighth Street' },
        hours: { 0: [], 1: morningAndEvening, 2: [], 3: morningAndEvening, 4: [], 5: morningAndEvening, 6: [{ from: '09:00', to: '10:00' }] },
        capacity: 12,
        series: 8,
        price: { amount: 120, currency: 'MXN', per: 'booking' },
        questions: [],
        color: '#be185d',
      };
      const base = { organizer: { name: es ? 'Estudio Rebo' : 'Rebo Studio', email: 'studio@example.com' }, schedule: sampleSchedule(timeZone), types: [yoga] };
      return {
        ...base,
        seed: () => {
          const some = seed(yoga, base, -7, 14, (i, j, p) => chance(6, i, j, p) < (i < 2 ? 0.75 : 0.4));
          // Ana comes every Monday morning: a series of six.
          const monday = startsOn(yoga, base.schedule, [...Array(7)].map((_, n) => addDays(clockAt(Date.now(), timeZone).day, n + 1)).find((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 1)!)[0];
          const series = newId();
          const ana = occurrencesOf(new Date(monday.start).toISOString(), 60, { every: 1, count: 6 }, timeZone).map(
            (t, n): Booking => ({
              id: `ana-${n}`,
              type: 'class',
              resource: '',
              start: t.start,
              end: t.end,
              name: 'Ana López',
              email: 'ana@example.com',
              timeZone,
              answers: {},
              status: 'confirmed',
              created: '',
              series,
              price: { amount: 120, currency: 'MXN' },
            }),
          );
          return [...some, ...ana];
        },
      };
    },
  },
  {
    id: 'clinic',
    title: { en: 'A clinic', es: 'Consultorio' },
    lead: {
      en: 'The doctor’s own Google Calendar read as busy: her congress, her surgery, her weekly meeting are never offered.',
      es: 'El Google Calendar de la doctora leído como ocupado: su congreso, su cirugía, su junta semanal nunca se ofrecen.',
    },
    story: {
      en: 'A dentist gives consultations of half an hour. Her own calendar is in Google: it is read by its secret address, and what is in it is busy. When she moves or cancels a consultation, the patient is told, and their calendar changes it.',
      es: 'Una dentista da consultas de media hora. Su propio calendario está en Google: se lee por su dirección secreta, y lo que hay en él está ocupado. Cuando mueve o cancela una consulta, se le avisa al paciente, y su calendario la cambia.',
    },
    visitor: { en: 'A patient', es: 'Un paciente' },
    owner: { en: 'The doctor', es: 'La doctora' },
    tries: [
      { en: 'As the doctor, look at the day: what is in her Google is there, striped.', es: 'Como la doctora, mira el día: lo de su Google está ahí, rayado.' },
      { en: 'Disconnect her Google: those hours are offered to patients again.', es: 'Desconecta su Google: esas horas se vuelven a ofrecer a los pacientes.' },
      { en: 'Move a consultation, and read the message the patient gets.', es: 'Mueve una consulta, y lee el aviso que le llega al paciente.' },
    ],
    color: '#0369a1',
    icon: '<path d="M7 3c-2 0-3 2-3 4 0 4 2 5 2 9 0 2 1 5 2 5s1-4 2-6c1-1 3-1 4 0 1 2 1 6 2 6s2-3 2-5c0-4 2-5 2-9 0-2-1-4-3-4-2 0-3 1-5 1S9 3 7 3z"/>',
    data: (locale, timeZone) => {
      const es = locale === 'es';
      const consult: EventType = {
        ...kind(locale, 'call'),
        id: 'consult',
        slug: es ? 'consulta' : 'consultation',
        title: es ? 'Consulta dental' : 'Dental consultation',
        description: es ? 'Revisión, limpieza o una molestia: media hora.' : 'A check-up, a cleaning or a pain: half an hour.',
        duration: 30,
        increment: 30,
        before: 0,
        after: 0,
        notice: 120,
        horizon: 30,
        perDay: null,
        place: { kind: 'in-person', value: es ? 'Consultorio 204, Torre Médica Rebo' : 'Office 204, Rebo Medical Tower' },
        price: { amount: 700, currency: 'MXN', per: 'booking' },
        questions: [{ id: 'reason', label: es ? 'Motivo de la consulta' : 'What it is for', kind: 'text', required: true }],
        color: '#0369a1',
      };
      const base = { organizer: { name: es ? 'Dra. Sofía Ruiz' : 'Dr. Sofía Ruiz', email: 'sofia@example.com' }, schedule: clinicHours(timeZone), types: [consult] };
      const from = new Date(Date.now() - 2 * 86_400_000).toISOString();
      const to = new Date(Date.now() + 40 * 86_400_000).toISOString();
      const ics = doctorsCalendar(timeZone);
      return {
        ...base,
        away: () => icsBusy(ics, { from, to, timeZone }),
        seed: () => {
          const away = icsBusy(ics, { from, to, timeZone });
          const touches = (b: Booking) => away.some((a) => Date.parse(a.start) < Date.parse(b.end) && Date.parse(a.end) > Date.parse(b.start));
          return seed(consult, base, -3, 10, (i, j) => chance(7, i, j) < 0.22)
            .filter((b) => !touches(b))
            .map((b) => ({ ...b, answers: { reason: es ? 'Limpieza' : 'Cleaning' } }));
        },
      };
    },
  },
  {
    id: 'cabins',
    title: { en: 'Cabins', es: 'Cabañas' },
    lead: {
      en: 'Four cabins by the night, two to seven: the arrival and the departure chosen on the month, the price of each night.',
      es: 'Cuatro cabañas por noche, de dos a siete: la llegada y la salida elegidas en el mes, el precio de cada noche.',
    },
    story: {
      en: 'Cabins in the woods, each for so many people, one with a hot tub. Whoever comes chooses the day they arrive and the day they leave; each night is checked, and the cabin that has all of them is theirs. The owners see each cabin’s nights in a strip.',
      es: 'Cabañas en el bosque, cada una para tantas personas, una con jacuzzi. Quien viene elige el día que llega y el día que se va; se revisa cada noche, y la cabaña que tiene todas es la suya. Los dueños ven las noches de cada cabaña en una tira.',
    },
    visitor: { en: 'A guest', es: 'Un huésped' },
    owner: { en: 'The cabins', es: 'Las cabañas' },
    tries: [
      { en: 'Choose a cabin, then the day you arrive and the day you leave: the nights and the total.', es: 'Elige una cabaña, luego el día que llegas y el que te vas: las noches y el total.' },
      { en: 'Ask for a single night: it is two at the least.', es: 'Pide una sola noche: son dos como mínimo.' },
      { en: 'As the owners, see each cabin’s month as a strip.', es: 'Como los dueños, mira el mes de cada cabaña como una tira.' },
    ],
    color: '#15803d',
    icon: '<path d="M3 20h18M5 20V11l7-6 7 6v9M10 20v-5h4v5"/>',
    data: (locale, timeZone) => {
      const es = locale === 'es';
      const cabin = (id: string, name: string, people: number, price: number, color: string, tub = false) => ({ id, name, image: cabinPicture(color, tub ? 1 : 2), values: { people, tub }, price });
      const stay: EventType = {
        ...kind(locale, 'call'),
        id: 'stay',
        slug: es ? 'cabana' : 'cabin',
        title: es ? 'Cabaña en el bosque' : 'A cabin in the woods',
        description: es ? 'Entrada a las 3 de la tarde, salida a las 12. De dos a siete noches.' : 'In at 3 in the afternoon, out at 12. Two to seven nights.',
        notice: 0,
        horizon: 120,
        stay: { unit: 'night', min: 2, max: 7, checkIn: '15:00', checkOut: '12:00' },
        place: { kind: 'in-person', value: es ? 'Cabañas Rebo, camino a la sierra km 12' : 'Rebo Cabins, mountain road km 12' },
        price: { amount: 1800, currency: 'MXN', per: 'night' },
        // A third when booked, the rest when they arrive; all back two weeks before, half three days before; moved until three days before.
        deposit: 30,
        refunds: [
          { hours: 14 * 24, percent: 100 },
          { hours: 3 * 24, percent: 50 },
        ],
        reschedule: 72,
        fields: [
          { id: 'people', label: es ? 'Para' : 'For', kind: 'number', unit: es ? 'personas' : 'people' },
          { id: 'tub', label: 'Jacuzzi', kind: 'yes-no', unit: '' },
        ],
        resources: [
          cabin('pino', 'Pino', 2, 1800, '#a16207'),
          cabin('roble', 'Roble', 4, 2400, '#92400e'),
          cabin('encino', 'Encino', 6, 3200, '#7c2d12'),
          cabin('cedro', 'Cedro', 2, 2800, '#9f1239', true),
        ],
        questions: [],
        color: '#15803d',
      };
      const base = { organizer: { name: es ? 'Cabañas Rebo' : 'Rebo Cabins', email: 'cabins@example.com' }, schedule: sampleSchedule(timeZone), types: [stay] };
      return {
        pays: true,
        coupons: [{ code: 'BOSQUE10', label: es ? '10% en tu estancia' : '10% off your stay', percent: 10 }],
        ...base,
        seed: () => {
          const today = clockAt(Date.now(), timeZone).day;
          const out: Booking[] = [];
          for (const [p, r] of stay.resources.entries()) {
            // Each cabin, stays of two to four nights, a gap of some nights between them.
            for (let d = Math.floor(chance(8, p) * 4) - 3, n = 0; d < 70; n++) {
              const nights = 2 + Math.floor(chance(9, p, n) * 3);
              const gap = 1 + Math.floor(chance(10, p, n) * 5);
              const arrive = addDays(today, d);
              const leave = addDays(arrive, nights);
              const name = PEOPLE[(p * 3 + n) % PEOPLE.length];
              out.push({
                id: `seed-stay-${p}-${n}`,
                type: 'stay',
                resource: r.id,
                start: new Date(clockInstant(arrive, 15 * 60, timeZone)).toISOString(),
                end: new Date(clockInstant(leave, 12 * 60, timeZone)).toISOString(),
                name,
                email: emailOf(name),
                timeZone,
                answers: {},
                status: 'confirmed',
                created: '',
                price: { amount: (r.price ?? 1800) * nights, currency: 'MXN' },
              });
              d += nights + gap;
            }
          }
          return out;
        },
      };
    },
  },
  {
    id: 'barber',
    title: { en: 'A barbershop', es: 'Barbería' },
    lead: { en: 'Three barbers, each their own days and hours; three services that share them.', es: 'Tres barberos, cada uno con sus días y sus horas; tres servicios que los comparten.' },
    story: {
      en: 'A barbershop with three barbers who do not come the same days nor the same hours. Whoever comes chooses the service, then a barber or the first free; a cut with one takes him for a beard trim too. The shop sees each barber’s day, the hours he is not there striped.',
      es: 'Una barbería con tres barberos que no vienen los mismos días ni a las mismas horas. Quien viene elige el servicio, luego un barbero o el primero libre; un corte con uno lo ocupa también para una barba. La barbería ve el día de cada barbero, rayadas las horas en que no está.',
    },
    visitor: { en: 'A client', es: 'Un cliente' },
    owner: { en: 'The shop', es: 'La barbería' },
    tries: [
      { en: 'Choose a cut with Memo: he only comes in the mornings, Monday to Friday.', es: 'Elige un corte con Memo: solo viene en las mañanas, de lunes a viernes.' },
      { en: 'Choose “the first free”: each time says who.', es: 'Elige “el primero libre”: cada horario dice con quién.' },
      { en: 'As the shop, see the day: a column for each barber, his hours off striped.', es: 'Como la barbería, mira el día: una columna por barbero, sus horas libres rayadas.' },
    ],
    color: '#1e293b',
    icon: '<path d="M6 3l12 18M18 3L6 21M8 7a2 2 0 1 0 0-.01M16 7a2 2 0 1 0 0-.01"/>',
    data: (locale, timeZone) => {
      const es = locale === 'es';
      const week = (h: { from: string; to: string }[], days: number[]) => Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, days.includes(d) ? h : []])) as EventType['hours'] & object;
      const barbers = [
        { id: 'tono', name: 'Toño', image: avatar('T', '#b45309'), values: { since: es ? 'Clásico' : 'Classic' }, price: null, hours: week([{ from: '10:00', to: '19:00' }], [2, 3, 4, 5, 6]) },
        { id: 'memo', name: 'Memo', image: avatar('M', '#0f766e'), values: { since: es ? 'Degradados' : 'Fades' }, price: null, hours: week([{ from: '09:00', to: '14:00' }], [1, 2, 3, 4, 5]) },
        {
          id: 'pau',
          name: 'Pau',
          image: avatar('P', '#7c3aed'),
          values: { since: es ? 'Barba y diseño' : 'Beards and designs' },
          price: null,
          hours: week([{ from: '13:00', to: '20:00' }], [0, 3, 4, 5, 6]),
        },
      ];
      const service = (id: string, slug: string, title: string, minutes: number, price: number): EventType => ({
        ...kind(locale, 'call'),
        id,
        slug,
        title,
        description: `${minutes} min`,
        duration: minutes,
        increment: 15,
        after: 0,
        notice: 30,
        horizon: 21,
        place: { kind: 'in-person', value: es ? 'Rebo Barber, Av. Revolución 1010' : 'Rebo Barber, 1010 Revolución Ave.' },
        hours: week([{ from: '09:00', to: '20:00' }], [0, 1, 2, 3, 4, 5, 6]),
        price: { amount: price, currency: 'MXN', per: 'booking' },
        fields: [{ id: 'since', label: es ? 'Especialidad' : 'Speciality', kind: 'text', unit: '' }],
        resources: barbers,
        questions: [{ id: 'whatsapp', label: 'WhatsApp', kind: 'phone', required: false }],
        reschedule: 2,
        color: '#1e293b',
      });
      const types = [
        service('cut', es ? 'corte' : 'cut', es ? 'Corte' : 'Haircut', 30, 250),
        service('beard', es ? 'barba' : 'beard', es ? 'Barba' : 'Beard trim', 20, 150),
        service('both', es ? 'corte-y-barba' : 'cut-and-beard', es ? 'Corte y barba' : 'Cut and beard', 50, 350),
      ];
      const base = { organizer: { name: 'Rebo Barber', email: 'barber@example.com' }, schedule: sampleSchedule(timeZone), types };
      return {
        coupons: [{ code: 'PRIMERA', label: es ? '$50 menos en tu primera visita' : '$50 off your first visit', amount: 50 }],
        ...base,
        seed: () => {
          const out: Booking[] = [];
          const today = clockAt(Date.now(), timeZone).day;
          for (let i = -2; i <= 8; i++) {
            const day = addDays(today, i);
            for (const [p, b] of barbers.entries()) {
              let until = 0;
              for (const t of startsOn({ ...types[0], resources: [b], hours: b.hours }, base.schedule, day)) {
                if (t.start < until || chance(11, i, p, t.minute) > 0.38) continue;
                const svc = types[Math.floor(chance(12, i, p, t.minute) * 3)];
                const end = t.start + svc.duration * 60_000;
                if (clockAt(end, timeZone).minute > 20 * 60) continue;
                until = end;
                const name = PEOPLE[(i * 5 + p * 3 + t.minute) % PEOPLE.length < 0 ? 0 : (i * 5 + p * 3 + t.minute) % PEOPLE.length];
                out.push({
                  id: `seed-${svc.id}-${i}-${p}-${t.minute}`,
                  type: svc.id,
                  resource: b.id,
                  start: new Date(t.start).toISOString(),
                  end: new Date(end).toISOString(),
                  name,
                  email: emailOf(name),
                  timeZone,
                  answers: {},
                  status: 'confirmed',
                  created: '',
                  price: { amount: svc.price!.amount, currency: 'MXN' },
                });
              }
            }
          }
          return out;
        },
      };
    },
  },
  {
    id: 'tickets',
    title: { en: 'Box office', es: 'Taquilla' },
    lead: {
      en: 'A cinema’s seats, each one, three shows a day; and a jazz night every Saturday, its general floor and its VIP.',
      es: 'Los asientos de un cine, cada uno, tres funciones al día; y una noche de jazz cada sábado, con general y VIP.',
    },
    story: {
      en: 'A small cinema sells its seats by the show: whoever comes chooses theirs on the room, the back rows dearer. And every Saturday a jazz night, sold by zone: so many places on the general floor, fewer in the VIP. The box office sees each show, how full, and what it made.',
      es: 'Un cine pequeño vende sus asientos por función: quien viene elige los suyos en la sala, las filas de atrás más caras. Y cada sábado una noche de jazz, vendida por zona: tantos lugares en general, menos en VIP. La taquilla ve cada función, qué tan llena, y cuánto vendió.',
    },
    visitor: { en: 'Whoever buys', es: 'Quien compra' },
    owner: { en: 'The box office', es: 'La taquilla' },
    tries: [
      { en: 'Choose a show and three seats together: the total is each seat’s price.', es: 'Elige una función y tres asientos juntos: el total es el precio de cada asiento.' },
      { en: 'Buy four tickets of the VIP for the jazz night: only as many as are left.', es: 'Compra cuatro boletos VIP para la noche de jazz: solo los que queden.' },
      { en: 'As the box office, open a show: who sits where.', es: 'Como la taquilla, abre una función: quién está en cada asiento.' },
    ],
    color: '#b91c1c',
    icon: '<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3zM9 4v12"/>',
    data: (locale, timeZone) => {
      const es = locale === 'es';
      const shows = [
        { from: '16:00', to: '18:10' },
        { from: '19:00', to: '21:10' },
        { from: '21:40', to: '23:50' },
      ];
      const every = (h: { from: string; to: string }[]) => ({ 0: h, 1: h, 2: h, 3: h, 4: h, 5: h, 6: h });
      // Eight rows of three, six and three, the last two dearer: the box office lays it out otherwise if it likes.
      const seating = { rows: 8, blocks: [3, 6, 3], prices: { G: 160, H: 160 } };
      const seats = seatsOf(seating);
      const movie: EventType = {
        ...kind(locale, 'call'),
        id: 'movie',
        slug: es ? 'pelicula' : 'movie',
        title: es ? 'La última función' : 'The Last Show',
        description: es ? 'Drama · 2 h 10 min · B.' : 'Drama · 2 h 10 min · rated B.',
        // All back up to a day before, half up to three hours; moved to another show until three hours before.
        refunds: [
          { hours: 24, percent: 100 },
          { hours: 3, percent: 50 },
        ],
        reschedule: 3,
        whole: true,
        duration: 60,
        increment: 60,
        notice: 0,
        horizon: 6,
        hours: every(shows),
        place: { kind: 'in-person', value: es ? 'Cine Rebo, sala 2' : 'Cine Rebo, room 2' },
        price: { amount: 120, currency: 'MXN', per: 'place' },
        resources: seats,
        seating,
        capacity: 1,
        questions: [],
        color: '#b91c1c',
      };
      const jazz: EventType = {
        ...kind(locale, 'call'),
        id: 'jazz',
        slug: 'jazz',
        title: es ? 'Noche de jazz' : 'Jazz night',
        description: es ? 'Cada sábado, de 8 a 11:30. General de pie, VIP con mesa.' : 'Every Saturday, 8 to 11:30. General standing, VIP with a table.',
        whole: true,
        duration: 60,
        increment: 60,
        notice: 0,
        horizon: 35,
        refunds: [{ hours: 72, percent: 100 }],
        hours: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [{ from: '20:00', to: '23:30' }] },
        place: { kind: 'in-person', value: es ? 'Foro Rebo, Calle Sexta 6' : 'Foro Rebo, 6 Sixth Street' },
        price: { amount: 450, currency: 'MXN', per: 'place' },
        resources: [
          { id: 'general', name: 'General', image: '', values: {}, price: null, capacity: 120 },
          { id: 'vip', name: 'VIP', image: '', values: {}, price: 900, capacity: 24 },
        ],
        capacity: 1,
        questions: [],
        color: '#7c3aed',
      };
      const base = { organizer: { name: es ? 'Cine y Foro Rebo' : 'Rebo Cinema & Stage', email: 'tickets@example.com' }, schedule: sampleSchedule(timeZone), types: [movie, jazz] };
      return {
        ...base,
        pays: true,
        tickets: true,
        coupons: [
          { code: 'MARTES2X1', label: es ? '2×1 los martes en el cine' : '2 for 1 on Tuesdays at the cinema', take: 2, pay: 1, days: [2], types: ['movie'] },
          { code: 'JAZZ10', label: es ? '10% en la noche de jazz' : '10% off the jazz night', percent: 10, types: ['jazz'] },
        ],
        posters: { movie: poster(es ? 'LA ÚLTIMA FUNCIÓN' : 'THE LAST SHOW', '#7f1d1d', '#111827'), jazz: poster('JAZZ', '#4c1d95', '#0f172a') },
        seed: () => {
          const out: Booking[] = [];
          const today = clockAt(Date.now(), timeZone).day;
          for (let i = 0; i <= 6; i++) {
            const day = addDays(today, i);
            for (const t of startsOn(movie, base.schedule, day)) {
              // Some seats sold, in pairs, the middle of the room first.
              const sold = seats.filter((s, k) => chance(13, i, t.minute, k) < (i < 2 ? 0.45 : 0.2) - Math.abs(6.5 - Number(s.id.slice(1))) * 0.02);
              for (let k = 0; k < sold.length; k += 2) {
                const pair = sold.slice(k, k + 2).map((x) => x.id);
                const name = PEOPLE[(i + k) % PEOPLE.length];
                out.push({
                  id: `seed-movie-${i}-${t.minute}-${k}`,
                  type: 'movie',
                  resource: pair[0],
                  seats: pair,
                  start: new Date(t.start).toISOString(),
                  end: new Date(t.end).toISOString(),
                  name,
                  email: emailOf(name),
                  timeZone,
                  answers: {},
                  status: 'confirmed',
                  created: '',
                  price: { amount: pair.reduce((n, x) => n + (seats.find((s) => s.id === x)?.price ?? 120), 0), currency: 'MXN' },
                });
              }
            }
          }
          for (let i = 0; i <= 35; i++) {
            const day = addDays(today, i);
            for (const t of startsOn(jazz, base.schedule, day)) {
              for (const [zone, sold] of [
                ['general', i < 8 ? 96 : 30],
                ['vip', i < 8 ? 21 : 6],
              ] as const) {
                for (let k = 0, n = 0; k < sold; k += n, out.length) {
                  n = Math.min(sold - k, 2 + (k % 3));
                  const name = PEOPLE[(i + k) % PEOPLE.length];
                  out.push({
                    id: `seed-jazz-${i}-${zone}-${k}`,
                    type: 'jazz',
                    resource: zone,
                    places: n,
                    start: new Date(t.start).toISOString(),
                    end: new Date(t.end).toISOString(),
                    name,
                    email: emailOf(name),
                    timeZone,
                    answers: {},
                    status: 'confirmed',
                    created: '',
                    price: { amount: n * (zone === 'vip' ? 900 : 450), currency: 'MXN' },
                  });
                }
              }
            }
          }
          return out;
        },
      };
    },
  },
];

export const scenarioOf = (id: string) => SCENARIOS.find((s) => s.id === id);
