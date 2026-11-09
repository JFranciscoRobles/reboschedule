# Changes, refunds and deposits

Whoever booked can change the date or cancel from their booking's own address, the one in every message, with no account and without writing to anyone. Each kind says until when it can be changed, how much is given back on cancelling, and whether booking charges only a deposit.

<demo name="cabins" />

## A kind's rules {#rules}

```ts
const cabin: EventType = {
  ...kind,
  // Up to 3 days before, whoever booked changes it themselves.
  reschedule: 72,
  // All back up to 14 days before; half up to 3 days before; nothing after.
  refunds: [
    { hours: 14 * 24, percent: 100 },
    { hours: 3 * 24, percent: 50 },
  ],
  // Booking charges 30%; the rest is paid on arrival.
  deposit: 30,
};
```

- **`reschedule`**: how many hours before it can still be changed. Without it, it cannot. Nor can it be moved to a date already inside that window.
- **`refunds`**: the percent of what was paid that is given back, by how many hours are left; the first rule reached applies. With no rules, all of it.
- **`deposit`**: the percent charged when booked. The rest stays in `booking.due` and the message shows it as "Left to pay there".

## On the server {#server}

Changing the date is turned on by passing `onMoved`:

```ts
createBookingHandler({
  onMoved: async (booking, { before, notice }) => {
    await db.bookings.upsert(booking);
    await mail.send(notice); // "Moved: … now on …", its invitation one version on
  },
  onCancelled: async (booking, _, notice) => {
    await db.bookings.upsert(booking); // booking.refunded: what was given back
    await mail.send(notice); // says how much is given back, or that nothing is
  },
});
```

| Route | What it does |
| --- | --- |
| `GET /s/b/:token` | The booking, with `moveUntil` (until when it can be changed) and `refund` (what cancelling now would give back). |
| `POST /s/b/:token/move` | Moves it to `{ start }` or, for a stay, to `{ arrive }`. It keeps the length, the seats, the nights and the price. |
| `POST /s/b/:token/cancel` | Cancels it and gives back what the rules say, through your payment provider's `refund`. |

A discount code good only on some days (Tuesday's 2 for 1) cannot be taken to a day it is not good for. The server refuses it with `bad-coupon`.

## In the browser {#hooks}

`useManage` is the "my booking" page, without the design:

```tsx
const m = useManage({ address }); // the booking's own address

m.managed?.booking;           // the booking
m.canMove && m.choose(true);  // start choosing
m.times;                      // the times it can move to, by day
m.arrivals;                   // or the arrival days, for a stay
await m.move(slot.start);
await m.cancel();             // m.managed.refund says how much comes back, before doing it
```

In the demos, "Change or cancel" (and "Open my booking" in the messages) opens this very thing.
