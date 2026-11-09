# Waitlist

When a show, a zone or a time is full, whoever wanted it can join a list. If a place frees up, because someone cancelled, changed the date or did not pay in time, the first on the list who fits is told, with the link to book it. Whoever books first gets it: the list does not hold places.

<demo name="tickets" />

```ts
createBookingHandler({
  waitlist: {
    list: (type, start) => db.waiting.byTime(type.id, start), // the first first
    onAdded: (waiting) => db.waiting.insert(waiting),
    onOffered: async (waiting, offer) => {
      await db.waiting.mark(waiting.id, waiting.offered); // told already: only once
      await mail.send(offer); // "A place is free: …"
    },
  },
  page: (type) => `https://example.com/book/${type.slug}`, // where the message's link goes
});
```

- `GET /s/:slug/slots` also gives `full`: the times that are full, to offer the list.
- `POST /s/:slug/wait` with `{ start, places, resource, name, email }` adds someone. If there is room after all, it answers `409` with `free`, so they book right away.
- Cancelling and moving tell the list by themselves. A hold that runs out unpaid tells no one on its own: call `handler.offer(calendar, start)` from the same cron as the reminders.

In the browser, `useBooking` gives `waitlist`, `full`, `wait(visitor, start, { places })` and `waiting`.

## Reminders {#reminders}

A message the day before cuts no-shows a lot. `remindersDue(bookings, now, 24)` says who is due: confirmed, starting in the next 24 hours, not reminded yet. `handler.reminder(booking, calendar)` makes the message, with the link to change or cancel it.

```ts
// Every 15 minutes, from your cron.
for (const booking of remindersDue(await db.bookings.upcoming())) {
  await mail.send(await handler.reminder(booking, calendarOf(booking)));
  await db.bookings.upsert({ ...booking, reminded: new Date().toISOString() });
}
```
