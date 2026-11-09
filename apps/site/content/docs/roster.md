# Rosters of shifts

A roster is the turns of a month given to the members of each group, as an office gives its shifts: each division (residential, commercial) its group of agents, each day a turn from 10 to 2 and one from 2 to 7, one person each. Whoever coordinates gives the month automatically or by hand; the agents look at their turns, say the days they cannot, and ask each other for changes.

<demo name="shifts" />

## The kind

The divisions are the resources of the kind, and each stretch of its hours one turn, whole (`whole: true`), however long it is:

```ts
const shift: EventType = {
  ...type,
  whole: true,
  capacity: 1,
  hours: { 0: turns, 1: turns, 2: turns, 3: turns, 4: turns, 5: turns, 6: turns },
  resources: [
    { id: 'res', name: 'Residential', image: '', values: {}, price: null },
    { id: 'com', name: 'Commercial', image: '', values: {}, price: null },
  ],
};
const turns = [{ from: '10:00', to: '14:00' }, { from: '14:00', to: '19:00' }];
```

## The members

```ts
const members: Member[] = [
  { id: 'ana', name: 'Ana López', email: 'ana@example.com', group: 'res' },
  { id: 'diego', name: 'Diego Soto', email: 'diego@example.com', group: 'com' },
  // …
];
```

## Given automatically

```ts
import { assignRoster } from '@reboschedule/core';

const { bookings, unfilled } = assignRoster({
  type: shift,
  schedule,
  month: '2026-11',
  members,
  unavailable: { carla: ['2026-11-03', '2026-11-04'] },
  bookings: given,     // those given before: kept, and counted
  from: today,         // the past as it was
});
```

Each turn of each division goes to someone of its group: whoever has fewer turns first, none on a day they said they cannot, none twice the same day while another may. `unfilled` says the turns no one could cover. Each booking carries its `member`.

## By hand

`turnsOf(type, schedule, month)` gives every turn of the month, of every group: a table to give each one by hand. `turnBooking(turn, member, type, schedule)` makes the booking of one.

## Changes between members

A member asks another for a change: their turn for one of the other's, or theirs covered.

```ts
import { coverBooking, swapBookings, swapProblems } from '@reboschedule/core';

swapProblems(mine, theirs, me, other, unavailable, timeZone); // [] | ['other-group' | 'unavailable' | 'same-member']
const [a, b] = swapBookings(mine, theirs);                    // the members exchanged, each a new version
const covered = coverBooking(mine, other);                    // given to the other
```

When it is accepted, each one is told: the turn they now have (`booked`) and the one they no longer do (`cancelled`), each with its invitation. Keeping the requests, and who may answer them, is your app's.
