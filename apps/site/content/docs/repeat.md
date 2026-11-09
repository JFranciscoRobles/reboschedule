# Every week

A booking can be the same day of the week and the same hour, again and again: a class every Tuesday, a shift every Monday morning. Each week is checked as any booking is; those free are booked, sharing the id of their series, and those not are said.

<demo name="classes" />

## The times of a series

```ts
import { occurrencesOf } from '@reboschedule/core';

occurrencesOf(start, 60, { every: 1, count: 8 }, 'America/Tijuana');
// [{ start, end }, …] eight Tuesdays at 7:00, as the owner's clock says it
```

A `Repeat` is every how many weeks (`every`), and how many times (`count`) or until which day (`until`). The hour is the owner's clock's, the night the clocks change too: 7:00 in March is 7:00 after the change, not an hour off.

## Which are free

`planSeries` says, for each time of a series, whether it is free, as `slotsOf` says it that day, and of which resource:

```ts
import { planSeries } from '@reboschedule/core';

const plan = planSeries(type, schedule, { start, repeat: { every: 1, count: 8 }, busy, resource: 'court-4' });
// [{ start, end, resource: 'court-4' }, { start, end, resource: null }, …] null: not free
```

`owner: true` leaves out the notice and the horizon: a coordinator gives the turns of months ahead.

## Making them

`makeSeries(request, type, plan)` makes the bookings of the times that are free, each with the same `series`. One alone has none.

## Whoever books, every week

A kind lets whoever books take it every week up to `series` times (`0`, one at a time). The widget then offers *Once* or *Every week × n*, and the server answers with all of them and those left out:

```ts
// POST /s/class/book  { …, repeat: { every: 1, count: 8 } }
// 201 { booking, series: [8 bookings], skipped: [] }
```

`onBooked` gets `done.series`: keep all of them.

## From the panel

`BookingPanel` offers *Every week × 4, 8, 12* when it is given `onPlan`: it shows each date, free or not, before giving it. A booking of a series is deleted alone or with the rest of it: `onDelete('one' | 'series')`.

```tsx
<BookingPanel slot={gap} onPlan={(repeat) => planSeries(type, schedule, { start: gap.start, repeat, busy, owner: true })} … />
```
