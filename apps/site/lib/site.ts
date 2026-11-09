// Where things are, and the pages of the documentation in the order they are read.

import type { L } from './i18n';

/** Where the code is. */
export const REPO = 'https://github.com/JFranciscoRobles/reboschedule';
export const SITE = 'https://reboschedule.com';
export const VERSION = '0.1.0';

/** The six pastel pairs, background and text, that take turns on tags and groups. */
export type Pastel = 'blue' | 'yellow' | 'green' | 'pink' | 'purple' | 'orange';
/** Whole class names, so Tailwind finds them. */
export const PASTEL_CLASS: Record<Pastel, string> = {
  blue: 'bg-pastel-blue text-pastel-blue-fg',
  yellow: 'bg-pastel-yellow text-pastel-yellow-fg',
  green: 'bg-pastel-green text-pastel-green-fg',
  pink: 'bg-pastel-pink text-pastel-pink-fg',
  purple: 'bg-pastel-purple text-pastel-purple-fg',
  orange: 'bg-pastel-orange text-pastel-orange-fg',
};

export interface NavItem {
  title: L;
  /** The file in `content/docs`, without `.md`; `index` is `/docs/`. */
  slug: string;
}

/** The pages of the documentation, in the order they are read; each group has its colour in the sidebar. */
export const NAV: { title: L; color: Pastel; items: NavItem[] }[] = [
  {
    title: { en: 'Start', es: 'Empezar' },
    color: 'blue',
    items: [
      { title: { en: 'What is ReboSchedule', es: 'Qué es ReboSchedule' }, slug: 'index' },
      { title: { en: 'Getting started', es: 'Primeros pasos' }, slug: 'getting-started' },
      { title: { en: 'Demos to run', es: 'Demos para correr' }, slug: 'demos' },
    ],
  },
  {
    title: { en: 'Put it in your app', es: 'Ponlo en tu aplicación' },
    color: 'purple',
    items: [
      { title: { en: 'The booking widget', es: 'El widget de reserva' }, slug: 'widget' },
      { title: { en: 'Headless: your own UI', es: 'Headless: tu propia interfaz' }, slug: 'headless' },
      { title: { en: 'A complete interface', es: 'Una interfaz completa' }, slug: 'example' },
      { title: { en: 'Month, day and panel', es: 'Mes, día y panel' }, slug: 'calendar' },
      { title: { en: 'The editors', es: 'Los editores' }, slug: 'editors' },
      { title: { en: 'Without React', es: 'Sin React' }, slug: 'vanilla' },
      { title: { en: 'Styling', es: 'Estilos' }, slug: 'styling' },
    ],
  },
  {
    title: { en: 'Booking', es: 'Reservas' },
    color: 'yellow',
    items: [
      { title: { en: 'Hours and time zones', es: 'Horario y zonas horarias' }, slug: 'hours' },
      { title: { en: 'Kinds of booking', es: 'Tipos de reserva' }, slug: 'kinds' },
      { title: { en: 'Courts, rooms and shifts', es: 'Canchas, salas y guardias' }, slug: 'resources' },
      { title: { en: 'Prices', es: 'Precios' }, slug: 'prices' },
      { title: { en: 'Every week', es: 'Cada semana' }, slug: 'repeat' },
      { title: { en: 'Rosters of shifts', es: 'Roles de guardias' }, slug: 'roster' },
      { title: { en: 'Rentals by the night', es: 'Rentas por noche' }, slug: 'stays' },
      { title: { en: 'People with their own hours', es: 'Personas con su horario' }, slug: 'staff' },
      { title: { en: 'Tickets: seats and zones', es: 'Boletos: asientos y zonas' }, slug: 'tickets' },
      { title: { en: 'A booking', es: 'Una reserva' }, slug: 'bookings' },
      { title: { en: 'Telling whoever booked', es: 'Avisar a quien reservó' }, slug: 'notices' },
      { title: { en: 'Changes and refunds', es: 'Cambios y reembolsos' }, slug: 'policies' },
      { title: { en: 'Discount codes', es: 'Códigos de descuento' }, slug: 'coupons' },
      { title: { en: 'Waitlist and reminders', es: 'Lista de espera y recordatorios' }, slug: 'waitlist' },
      { title: { en: 'Entry and attendance', es: 'Entrada y asistencia' }, slug: 'checkin' },
      { title: { en: 'Reports', es: 'Reportes' }, slug: 'reports' },
      { title: { en: 'WhatsApp and SMS', es: 'WhatsApp y SMS' }, slug: 'messages' },
    ],
  },
  {
    title: { en: 'Server', es: 'Servidor' },
    color: 'orange',
    items: [
      { title: { en: 'The routes', es: 'Las rutas' }, slug: 'server' },
      { title: { en: 'Your database', es: 'Tu base de datos' }, slug: 'database' },
      { title: { en: 'Payments', es: 'Cobrar' }, slug: 'payments' },
      { title: { en: 'Google, Outlook and iCal', es: 'Google, Outlook e iCal' }, slug: 'calendars' },
    ],
  },
  {
    title: { en: 'Reference', es: 'Referencia' },
    color: 'green',
    items: [
      { title: { en: 'Packages', es: 'Paquetes' }, slug: 'packages' },
      { title: { en: 'Components and hooks', es: 'Componentes y hooks' }, slug: 'components' },
      { title: { en: 'API', es: 'API' }, slug: 'api' },
      { title: { en: 'How it works', es: 'Cómo funciona' }, slug: 'architecture' },
      { title: { en: 'Status and roadmap', es: 'Estado y hoja de ruta' }, slug: 'status' },
    ],
  },
];

export const PAGES = NAV.flatMap((group) => group.items);
/** The group a page is in, for the line above its title. */
export const groupOf = (slug: string) => NAV.find((group) => group.items.some((item) => item.slug === slug));
export const hrefOf = (slug: string) => (slug === 'index' ? '/docs/' : `/docs/${slug}/`);
