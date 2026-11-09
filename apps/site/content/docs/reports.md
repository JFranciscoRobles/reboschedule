# Reports

`reportOf` works out, from a day to a day (by the day each booking is, in the owner's time zone):

- what came in each day and what was given back;
- how many bookings and how many places;
- how full each resource was of the hours (or nights) it had open;
- who came and who did not, and the no-show rate;
- what codes took off, and how many times each was used;
- what is left to charge there.

`bookingsCsv` gives every booking as a CSV that Excel or Google Sheets opens with accents and commas intact.

<demo name="cabins" />

```ts
import { bookingsCsv, lastDays, reportOf } from '@reboschedule/core';

const r = reportOf(bookings, types, schedule, lastDays(30, schedule.timeZone));

r.totals;    // { revenue, refunded, bookings, places, cancelled, arrived, noShows, noShowRate, discounts, due }
r.days;      // [{ day, revenue, refunded, bookings, places, cancelled }]
r.resources; // [{ type, resource, name, occupancy (0 to 1), bookings, revenue }]
r.coupons;   // [{ code, uses, amount }]

new Response(bookingsCsv(bookings, types, schedule), { headers: { 'content-type': 'text/csv; charset=utf-8' } });
```

What is held unpaid does not count. A cancelled booking counts what was charged less what was given back. Drawing it is yours; the **Reports** tab of each demo is one way.
