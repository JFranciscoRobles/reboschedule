# Discount codes

A code takes off a percent (`percent`) or an amount (`amount`), or lets one pay `pay` of each `take` places: a 2 for 1. It can be good only for some kinds, some days of the week, or until a date. The server checks and applies it when the booking is made, like the price: what the browser says does not count.

<demo name="tickets" />

```ts
const codes: Coupon[] = [
  { code: 'TUESDAY2X1', label: '2 for 1 on Tuesdays', take: 2, pay: 1, days: [2], types: ['movie'] },
  { code: 'WOODS10', label: '10% off your stay', percent: 10 },
  { code: 'FIRST', label: '$50 off', amount: 50, until: '2026-12-31' },
];

createBookingHandler({
  coupons: (code, type) => codes.find((c) => c.code === code),
});
```

- The 2 for 1 gives away the cheapest places: of 4 seats, the 2 dearest are paid.
- The booking keeps `discount: { code, amount }`, and its `price` already has the discount taken off. The message shows both.
- A code that does not exist or is not good for that booking is refused with the problem `bad-coupon`.

## In the browser {#hooks}

`useBooking` and `useStay` have `coupons` (whether the server takes codes), `coupon` and `setCoupon`, and `applied` (the code, if it is good for this kind). To show how much comes off before booking:

```ts
const off = b.discountFor(seats.map(priceOf), b.slot.start); // 0 if not good that day
```

`useStay` already gives `discount`, and its `price` includes it. The package's widget shows the field only when the server takes codes.
