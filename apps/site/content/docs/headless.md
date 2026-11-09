# Headless: your own UI

The components are drawn on three hooks, and the hooks hold all there is: the times free, what is chosen, the booking and its problems; the month, its turns and gaps; the day, its columns and blocks. Draw an interface of your own on them, and it books, moves and counts exactly as the components do.

<demo name="headless" />

## useBooking

Everything the widget is, without what it looks like. It asks the server's routes as the widget does.

```tsx
import { useBooking } from '@reboschedule/react';

function Times() {
  const b = useBooking({ endpoint: '/s/court' });
  if (b.status !== 'ready') return <p>…</p>;
  return (
    <>
      {b.times.map((slot) => (
        <button key={slot.start} onClick={() => b.choose(slot)}>
          {new Date(slot.start).toLocaleTimeString([], { timeZone: b.timeZone, timeStyle: 'short' })}
        </button>
      ))}
      {b.slot && <button onClick={() => b.book({ name: 'Ana', email: 'ana@example.com' })}>Book</button>}
    </>
  );
}
```

| Field | What it is |
| --- | --- |
| `status` | `'loading'`, `'failed'` or `'ready'`. |
| `type` · `organizer` | The kind (without where it is) and whose it is. |
| `timeZone` · `setTimeZone` · `ownerTimeZone` | The time zone of whoever books, and the owner's. |
| `lengths` · `length` · `setLength` | The lengths to choose, the shortest first, and the one chosen. |
| `resource` · `setResource` | The resource chosen, `''` for any free; its times are asked for alone, priced as it. |
| `days` | The times free, by the days of whoever books: a `Map` of day to slots. |
| `month` · `weeks` · `setMonth` · `moveMonth` | The month shown, its weeks (Monday first), and moving it. |
| `day` · `setDay` | The day chosen, while it has times; else the first of the month that has. |
| `times` · `parts` · `dayPrice` | The times of that day, the same by morning, afternoon and evening, and the price when all cost the same. |
| `slot` · `choose` | The time chosen; `choose(null)` to choose again. |
| `book(visitor)` | Sends the booking: the booking made, or `null` and `problems`. A time taken a moment ago asks for the times again. |
| `sending` · `problems` | While it is sent; what the server said was wrong, each with its `code` and `message`. |
| `booked` · `again` | The booking made, and booking another. |
| `reload` | Asks for the times again. |
| `held` · `check` · `release` | Held while it is paid for (`pay`, `until`); asking its address whether it is paid now; letting it go. See [Payments](/docs/payments/#hooks). |
| `coupons` · `coupon` · `setCoupon` · `applied` · `discountFor` | Whether the server takes codes; the code written; the discount, if good for this kind; what it takes off at a time. See [Discount codes](/docs/coupons/#hooks). |
| `waitlist` · `full` · `wait` · `waiting` | Whether the server keeps a waitlist; the times that are full; joining the list for one. See [Waitlist](/docs/waitlist/). |

Three more hooks: `useStay` for stays ([Rentals by the night](/docs/stays/#headless)), `useManage` for a booking from its own address ([Changes and refunds](/docs/policies/#hooks)), and `useWeek`, the week as `BookingWeek` draws it ([Components](/docs/components/#bookingweek)).

## useMonth

The month of whoever looks after the bookings, worked out.

```tsx
import { useMonth } from '@reboschedule/react';

const m = useMonth({ bookings, types, schedule, type: 'shift', slots });
m.weeks.flat().map((day) => day && day.turns.map((turn) => `${turn.n}: ${turn.who.map((b) => b.name)} · ${turn.free} free`));
```

| Field | What it is |
| --- | --- |
| `month` · `setMonth` · `moveMonth` · `today` | The month shown, moving it, and today. |
| `kind` · `inTurns` | The kind shown, and whether its starts are turns of their own. |
| `weeks` | Each day: `day`, `today`, `past`, its `bookings`, its `turns` (`n`, `start`, `end`, `who`, `free`, `gap`) and its `gaps`. |
| `ahead` · `firstGap` | How many are still free ahead, and the day of the first. |

## useDay

One day, its columns and rows, and each booking where it goes.

```tsx
import { useDay } from '@reboschedule/react';

const d = useDay({ bookings, types, schedule, type: 'court', slots, day: '2026-11-03' });
```

| Field | What it is |
| --- | --- |
| `day` · `setDay` · `moveDay` · `today` | The day shown, and moving it. |
| `columns` | Each resource (`id`, `name`, `image`), or each place of a turn (`place`), or the owner alone. |
| `rows` | A row each step from opening to closing: its `minute`, its instant `at`, and for each column the `gaps` to give there. |
| `blocks` | Each booking: its `column`, its first `row`, and how many rows it `span`s. |
| `step` · `closed` · `free` · `now` | The minutes of a row, a day with no hours, its gaps, and where now is, in rows. |

## What stays yours

The hooks hold state and ask the routes; they draw nothing and keep nothing. The words are yours (or `WORDS`), the look is yours, and where the bookings live is your server's.
