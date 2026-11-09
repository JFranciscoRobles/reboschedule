# Prices

A kind may have a price: an amount each hour, or for the booking, in a currency. A resource may have its own. Whoever books sees the total before booking, the server quotes it again when the booking comes, and the booking keeps it. Taking the money is your app's.

<demo name="courts" />

## A price

```ts
const court: EventType = {
  ...type,
  price: { amount: 350, currency: 'MXN', per: 'hour' },
  resources: [
    { ...courtOne, price: null },  // the kind's: 350 each hour
    { ...courtFour, price: 450 },  // its own
  ],
};
```

`quoteOf(type, { resource, length })` says what a booking costs by the price: 450 × 2 hours is 900. `priceSlots` puts that price on each time free, as the resource asked or the first free; the server does it on `/slots`.

## Rules of your own

An evening that costs more, a member's price, a discount: give the server a `Quote`, and that is the price, on the times free and on the booking.

```ts
import { quoteOf } from '@reboschedule/core';

createBookingHandler({
  // …
  quote: ({ type, resource, start, length }) => {
    const price = quoteOf(type, { resource, length });
    return price && isEvening(start) ? { ...price, amount: price.amount + 100 } : price;
  },
});
```

## On the booking

`booking.price` is what the server quoted: `{ amount: 900, currency: 'MXN' }`. What the browser sends is never the price. `formatMoney(money, locale)` says it as it is read: `$1,100 MXN`.

## Taking the money

The package does not take money. With the price on the booking, your app charges it its way: a payment link in the email, a checkout before confirming, paying at the club.
