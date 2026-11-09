// A message short enough for a phone: an SMS, a WhatsApp. What a notice
// says, in a line or two, with the link to see, change or cancel it; and the
// parts of it as a WhatsApp template takes them (a business may only begin a
// conversation with a template it had approved). And the phone of whoever
// booked, from what they answered, as a provider takes it: `+526641234567`.

import type { Locale } from './booking';
import type { Booking, EventType } from './model';
import { type Notice, type Offer, yours } from './notices';
import type { Organizer } from './ics';

export interface ShortMessage {
  /** To whom, by their phone. */
  to: string;
  /** The text whole, for an SMS or a WhatsApp in a conversation already open. */
  text: string;
  /** The same as a template's parameters: who, what, when, the link. */
  template: { name: string; params: string[] };
}

/** A phone as given, as a provider takes it: its digits with the country's code, `+52` unless it has one. */
export function phoneOf(given: string | undefined, country = '52'): string | null {
  if (!given) return null;
  const digits = given.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.length >= 9 ? digits : null;
  const bare = digits.replace(/^00/, '');
  if (bare.length === 10) return `+${country}${bare}`;
  return bare.length >= 11 ? `+${bare}` : null;
}

/** The phone of whoever booked: the first answer to a question of a phone. */
export const phoneOfBooking = (booking: Booking, type: EventType, country = '52') => {
  const q = type.questions.find((x) => x.kind === 'phone' && booking.answers[x.id]?.trim());
  return q ? phoneOf(booking.answers[q.id], country) : null;
};

const WORDS = {
  en: {
    booked: (o: string, t: string, w: string) => `${o}: ${t} is booked for ${w}.`,
    moved: (o: string, t: string, w: string) => `${o}: ${t} is now on ${w}.`,
    changed: (o: string, t: string, w: string) => `${o}: ${t} on ${w} was updated.`,
    cancelled: (o: string, t: string, w: string) => `${o}: ${t} on ${w} was cancelled.`,
    reminder: (o: string, t: string, w: string) => `${o}: a reminder, ${t} is ${w}.`,
    offered: (o: string, t: string, w: string) => `${o}: a place is free for ${t}, ${w}. First to book gets it:`,
    manage: 'Change or cancel:',
  },
  es: {
    booked: (o: string, t: string, w: string) => `${o}: ${t} quedó para el ${w}.`,
    moved: (o: string, t: string, w: string) => `${o}: ${t} ahora es el ${w}.`,
    changed: (o: string, t: string, w: string) => `${o}: ${t} del ${w} se actualizó.`,
    cancelled: (o: string, t: string, w: string) => `${o}: ${t} del ${w} se canceló.`,
    reminder: (o: string, t: string, w: string) => `${o}: te recordamos ${t}, ${w}.`,
    offered: (o: string, t: string, w: string) => `${o}: se liberó un lugar para ${t}, ${w}. Es de quien reserve primero:`,
    manage: 'Cambiar o cancelar:',
  },
};

/** A notice (or a place offered to whoever waits) as a short message to a phone: in a line, with its link. None without a phone. */
export function shortOf(
  told: Notice | Offer,
  type: EventType,
  organizer: Organizer,
  { locale = 'en', phone, link, timeZone }: { locale?: Locale; phone: string | null; link?: string; timeZone?: string },
): ShortMessage | null {
  if (!phone) return null;
  const w = WORDS[locale];
  const start = 'booking' in told ? told.booking.start : told.waiting.start;
  const zone = timeZone ?? ('booking' in told ? told.booking.timeZone : 'UTC');
  const when = new Intl.DateTimeFormat(locale, { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(start));
  const title = yours(type.title, locale);
  const line = w[told.kind](organizer.name, title, when);
  const text = link ? (told.kind === 'offered' ? `${line} ${link}` : told.kind === 'cancelled' ? line : `${line} ${w.manage} ${link}`) : line;
  return { to: phone, text, template: { name: `reboschedule_${told.kind}`, params: [organizer.name, title, when, link ?? ''] } };
}
