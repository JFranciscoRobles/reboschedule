# Status and roadmap

ReboSchedule is at 0.1. What these pages say works, is tested, and runs in the six demos. It is not yet on npm.

## What works

- The times free in any time zone, the night the clocks change too.
- Kinds with lengths to choose, time kept free around them, notice, horizon and the most a day; hours of their own.
- Resources with fields and pictures; places at once; turns.
- Prices each hour or each booking, a resource's own, and rules of your own; quoted again by the server and kept on the booking.
- A booking checked again as it comes; its invitation, its signed address, its cancelling.
- The widget; the month, the day and the panel; the editors; English and Spanish.
- Bookings every week, as a series; rosters of shifts given automatically or by hand, and changes between members.
- Stays by the night or the day; people with their own hours, sharing them among services; tickets by the seat or by the zone.
- Entry codes as QR, let in once at the door; came or did not come; reports and every booking as CSV; WhatsApp and SMS by Twilio or Meta's Cloud API.
- Changes and cancelling by whoever booked, refunds by how long before, deposits; discount codes; a waitlist; reminders; bookings kept at once by a unique index or a lock; the week; bookings written in the owner's Google or Outlook.
- Payments with Stripe, Mercado Pago or your own provider: the place held some minutes while it is paid for, free again by itself if not; a cinema's room laid out in rows, blocks and aisles.
- The message of each change, its invitation a new version; the owner's own Google, Outlook or iCal read as busy.

## Tested

Every package has its tests: the engine (time zones, the times free, resources, places, prices, reading), the server (its routes, two people for one time, a court for each, a shift of two), and the components, the widget against the real server.

## What is missing

- **Told at once.** Hearing of a change in the owner's Google or Outlook as it happens (it is read again for now).
- **npm.** Publishing the packages, and the documentation of each prop.

## Where it comes from

ReboSchedule is part of the Rebo suite, with Rebodocs, Rebomail and ReboProfiles: each a package your app takes, not a service it sends its people to.
