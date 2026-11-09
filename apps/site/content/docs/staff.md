# People with their own hours

A barbershop with three barbers who don't come the same days; a clinic with two doctors; a garage with morning and afternoon mechanics. Each person is a resource with their own `hours`, and each service a kind that shares those resources.

<demo name="barber" />

## Each their own hours {#own-hours}

```ts
const week = (h, days) => Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, days.includes(d) ? h : []]));

const barbers = [
  { id: 'tono', name: 'Toño', image: '/tono.jpg', values: {}, price: null, hours: week([{ from: '10:00', to: '19:00' }], [2, 3, 4, 5, 6]) },
  { id: 'memo', name: 'Memo', image: '/memo.jpg', values: {}, price: null, hours: week([{ from: '09:00', to: '14:00' }], [1, 2, 3, 4, 5]) },
  { id: 'pau', name: 'Pau', image: '/pau.jpg', values: {}, price: null, hours: week([{ from: '13:00', to: '20:00' }], [0, 3, 4, 5, 6]) },
];
```

A resource with `hours` is offered only in them; one without uses its kind's. A day's free times are the union of all of them, and each says in `resources` who is free.

## Services that share people {#shared}

```ts
const cut = { ...kind, id: 'cut', duration: 30, price: { amount: 250, currency: 'MXN', per: 'booking' }, resources: barbers };
const beard = { ...kind, id: 'beard', duration: 20, price: { amount: 150, currency: 'MXN', per: 'booking' }, resources: barbers };
```

So a cut with Toño takes him for a beard trim too, pass as busy what any kind took of the same resource:

```ts
const busy = busyOfBookings(bookings.filter((b) => barbers.some((r) => r.id === b.resource)));
slotsOf(beard, schedule, { busy });
```

## Choose, or the first free {#choose-or-any}

With `useBooking`, `setResource('memo')` asks for Memo's times alone; `setResource('')` for anyone's, and the booking takes the first free at that time. `works(type, schedule, 'memo', day, from, to)` says whether someone works a stretch: `BookingDay` uses it to stripe the hours they are away.
