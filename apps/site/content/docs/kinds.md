# Kinds of booking

A kind of booking (`EventType`) is what someone may book, and its rules: how long, every how many minutes it may start, the time kept free around it, how soon and how far ahead, how many a day, where, and what is asked.

## How long

| Field | What it is |
| --- | --- |
| `duration` | Minutes; the length chosen first when there are several. |
| `lengths` | Other lengths whoever books may choose: a court for 60, 90 or 120. |
| `increment` | Every how many minutes one may start; its duration unless said. |
| `before`, `after` | Minutes kept free around each booking: the way there, notes after. |

## When

| Field | What it is |
| --- | --- |
| `notice` | How soon one may be booked, in minutes from now. |
| `horizon` | How far ahead, in days. |
| `perDay` | How many a day at most; `null`, as many as fit. |
| `hours` | Hours of its own, instead of the owner's; `null`, the owner's. |

## Where

`place` is where it is: `in-person` (an address), `phone`, `video` (the link of the call), or `custom` (words). The address and the link are told only to whoever booked: the times free, which anyone may ask for, carry the kind without them.

## What is asked

Besides the name and the email, each kind asks what it needs: `questions`, each a line, a paragraph or a phone, required or not. The answers come with the booking, by the questions' ids.

## Everything else {#more}

| Field | What it is | See |
| --- | --- | --- |
| `resources`, `fields`, `capacity`, `whole` | What is booked (courts, rooms), their fields, places at once, whole turns. | [Courts, rooms and shifts](/docs/resources/) |
| `price` | Each hour, each booking, each place, each night. | [Prices](/docs/prices/) |
| `series` | How many times every week. | [Every week](/docs/repeat/) |
| `stay` | By nights or days. | [Rentals by the night](/docs/stays/) |
| `seating` | A cinema's room: rows, blocks, premium rows. | [Tickets](/docs/tickets/#seating) |
| `deposit`, `refunds`, `reschedule` | The deposit, what is given back by how long before, until when it can be changed. | [Changes and refunds](/docs/policies/) |

## The times free

`slotsOf(type, schedule, options)` gives the times free of a kind, the soonest first: each day's hours cut into starts every `increment`, each long enough, soon enough and not too far ahead, none that touches what is busy with the time kept free around it, and no more in a day than it may have.

```ts
const free = slotsOf(type, schedule, {
  busy,           // what is taken: bookings, the owner's own calendar
  length: 90,     // of the lengths the kind has
  from: '2026-11-03',
  to: '2026-11-09',
});
```
