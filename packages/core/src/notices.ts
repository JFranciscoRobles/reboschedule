// What whoever booked is told of their booking: that it was made, that it was
// moved (from when to when), that it was corrected, that it was cancelled;
// as a subject and a text in their language and their time zone, with its
// invitation as it is now, its version one more each change, so their
// calendar changes it and does not add another. Sending it is the app's.

import type { Organizer } from './ics';
import { icsOf } from './ics';
import type { Booking, EventType } from './model';
import type { Waiting } from './waitlist';
import { formatMoney } from './price';
import type { Locale } from './booking';

export type ChangeKind = 'booked' | 'moved' | 'changed' | 'cancelled';

/** A message: of a change, or a reminder the day before. */
export type NoticeKind = ChangeKind | 'reminder';

/** A message ready to send: to whom, its subject and text, and its invitation to attach. */
export interface Notice {
  kind: NoticeKind;
  to: { name: string; email: string };
  subject: string;
  text: string;
  /** The invitation, iCalendar; attach it as `invite.ics`, `text/calendar; method=…`. */
  ics: string;
  method: 'REQUEST' | 'CANCEL';
  booking: Booking;
}

/** What changed from one booking to the same one as it is now. */
export function changeOf(before: Booking | null | undefined, after: Booking): ChangeKind {
  if (!before) return 'booked';
  if (after.status === 'cancelled' && before.status !== 'cancelled') return 'cancelled';
  if (after.start !== before.start || after.end !== before.end || after.resource !== before.resource) return 'moved';
  return 'changed';
}

/** A booking cancelled, its version one more. */
export const cancelBooking = (booking: Booking): Booking => ({ ...booking, status: 'cancelled', sequence: (booking.sequence ?? 0) + 1 });

/** A booking changed by the owner (who has it, what they answered), its version one more. */
export const changeBooking = (booking: Booking, patch: Partial<Pick<Booking, 'name' | 'email' | 'answers'>>): Booking => ({ ...booking, ...patch, sequence: (booking.sequence ?? 0) + 1 });

/** A sentence's first letter, capital. */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A kind's title as whoever booked owns it: `tu visita`, `your visit`; with an article of its own, as it is: `la última función`, `the last show`. */
export function yours(title: string, locale: Locale = 'en') {
  const t = title.charAt(0).toLowerCase() + title.slice(1);
  const article = locale === 'es' ? /^(el|la|los|las|un|una|unos|unas) /i : /^(the|a|an) /i;
  return article.test(t) ? t : `${locale === 'es' ? 'tu' : 'your'} ${t}`;
}

const WORDS = {
  en: {
    booked: (t: string, w: string) => `Booked: ${t} · ${w}`,
    moved: (t: string, w: string) => `Moved: ${t} · now ${w}`,
    changed: (t: string, w: string) => `Updated: ${t} · ${w}`,
    cancelled: (t: string, w: string) => `Cancelled: ${t} · ${w}`,
    hello: (n: string) => `Hello ${n},`,
    isOn: (t: string, o: string, w: string) => `${cap(t)} with ${o} is on ${w}.`,
    wasMoved: (t: string, o: string, from: string, w: string) => `${cap(t)} with ${o} was moved from ${from} to ${w}.`,
    wasChanged: (t: string, o: string, w: string) => `${cap(t)} with ${o}, on ${w}, was updated.`,
    wasCancelled: (t: string, o: string, w: string) => `${cap(t)} with ${o}, on ${w}, was cancelled.`,
    where: 'Where',
    what: 'What',
    total: 'Total',
    manage: 'To see it or cancel it',
    calendar: 'The invitation attached updates it in your calendar.',
    reminder: (t: string, w: string) => `Reminder: ${t} · ${w}`,
    remind: (t: string, o: string, w: string) => `A reminder: ${t} with ${o} is on ${w}.`,
    refunded: (m: string) => `${m} is given back to you.`,
    noRefund: 'Nothing is given back, as its terms say for so close to its time.',
    due: 'Left to pay there',
    discount: (c: string, m: string) => `Code ${c}: ${m} off`,
    manageMove: 'To see it, move it or cancel it',
    ticket: 'Your entry code (its QR is attached): show it at the door.',
    offered: (t: string, w: string) => `A place is free: ${t} · ${w}`,
    offer: (t: string, o: string, w: string) => `A place is free for the ${t} with ${o} on ${w}, which you were waiting for. It is whoever books it first:`,
  },
  es: {
    booked: (t: string, w: string) => `Confirmada: ${t} · ${w}`,
    moved: (t: string, w: string) => `Cambió: ${t} · ahora ${w}`,
    changed: (t: string, w: string) => `Actualizada: ${t} · ${w}`,
    cancelled: (t: string, w: string) => `Cancelada: ${t} · ${w}`,
    hello: (n: string) => `Hola ${n}:`,
    isOn: (t: string, o: string, w: string) => `${cap(t)} con ${o} es el ${w}.`,
    wasMoved: (t: string, o: string, from: string, w: string) => `${cap(t)} con ${o} se movió del ${from} al ${w}.`,
    wasChanged: (t: string, o: string, w: string) => `${cap(t)} con ${o}, el ${w}, se actualizó.`,
    wasCancelled: (t: string, o: string, w: string) => `${cap(t)} con ${o}, el ${w}, se canceló.`,
    where: 'Dónde',
    what: 'Qué',
    total: 'Total',
    manage: 'Para verla o cancelarla',
    calendar: 'La invitación adjunta la actualiza en tu calendario.',
    reminder: (t: string, w: string) => `Recordatorio: ${t} · ${w}`,
    remind: (t: string, o: string, w: string) => `Te recordamos: ${t} con ${o} es el ${w}.`,
    refunded: (m: string) => `Se te devuelven ${m}.`,
    noRefund: 'No hay reembolso: así lo dicen sus condiciones, tan cerca de su hora.',
    due: 'Por pagar allá',
    discount: (c: string, m: string) => `Código ${c}: ${m} de descuento`,
    manageMove: 'Para verla, cambiarla o cancelarla',
    ticket: 'Tu código de entrada (su QR va adjunto): muéstralo en la puerta.',
    offered: (t: string, w: string) => `Se liberó un lugar: ${t} · ${w}`,
    offer: (t: string, o: string, w: string) => `Se liberó un lugar para ${t} con ${o} el ${w}, que esperabas. Es de quien lo reserve primero:`,
  },
};

