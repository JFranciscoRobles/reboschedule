// What the landing page says of ReboSchedule: what it does in a word or two,
// its features with an icon each, its packages, and the numbers it stands on,
// each counted where it lives (the tests in their files, the engine's
// dependencies in its package), none written here by hand.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { L } from './i18n';

export { VERSION } from './site';

import { type Pastel, PASTEL_CLASS } from './site';

export { type Pastel, PASTEL_CLASS };
const ORDER: Pastel[] = ['blue', 'yellow', 'green', 'pink', 'purple', 'orange'];
export const pastelAt = (i: number) => ORDER[i % ORDER.length];

export const NPM_ORG = 'https://www.npmjs.com/org/reboschedule';
export const npmOf = (name: string) => `https://www.npmjs.com/package/${name}`;

/** What it does, a word or two each, in a row under the hero. */
export const TAGS: L[] = [
  { en: 'Appointments', es: 'Citas' },
  { en: 'Courts and rooms', es: 'Canchas y salas' },
  { en: 'Shifts', es: 'Guardias' },
  { en: 'Any time zone', es: 'Cualquier zona horaria' },
  { en: 'Never two at once', es: 'Nunca dos a la vez' },
  { en: 'Prices and evenings', es: 'Precios y horario pico' },
  { en: 'Month and day views', es: 'Vista de mes y de día' },
  { en: 'Gaps to give away', es: 'Huecos por apartar' },
  { en: '.ics and Google Calendar', es: '.ics y Google Calendar' },
  { en: 'Fields and pictures', es: 'Campos e imágenes' },
  { en: 'Headless hooks', es: 'Hooks headless' },
  { en: 'Every week', es: 'Cada semana' },
  { en: 'Google and Outlook as busy', es: 'Google y Outlook como ocupado' },
  { en: 'Messages ready to send', es: 'Avisos listos para mandar' },
  { en: 'English and Spanish', es: 'Inglés y español' },
];

