# The routes

`createBookingHandler` gives the routes booking needs, as a function from a `Request` to a `Response`: a route of Next.js, a Worker, Bun, or `node:http` through `nodeHandler`. Nothing is kept by it: your app says what it has, and is told what is booked and cancelled.

## Routes

| Route | What it answers |
| --- | --- |
| `GET /s/:slug/slots` | The times free of a kind, priced: `?from`, `?to` (days), `?length` (minutes), `?resource`. |
| `POST /s/:slug/book` | A booking, checked again: `201` with it, `409` if the time was taken, `422` for what it lacks. |
| `GET /s/b/:token` | A booking, by its own signed address. |
| `GET /s/b/:token/ics` | Its invitation, as a file. |
| `POST /s/b/:token/cancel` | Cancels it. |
| `POST /s/b/:token/move` | Moves it, with `onMoved`: see [Changes and refunds](/docs/policies/). |
| `POST /s/:slug/wait` | Someone waiting for a full time, with `waitlist`: see [Waitlist](/docs/waitlist/). |
| `POST /s/paid` | What the provider of payments says was paid, with `payments`: see [Payments](/docs/payments/). |

The kind on `/slots` comes without where it is: the address and the link of a call are told only to whoever booked it.

## Options

| Option | What it is |
| --- | --- |
| `secret` | Long, random, the same in every process: what each booking's address is signed with. Sixteen characters at least. |
| `base` | Where the server is seen from outside: `https://example.com`. |
| `prefix` | The path the routes are under; `/s` unless said. |
| `load(slug)` | A kind by its slug, as a `Calendar`; none if there is no such. |
| `find(id)` | A booking by its id, with its calendar. |
| `onBooked(booking, done)` | Told each booking made, with its `calendar`, its `manage` address, its `ics`, the message to send (`notice`), and, booked every week, its `series` (keep them all) and the times `skipped`. |
| `onCancelled(booking, calendar, notice)` | Told each booking cancelled by whoever booked it, with the message that says so. |
| `tickets` | Each booking's entry code, in its message and its answer: see [Entry and attendance](/docs/checkin/). |
| `keep` | Keeps what is booked at once with checking it is still free: see [Your database](/docs/database/). |
| `onMoved` | Told each booking moved by whoever booked it; given, they may move it. |
| `coupons` | A discount by its code: see [Discount codes](/docs/coupons/). |
| `waitlist`, `page` | Whoever waits for a full time, and where the message sends them. |
| `payments`, `hold`, `onHeld` | Who takes the payments, how many minutes what costs is held, and who is told of what is held: see [Payments](/docs/payments/). |
| `quote` | What a booking costs by rules of your own; the kind's price unless given. |
| `locale` | The language of the problems it says; English unless said. |
| `now` | Now, as milliseconds; for tests. |

## A calendar

```ts
interface Calendar {
  type: EventType;
  schedule: Schedule;
  organizer: { name: string; email: string };
  busy(from: string, to: string): Busy[] | Promise<Busy[]>;
}
```

`busy` is what is taken between two instants: the bookings of the kind, and, for the owner's own time, their own calendar too. A busy time that names no resource takes all of them.

## With node:http and Express

```ts
import { createServer } from 'node:http';
import { createBookingHandler, nodeHandler } from '@reboschedule/server';

const handle = nodeHandler(createBookingHandler({ /* … */ }));
createServer(handle).listen(3000);
// Express: app.use('/s', handle)
```

## When something fails

What fails in a route (your `load`, a database away) is answered `500` and written to the console; the server goes on.

## The invitation by email

ReboSchedule sends no email: your app sends it with whatever it uses, its provider, its own SMTP, a service of its choosing. `onBooked` gets what to send: the invitation as text (`ics`) and the booking's own address (`manage`). Attach the invitation as `invite.ics`, with `text/calendar; method=REQUEST`, and every calendar shows it as an invitation. `onCancelled` is the time to send its cancelling, `icsOf` of the booking as it is now.
