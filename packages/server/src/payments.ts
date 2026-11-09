// Who takes the payments, as the server needs one, whichever the
// application chooses (Stripe, Mercado Pago, its own): a checkout begun for
// what is held, with where to send whoever pays; the provider's notice read,
// to know what was paid; and, if need be, a refund.

import type { Booking, EventType, Money, Organizer } from '@reboschedule/core';

/** What is paid at once: the booking (and its series, if it was booked every week), its total, until when it is held. */
export interface Charge {
  booking: Booking;
  bookings: Booking[];
  total: Money;
  type: EventType;
  organizer: Organizer;
  /** Until when its place is kept, ISO in UTC. */
  until: string;
  /** Where to come back to when it is paid, or when it is not: the booking's own address. */
  back: string;
  /** Where the provider says what was paid: the handler's `/paid`. */
  notify: string;
}

export interface Payments {
  /** Its name, kept on each booking it takes the payment of: `stripe`, `mercadopago`. */
  provider: string;
  /** A checkout begun for a charge: its id at the provider, and where to send whoever pays. */
  checkout(charge: Charge): Promise<{ id: string; url: string }>;
  /** A notice of the provider read and checked (its signature): which booking was paid and the id of what was paid; none to ignore it. */
  notified(request: Request): Promise<{ booking: string; paid: string } | null>;
  /** What was paid for a booking given back, all of it or `amount`: when it is cancelled, as its kind's rules say; when it was paid too late and its place was taken. */
  refund?(booking: Booking, amount: Money): Promise<void>;
}
