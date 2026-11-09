// What a booking costs, quoted as it is chosen and again when it is made: the
// kind's price (or the resource's own) each hour for as long as it lasts, or
// once for the booking. An application with rules of its own (an evening
// that costs more, a member's price) gives a `Quote`, and that is the
// price. Nothing here takes money: it says how much.

import type { EventType, Money, Slot } from './model';

/** What a booking would cost, as an application says it: of a kind, a resource (`''` for none), when, and for how many minutes. */
export type Quote = (asked: { type: EventType; resource: string; start: string; length: number; places?: number; nights?: number }) => Money | null;

/** Money in cents, never with more: `1.005` is `1.01`. */
const cents = (n: number) => Math.round(n * 100) / 100;

/** What a kind's price says a booking costs: the resource's own price if it has one, each hour or for the booking. */
export function quoteOf(
  type: EventType,
  { resource = '', length = type.duration, places = 1, nights = 1 }: { resource?: string; length?: number; places?: number; nights?: number } = {},
): Money | null {
  if (!type.price) return null;
  const own = type.resources.find((r) => r.id === resource)?.price;
  const amount = own ?? type.price.amount;
  const per = type.price.per;
  const total = per === 'hour' ? (amount * length) / 60 : per === 'place' ? amount * places : per === 'night' || per === 'day' ? amount * nights : amount;
  return { amount: cents(total), currency: type.price.currency };
}

/** The same, as an application's own rules say it when it has them. */
export const priceOf = (type: EventType, asked: { resource: string; start: string; length: number; places?: number; nights?: number }, quote?: Quote) =>
  quote ? quote({ type, ...asked }) : quoteOf(type, asked);

/** Times free, each with its price: for the length asked, of the resource asked or the first free. */
export function priceSlots(
  slots: Slot[],
  type: EventType,
  { length = type.duration, resource, quote, places = 1 }: { length?: number; resource?: string; quote?: Quote; places?: number } = {},
): Slot[] {
  if (!type.price && !quote) return slots;
  return slots.map((s) => ({ ...s, price: priceOf(type, { resource: resource || s.resources?.[0] || '', start: s.start, length, places }, quote) }));
}

/** An amount as it is read, in a language: its symbol, the number as the language writes it, and the currency, `$1,250.50 MXN`. */
export function formatMoney(money: Money, locale = 'en') {
  const whole = Number.isInteger(money.amount);
  try {
    // Pesos as Mexico writes them, whatever Spanish is asked: `1,100`, not `1100`.
    const numbers = money.currency === 'MXN' && locale.startsWith('es') ? 'es-MX' : locale;
    const number = new Intl.NumberFormat(numbers, { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(money.amount);
    const symbol =
      new Intl.NumberFormat('en', { style: 'currency', currency: money.currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? money.currency;
    return symbol === money.currency ? `${number} ${money.currency}` : `${symbol}${number} ${money.currency}`;
  } catch {
    return `${money.amount} ${money.currency}`;
  }
}
