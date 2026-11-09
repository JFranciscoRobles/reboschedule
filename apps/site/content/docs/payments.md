# Payments: held while paid for

When a kind has a price, the server can take the payment before it confirms. The booking comes in and is **held** for a few minutes (`status: 'held'`, until `held`): nobody else takes that seat, those nights or that time. Whoever booked pays with the provider you choose. When the provider says it was paid, the booking is confirmed; if the minutes run out unpaid, the place is free again by itself.

<demo name="tickets" />

## With Stripe or Mercado Pago {#providers}

`@reboschedule/payments` has both, with your keys and no SDK; you can also write your own (see below).

```ts
import { createBookingHandler } from '@reboschedule/server';
import { stripePayments } from '@reboschedule/payments';
// or: import { mercadoPagoPayments } from '@reboschedule/payments';

const booking = createBookingHandler({
  secret: process.env.BOOKING_SECRET!,
  base: 'https://example.com',
  payments: stripePayments({ secretKey: process.env.STRIPE_KEY!, webhookSecret: process.env.STRIPE_WHSEC! }),
  // payments: mercadoPagoPayments({ accessToken: process.env.MP_TOKEN!, webhookSecret: process.env.MP_SECRET! }),
  hold: 10, // minutes; 10 unless said
  load,
  find,
  onHeld: (b, { series }) => db.bookings.upsertMany(series), // held: keep it, it takes its place already
  onBooked: (b, { notice }) => (db.bookings.upsert(b), send(notice)), // paid, or with no price
  onCancelled: (b) => db.bookings.upsert(b),
});
```

At the provider, point the webhook to `https://example.com/s/paid`:

- **Stripe**: the `checkout.session.completed` event. Its signing secret (`whsec_…`) is `webhookSecret`.
- **Mercado Pago**: payment notifications. Its secret key is `webhookSecret`; each preference also carries its own `notification_url`.

## What happens {#flow}

1. `POST /s/:slug/book` checks the booking as always. If it costs anything, it is kept as `held` until `hold` minutes from now, the checkout begins, and the answer is **`202`** with `pay` (where to send whoever pays) and `until`.
2. While held, `busyOfBookings` counts it as taken. Once `held` passes, it stops counting by itself: no cron needed.
3. The provider tells `POST /s/paid`. Its signature is checked, the booking is confirmed (`payment.paid` keeps the payment's id, for refunds), and it reaches `onBooked` with its message.
4. If the payment comes after `held`, it is checked again: still free, it is confirmed; taken by someone else, it is cancelled, refunded (`refund`) and reaches `onCancelled`.
5. Whoever held it can let it go before with `POST /s/b/:token/cancel`.

When it is done, the provider sends whoever paid back to their booking's address (`manage`, with `?paid=1`).

Stripe keeps a checkout open for 30 minutes at the least. That is why step 4 exists: a late payment never takes a place you already sold to someone else.

## Deposits and refunds {#deposits}

A kind with `deposit: 30` charges 30% when booked; the rest stays in `booking.due`. Cancelling gives back what its `refunds` say, through `refund(booking, amount)`. See [Changes and refunds](/docs/policies/).

## In the browser {#hooks}

`useBooking` and `useStay` give `held` when the server answers `202`:

```tsx
const b = useBooking({ endpoint });

if (b.held)
  return (
    <div>
      <p>Held until {time(b.held.until)}: {money(b.held.booking.price)}</p>
      <a href={b.held.pay}>Pay</a>
      <button onClick={b.release}>Let it go</button>
    </div>
  );
```

- `held`: the booking held, with `pay` and `until`.
- `check()`: asks its address again whether it is paid; if so, it moves to `booked`.
- `release()`: lets it go, its place free again.

If the minutes run out, `held` goes back to `null` and `problems` says `run-out`. The package's widget already does all of this.

## Your own provider {#own}

```ts
import type { Payments } from '@reboschedule/server';

const mine: Payments = {
  provider: 'my-bank',
  async checkout({ booking, total, until, back, notify }) {
    const charge = await myBank.create({ amount: total.amount, currency: total.currency, reference: booking.id, expires: until, back, notify });
    return { id: charge.id, url: charge.url };
  },
  async notified(request) {
    const notice = await myBank.readNotice(request); // checks its signature
    return notice?.paid ? { booking: notice.reference, paid: notice.id } : null;
  },
  async refund(booking) {
    await myBank.refund(booking.payment!.paid!);
  },
};
```