/** Each feature: its title, a line or two, and the path of its icon (24 by 24). */
export const FEATURES: [L, L, string][] = [
  [
    { en: 'Every week', es: 'Cada semana' },
    {
      en: 'A class every Tuesday, a shift every Monday morning: a series, each week checked as any booking is, those that are full said before; one moved or cancelled alone, or with the rest.',
      es: 'Una clase cada martes, una guardia cada lunes en la mañana: una serie, cada semana revisada como cualquier reserva, las llenas dichas antes; una movida o cancelada sola, o con las demás.',
    },
    'M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
  ],
  [
    { en: 'Their own calendar, busy', es: 'Su propio calendario, ocupado' },
    {
      en: 'What is in the owner’s Google or Outlook is never offered: read by its secret address, or with a token your app has. And whoever booked is told of each change, the invitation updated.',
      es: 'Lo que hay en el Google o el Outlook de quien atiende nunca se ofrece: leído por su dirección secreta, o con un token de tu aplicación. Y a quien reservó se le avisa cada cambio, con la invitación actualizada.',
    },
    'M4 6h16v14H4zM4 10h16M9 3v5M15 3v5M8 14h3v3H8z',
  ],
  [
    { en: 'Never two at once', es: 'Nunca dos a la vez' },
    {
      en: 'Each booking is checked again on the server as it comes, and kept in the same step, by a unique index or a lock of your database: whoever was first keeps it, the other is offered the rest.',
      es: 'Cada reserva se revisa otra vez en el servidor al llegar y se guarda en el mismo paso, con un índice único o un candado de tu base de datos: quien llegó primero se la queda, al otro se le ofrecen los demás.',
    },
    'M5 12l4 4L19 6',
  ],
  [
    { en: 'In any time zone', es: 'En cualquier zona horaria' },
    {
      en: 'The hours are said as the owner’s clock says them; whoever books sees them in theirs. The night the clocks change, a minute that does not exist is not offered.',
      es: 'El horario se dice como lo marca el reloj de quien atiende; quien reserva lo ve en el suyo. La noche que cambia la hora, un minuto que no existe no se ofrece.',
    },
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  ],
  [
    { en: 'Things, and places', es: 'Cosas, y lugares' },
    {
      en: 'Courts or rooms alike, each booked on its own, with its picture and fields; several at once in a turn; lengths to choose; hours of its own for each kind.',
      es: 'Canchas o salas iguales, cada una por separado, con su imagen y sus campos; varios a la vez en un turno; duraciones a elegir; horario propio para cada tipo.',
    },
    'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  ],
  [
    { en: 'What it costs', es: 'Lo que cuesta' },
    {
      en: 'A price each hour or each booking, a court’s own, or rules of your app’s (an evening that costs more). Seen before booking, quoted again by the server.',
      es: 'Un precio por hora o por reserva, el propio de cada cancha, o reglas de tu aplicación (una noche que cuesta más). Visto antes de reservar, cotizado otra vez por el servidor.',
    },
    'M12 3v18M17 7.5C17 5.6 14.8 5 12 5s-5 1-5 3.2C7 13 17 10 17 15c0 2.3-2.2 3.5-5 3.5S7 17.4 7 15.5',
  ],
  [
    { en: 'The month, the day, the gaps', es: 'El mes, el día, los huecos' },
    {
      en: 'Who has each turn and each court; the gaps still to cover, and the next one a click away. Give one, change who has it, move it or free it from the calendar.',
      es: 'Quién tiene cada turno y cada cancha; los huecos por cubrir, y el siguiente a un clic. Aparta uno, cambia quién lo tiene, muévelo o libéralo desde el calendario.',
    },
    'M4 6h16v14H4zM4 10h16M9 3v5M15 3v5',
  ],
  [
    { en: 'An invitation, in every calendar', es: 'Una invitación, en cada calendario' },
    {
      en: 'An .ics every calendar opens, a link to Google Calendar, and an address of its own, signed, to see or cancel a booking with no account.',
      es: 'Un .ics que cualquier calendario abre, una liga a Google Calendar, y una dirección propia, firmada, para ver o cancelar una reserva sin cuenta.',
    },
    'M4 6l8 6 8-6M4 6h16v12H4z',
  ],
  [
    { en: 'Held while it is paid', es: 'Apartado mientras se paga' },
    {
      en: 'The seat or the nights are kept some minutes while Stripe, Mercado Pago or your own provider takes the payment, a deposit if the kind asks one; unpaid, free again by themselves.',
      es: 'El asiento o las noches se guardan unos minutos mientras Stripe, Mercado Pago o tu proveedor cobran, un anticipo si el tipo lo pide; sin pago, se liberan solos.',
    },
    'M3 7h18v10H3zM3 11h18M7 15h3',
  ],
  [
    { en: 'Changed or cancelled by them', es: 'Cambiada o cancelada por quien reservó' },
    {
      en: 'From their own link, until the hours you say; what is given back by how long before, refunded by the provider; discount codes, a two for one on Tuesdays.',
      es: 'Desde su propia liga, hasta las horas que digas; lo que se devuelve según cuánto falte, reembolsado por el proveedor; códigos de descuento, un 2×1 los martes.',
    },
    'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
  ],
  [
    { en: 'Waitlist, reminders, WhatsApp', es: 'Lista de espera, recordatorios, WhatsApp' },
    {
      en: 'Whoever waits for a full show is told when a place frees up; a reminder the day before; each message also as a WhatsApp or an SMS, by Twilio or Meta.',
      es: 'A quien espera una función llena se le avisa cuando se libera un lugar; un recordatorio el día antes; cada aviso también por WhatsApp o SMS, con Twilio o Meta.',
    },
    'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z',
  ],
  [
    { en: 'A QR at the door, and the numbers', es: 'Un QR en la entrada, y los números' },
    {
      en: 'Each ticket lets in once; came or did not come; what came in each day, how full each resource was, no-shows and codes, and every booking as a CSV.',
      es: 'Cada boleto entra una sola vez; llegó o no vino; lo que entró cada día, qué tan lleno estuvo cada recurso, faltas y códigos, y todas las reservas en CSV.',
    },
    'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2',
  ],
];

/** The packages: what each does, where it runs, and its colour in the table. */
export const PACKAGES: { name: string; what: L; tag: L; color: Pastel }[] = [
  {
    name: '@reboschedule/core',
    what: {
      en: 'The engine: the times free in any time zone, resources and places, prices, the checks of a booking, iCalendar. No dependencies.',
      es: 'El motor: los horarios libres en cualquier zona horaria, recursos y lugares, precios, las revisiones de una reserva, iCalendar. Sin dependencias.',
    },
    tag: { en: 'Browser and Node', es: 'Navegador y Node' },
    color: 'green',
  },
  {
    name: '@reboschedule/server',
    what: {
      en: 'The routes of booking as a Request to a Response: the times free, the booking checked again, each booking’s own signed address.',
      es: 'Las rutas de reserva como un Request a un Response: los horarios libres, la reserva revisada otra vez, la dirección firmada de cada reserva.',
    },
    tag: { en: 'Node, Workers, Bun', es: 'Node, Workers, Bun' },
    color: 'orange',
  },
  {
    name: '@reboschedule/calendars',
    what: {
      en: 'The owner’s own calendar read as busy (a secret iCal address, Google’s free/busy, Outlook’s schedule), and each booking written in their Google or Outlook. Your app authorizes.',
      es: 'El calendario propio de quien atiende leído como ocupado (una dirección iCal secreta, el free/busy de Google, la agenda de Outlook), y cada reserva escrita en su Google u Outlook. Tu aplicación autoriza.',
    },
    tag: { en: 'Node, Workers, browser', es: 'Node, Workers, navegador' },
    color: 'purple',
  },
  {
    name: '@reboschedule/payments',
    what: {
      en: 'Payments for what is held: Stripe’s Checkout and Mercado Pago’s, their notices checked by signature, refunds. Your keys, no SDK.',
      es: 'El cobro de lo apartado: el checkout de Stripe y el de Mercado Pago, sus avisos revisados por firma, reembolsos. Tus llaves, sin SDK.',
    },
    tag: { en: 'Node, Workers', es: 'Node, Workers' },
    color: 'yellow',
  },
  {
    name: '@reboschedule/messages',
    what: {
      en: 'Short messages to a phone: SMS and WhatsApp by Twilio, WhatsApp by Meta’s Cloud API with your approved templates.',
      es: 'Mensajes cortos al teléfono: SMS y WhatsApp con Twilio, WhatsApp con la Cloud API de Meta y tus plantillas aprobadas.',
    },
    tag: { en: 'Node, Workers', es: 'Node, Workers' },
    color: 'pink',
  },
  {
    name: '@reboschedule/react',
    what: {
      en: 'The widget whoever books uses; the month, the day and the panel of whoever looks after it; the editors; and the headless hooks they are drawn on.',
      es: 'El widget de quien reserva; el mes, el día y el panel de quien atiende; los editores; y los hooks headless sobre los que están hechos.',
    },
    tag: { en: 'React 19', es: 'React 19' },
    color: 'blue',
  },
];
export const INSTALL_ORDER = PACKAGES.map((p) => p.name);

const ROOT = path.join(process.cwd(), '../..');

/** The tests of the packages, counted in their files: each `it(` one. */
export function testCount() {
  let n = 0;
  for (const pkg of readdirSync(path.join(ROOT, 'packages'))) {
    const dir = path.join(ROOT, 'packages', pkg, 'test');
    let files: string[] = [];
    try {
      files = readdirSync(dir);
    } catch {
      continue;
    }
    for (const f of files.filter((f) => f.endsWith('.ts'))) n += (readFileSync(path.join(dir, f), 'utf8').match(/^\s*it\(/gm) ?? []).length;
  }
  return n;
}

/** How many packages the engine needs, as its package says. */
export function coreDependencies() {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'packages/core/package.json'), 'utf8')) as { dependencies?: Record<string, string> };
  return Object.keys(pkg.dependencies ?? {}).length;
}

/** The time zones the engine can say times in: every one the platform knows. */
export const timeZoneCount = () => Intl.supportedValuesOf('timeZone').length;