/** The message for a change of a booking, in a language, its times in the time zone of whoever booked. */
export function noticeOf(
  kind: NoticeKind,
  booking: Booking,
  type: EventType,
  organizer: Organizer,
  { locale = 'en', manage, before, movable = false, ticket }: { locale?: Locale; manage?: string; before?: Booking; movable?: boolean; ticket?: string } = {},
): Notice {
  const w = WORDS[locale];
  const when = (iso: string) =>
    new Intl.DateTimeFormat(locale, { timeZone: booking.timeZone, weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  const title = yours(type.title, locale);
  const at = when(booking.start);
  const lines = [w.hello(booking.name), ''];
  if (kind === 'booked') lines.push(w.isOn(title, organizer.name, at));
  if (kind === 'moved') lines.push(w.wasMoved(title, organizer.name, before ? when(before.start) : '', at));
  if (kind === 'changed') lines.push(w.wasChanged(title, organizer.name, at));
  if (kind === 'cancelled') lines.push(w.wasCancelled(title, organizer.name, at));
  if (kind === 'reminder') lines.push(w.remind(title, organizer.name, at));
  // Cancelled after it was paid: what is given back, or that nothing is.
  if (kind === 'cancelled' && booking.payment?.paid) lines.push('', booking.refunded?.amount ? w.refunded(formatMoney(booking.refunded, locale)) : w.noRefund);
  if (kind !== 'cancelled') {
    const thing = type.resources.find((r) => r.id === booking.resource)?.name;
    lines.push('');
    if (thing) lines.push(`${w.what}: ${thing}`);
    if (type.place.value) lines.push(`${w.where}: ${type.place.value}`);
    if (booking.discount) lines.push(w.discount(booking.discount.code, formatMoney({ amount: booking.discount.amount, currency: booking.price?.currency ?? 'MXN' }, locale)));
    if (booking.price) lines.push(`${w.total}: ${formatMoney(booking.price, locale)}`);
    if (booking.due) lines.push(`${w.due}: ${formatMoney(booking.due, locale)}`);
    if (ticket) lines.push('', w.ticket, ticket);
    if (manage) lines.push('', `${movable ? w.manageMove : w.manage}: ${manage}`);
  }
  lines.push('', w.calendar, '', organizer.name);
  return {
    kind,
    to: { name: booking.name, email: booking.email },
    subject: w[kind](type.title, at),
    text: lines.join('\n'),
    ics: icsOf(booking, type, organizer),
    method: booking.status === 'cancelled' ? 'CANCEL' : 'REQUEST',
    booking,
  };
}

/** The message for someone waiting, when a place of the time they waited for is free: where to book it. */
export function offerOf(waiting: Waiting, type: EventType, organizer: Organizer, { locale = 'en', link, timeZone = 'UTC' }: { locale?: Locale; link: string; timeZone?: string }) {
  const w = WORDS[locale];
  const at = new Intl.DateTimeFormat(locale, { timeZone, weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date(waiting.start));
  const title = type.title.charAt(0).toLowerCase() + type.title.slice(1);
  return {
    kind: 'offered' as const,
    to: { name: waiting.name, email: waiting.email },
    subject: w.offered(type.title, at),
    text: [w.hello(waiting.name), '', w.offer(title, organizer.name, at), link, '', organizer.name].join('\n'),
    waiting,
  };
}

/** A message for someone waiting: to whom, its subject and text. */
export type Offer = ReturnType<typeof offerOf>;
