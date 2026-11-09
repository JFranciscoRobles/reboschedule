# Rentals by the night or the day

A cabin is rented by the night: one arrives in the afternoon of a day and leaves at noon of another. Equipment (a kayak, a camera) is rented by whole days. Either way whoever books chooses the first and the last day on a month, and the kind checks each night (or day) of each resource.

<demo name="cabins" />

## The kind {#the-kind}

A kind with `stay` books stays instead of times:

```ts
const cabin: EventType = {
  ...kind,
  horizon: 120,
  stay: { unit: 'night', min: 2, max: 7, checkIn: '15:00', checkOut: '12:00' },
  price: { amount: 1800, currency: 'MXN', per: 'night' },
  resources: [
    { id: 'pine', name: 'Pine', image: '/pine.jpg', values: { people: 2 }, price: 1800 },
    { id: 'oak', name: 'Oak', image: '/oak.jpg', values: { people: 4 }, price: 2400 },
  ],
};
```

| Field | What it says |
| --- | --- |
| `unit` | `'night'`: arrive one day, leave another. `'day'`: whole days, the first and the last included. |
| `min`, `max` | How many nights (or days) at the least and at the most. |
| `checkIn`, `checkOut` | The hour one comes in on the first day and leaves on the last. |

A price `per: 'night'` (or `'day'`) is multiplied by the nights, at each resource's price.

## The free nights {#free-nights}

```ts
import { nightsOf, stayResource, makeStay, stayProblems, busyOfBookings } from '@reboschedule/core';

const nights = nightsOf(cabin, schedule, { busy: busyOfBookings(bookings) });
// [{ day: '2026-11-07', resources: ['pine', 'oak'] }, …]

stayResource(cabin, nights, '2026-11-07', '2026-11-11');       // the first cabin with all 4 nights
stayResource(cabin, nights, '2026-11-07', '2026-11-11', 'oak'); // 'oak', or null if it lacks one
```

A stay's night ends at noon the next day and the next stay comes in at 3: the same day can be one's departure and another's arrival.

## On the server {#on-the-server}

`createBookingHandler` answers `GET /:slug/stays` with the free nights, and `POST /:slug/book` with `arrive` and `leave` instead of `start`:

```json
{ "arrive": "2026-11-07", "leave": "2026-11-11", "resource": "oak", "name": "Lucía", "email": "lucia@example.com" }
```

The server checks each night again (`stayProblems`), quotes, and keeps a single booking from the first day to the departure.

## Headless {#headless}

```tsx
import { useStay } from '@reboschedule/react';

const s = useStay({ endpoint: '/api/booking/cabin' });
// s.weeks, s.nights, s.pick(day), s.arrive, s.leave, s.units, s.fits, s.price, s.book(visitor)
```

`pick` takes the first click as the arrival and the second as the departure; a third begins again. `fits` says which cabin has every night, or `null`.
