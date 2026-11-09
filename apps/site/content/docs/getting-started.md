# Getting started

Three steps: the routes of booking on your server, the widget on a page, and what your app does with each booking. The calendar of whoever looks after the bookings comes after, in [Month, day and panel](/docs/calendar/).

## Install

```bash
npm install @reboschedule/core @reboschedule/server @reboschedule/react
```

The packages need Node 22 or later on the server and React 19 in the browser. The engine works anywhere `Intl` does.

## The routes, on your server

The server is a function from a `Request` to a `Response`. You tell it where your things are: a kind of booking by its slug (`load`), a booking by its id (`find`), and what to do with each booking made (`onBooked`). In Next.js, one route answers all of it:

```ts
// app/s/[...path]/route.ts
import { createBookingHandler } from '@reboschedule/server';
import { db } from '@/lib/db';

const handle = createBookingHandler({
  secret: process.env.BOOKING_SECRET!, // long, random, the same in every process
  base: 'https://example.com',
  load: (slug) => db.calendarOf(slug),
  find: (id) => db.bookingWithCalendar(id),
  onBooked: async (booking, { calendar, manage, ics }) => {
    await db.bookings.insert(booking);
    await email(booking.email, { manage, ics });
  },
});

export const GET = handle;
export const POST = handle;
```

A calendar is a kind of booking with what it needs: the owner's hours, their name and email, and what is already taken.

```ts
const calendarOf = async (slug: string) => {
  const type = await db.types.bySlug(slug);
  if (!type) return null;
  return {
    type,
    schedule: await db.schedule(),
    organizer: { name: 'Club Rebo', email: 'club@example.com' },
    busy: (from, to) => db.bookings.between(type.id, from, to),
  };
};
```

## The widget, on a page

```tsx
'use client';
import '@reboschedule/react/styles.css';
import { BookingWidget } from '@reboschedule/react';

export default function BookACourt() {
  return <BookingWidget endpoint="/s/court" locale="en" />;
}
```

It asks `/s/court/slots` for the times free, shows them in the time zone of whoever books, and posts the booking to `/s/court/book`, where the server checks it again.

<demo name="widget" />

## Your hours and your kinds

The engine has samples to start from: `sampleSchedule()` (weekdays and Saturday mornings) and `sampleEventTypes()` (a call, a visit, courts, rooms and shifts). Your app keeps its own as JSON, written by the [editors](/docs/editors/) and read back with `readSchedule` and `readEventType`, which keep only what makes sense.

## Next

- [The booking widget](/docs/widget/): what it shows, and what it hands you.
- [Month, day and panel](/docs/calendar/): the side of whoever looks after the bookings.
- [The routes](/docs/server/): every route, and every option.
