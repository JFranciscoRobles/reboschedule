# How it works

Three layers, each standing on the one below: the engine works out, the server checks and answers, the components and hooks draw and ask.

## The engine

`@reboschedule/core` is functions of plain data, with nothing but `Intl`. From the owner's hours, a kind and what is busy, `slotsOf` works out the times free:

1. **The days.** From today (or `from`) to the horizon (or `to`), as the owner's clock says them.
2. **The hours of each.** Its date's if it has some, else its weekday's, in the kind's own hours if it has them.
3. **The starts.** Each stretch cut every `increment` minutes, each as long as the length asked. A minute that does not exist that night (the clocks going forward) is skipped.
4. **Soon, and not too far.** None sooner than `notice`, none further than `horizon`.
5. **What is busy.** None that touches something busy, with `before` and `after` kept free around it. Something busy with no resource takes all; one of a resource takes one place of it.
6. **The most a day.** A day with `perDay` bookings gives no more.

Each time free says how many places are left (`free`) and of which resources (`resources`).

## The server

`createBookingHandler` answers `/slots` with those times, priced, and the kind without where it is. On `/book` it reads the request, works out the times free again, as they are that second, and checks the request against them; only then does it make the booking, quote it, and tell your app. Each booking's address is its id signed with your secret: no account, and nothing kept by the server.

## The components and hooks

`useBooking` holds what whoever books chooses and asks the routes; `useMonth` and `useDay` work out what whoever looks after the bookings sees. The components draw them. Nothing in them decides whether a time is free: the server does.

## Time zones

Every instant is ISO in UTC; every day and hour is said in a time zone. The owner's hours are in theirs; the times free are laid out by the days of whoever books, in theirs; the calendar of the owner is in the owner's.
