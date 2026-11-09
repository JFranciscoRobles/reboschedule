// Hours and kinds of appointment to start from and to try things with:
// someone who shows homes on weekdays and Saturday mornings, in Tijuana, and
// gives a first call of thirty minutes and a visit of an hour; and things
// booked that are not their time: five padel courts open every day, five
// meeting rooms on weekdays, and the office's shifts, two guards to each.

import type { EventType, Hours, Schedule, Weekday } from './model';
import { courtPicture, roomPicture } from './pictures';
import type { Locale } from './booking';

export function sampleSchedule(timeZone = 'America/Tijuana'): Schedule {
  const day = [
    { from: '09:00', to: '13:00' },
    { from: '15:00', to: '18:00' },
  ];
  return { timeZone, weekly: { 0: [], 1: day, 2: day, 3: day, 4: day, 5: day, 6: [{ from: '10:00', to: '13:00' }] }, dates: {} };
}

/** The same hours every day of the week. */
const everyDay = (hours: Hours[], weekend = hours): Record<Weekday, Hours[]> => ({ 0: weekend, 1: hours, 2: hours, 3: hours, 4: hours, 5: hours, 6: weekend });
/** What the owner's own appointments are not: things, hours of their own, room for several. */
const own = { lengths: [], hours: null, resources: [], fields: [], price: null, capacity: 1, series: 0, whole: false, stay: null };

export function sampleEventTypes(locale: Locale = 'en'): EventType[] {
  const es = locale === 'es';
  return [
    {
      id: 'call',
      slug: es ? 'llamada' : 'call',
      title: es ? 'Primera llamada' : 'First call',
      description: es ? 'Platicamos de lo que buscas, en treinta minutos.' : 'We talk about what you are looking for, in thirty minutes.',
      duration: 30,
      increment: 30,
      before: 0,
      after: 10,
      notice: 120,
      horizon: 30,
      perDay: null,
      place: { kind: 'video', value: 'https://meet.example.com/laura' },
      questions: [{ id: 'looking', label: es ? '¿Qué buscas?' : 'What are you looking for?', kind: 'long', required: false }],
      color: '#3b63fb',
      ...own,
    },
    {
      id: 'visit',
      slug: es ? 'visita' : 'visit',
      title: es ? 'Visita a una propiedad' : 'A visit to a home',
      description: es ? 'Te enseño la propiedad que te interesa.' : 'I show you the home you are interested in.',
      duration: 60,
      increment: 60,
      before: 30,
      after: 30,
      notice: 24 * 60,
      horizon: 21,
      perDay: 3,
      place: { kind: 'in-person', value: es ? 'Te mando la dirección al confirmar' : 'I send you the address once confirmed' },
      questions: [
        { id: 'phone', label: es ? 'Tu teléfono' : 'Your phone', kind: 'phone', required: true },
        { id: 'home', label: es ? '¿Qué propiedad?' : 'Which home?', kind: 'text', required: false },
      ],
      color: '#0e7490',
      ...own,
    },
    {
      id: 'court',
      slug: es ? 'cancha' : 'court',
      title: es ? 'Cancha de pádel' : 'Padel court',
      description: es ? 'Elige una de las cinco canchas, por una hora, hora y media o dos.' : 'Choose one of the five courts, for an hour, an hour and a half or two.',
      duration: 60,
      lengths: [90, 120],
      increment: 30,
      before: 0,
      after: 0,
      notice: 30,
      horizon: 14,
      perDay: null,
      place: { kind: 'in-person', value: es ? 'Club Rebo, Blvd. Agua Caliente 100' : 'Club Rebo, 100 Agua Caliente Blvd.' },
      hours: everyDay([{ from: '07:00', to: '22:00' }], [{ from: '08:00', to: '20:00' }]),
      fields: [
        { id: 'surface', label: es ? 'Superficie' : 'Surface', kind: 'text', unit: '' },
        { id: 'covered', label: es ? 'Techada' : 'Covered', kind: 'yes-no', unit: '' },
      ],
      // Each hour; the covered ones cost more.
      price: { amount: 350, currency: 'MXN', per: 'hour' },
      resources: [1, 2, 3, 4, 5].map((n) => ({
        id: `court-${n}`,
        name: es ? `Cancha ${n}` : `Court ${n}`,
        image: courtPicture({ covered: n > 3, color: n === 3 ? '#2f7d5b' : '#3f6aa0' }),
        values: { surface: n === 3 ? (es ? 'Césped' : 'Grass') : es ? 'Cristal' : 'Glass', covered: n > 3 },
        price: n > 3 ? 450 : null,
      })),
      capacity: 1,
      series: 0,
      whole: false,
      stay: null,
      questions: [{ id: 'phone', label: es ? 'Tu teléfono' : 'Your phone', kind: 'phone', required: true }],
      color: '#15803d',
    },
    {
      id: 'room',
      slug: es ? 'sala' : 'room',
      title: es ? 'Sala de juntas' : 'Meeting room',
      description: es ? 'Para firmar, para presentar una propiedad, para una junta del equipo.' : 'To sign, to present a home, for a team meeting.',
      duration: 60,
      lengths: [30, 90, 120, 180],
      increment: 30,
      before: 0,
      after: 0,
      notice: 0,
      horizon: 30,
      perDay: null,
      place: { kind: 'in-person', value: es ? 'Oficina Rebo, piso 3' : 'Rebo office, third floor' },
      hours: everyDay([{ from: '08:00', to: '20:00' }], []),
      fields: [
        { id: 'people', label: es ? 'Cabe' : 'Holds', kind: 'number', unit: es ? 'personas' : 'people' },
        { id: 'screen', label: es ? 'Pantalla' : 'Screen', kind: 'yes-no', unit: '' },
      ],
      price: { amount: 200, currency: 'MXN', per: 'hour' },
      resources: (
        [
          ['north', es ? 'Sala Norte' : 'North room', 10, true],
          ['south', es ? 'Sala Sur' : 'South room', 4, false],
          ['pacific', es ? 'Sala Pacífico' : 'Pacific room', 8, true],
          ['valley', es ? 'Sala Valle' : 'Valley room', 6, false],
          ['board', es ? 'Sala Ejecutiva' : 'Board room', 14, true],
        ] as const
      ).map(([id, name, people, screen]) => ({ id, name, image: roomPicture(people), values: { people, screen }, price: null })),
      capacity: 1,
      series: 0,
      whole: false,
      stay: null,
      questions: [{ id: 'what', label: es ? '¿Para qué es?' : 'What is it for?', kind: 'text', required: false }],
      color: '#7c3aed',
    },
    {
      id: 'shift',
      slug: es ? 'guardia' : 'shift',
      title: es ? 'Guardia en oficina' : 'Office shift',
      description: es ? 'Turnos de cinco horas para atender a quien llega; dos asesores por guardia.' : 'Five-hour shifts to see whoever comes in; two agents to each.',
      duration: 300,
      lengths: [],
      increment: 300,
      before: 0,
      after: 0,
      notice: 0,
      horizon: 30,
      perDay: null,
      place: { kind: 'in-person', value: es ? 'Oficina Rebo, recepción' : 'Rebo office, reception' },
      hours: everyDay([{ from: '09:00', to: '19:00' }], [{ from: '10:00', to: '15:00' }]),
      resources: [],
      fields: [],
      price: null,
      capacity: 2,
      series: 0,
      whole: false,
      stay: null,
      questions: [],
      color: '#c2410c',
    },
  ];
}
