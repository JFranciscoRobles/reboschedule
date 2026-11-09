# Google, Outlook and iCal

Whoever gives appointments has a calendar of their own: what is in it is busy, and is never offered. `@reboschedule/calendars` reads it as the engine takes it. Your app authorizes; it reads.

<demo name="clinic" />

## A secret iCal address

Google, Outlook and Apple give each calendar a secret address. Whoever gives appointments pastes it once; no OAuth, no console.

```ts
import { fetchIcsBusy } from '@reboschedule/calendars';

const busy = await fetchIcsBusy(secretAddress, { from, to, timeZone: 'America/Tijuana' });
// [{ start, end, title }, …]
```

It reads what takes time, in the time zone it names; whole days; events that repeat (daily or weekly, every so often, so many times or until a day, the days left out left out); and leaves out what is marked free and what was cancelled. `icsBusy(text, …)` reads the text itself.

In Google: *Settings → the calendar → Integrate calendar → Secret address in iCal format*. In Outlook: *Settings → Calendar → Shared calendars → Publish a calendar → ICS*.

## Google Calendar

With a token your app has, authorized with the scope `calendar.freebusy`:

```ts
import { googleBusy } from '@reboschedule/calendars';

const busy = await googleBusy({ accessToken, calendars: ['primary'], from, to });
```

## Outlook

With a token of Microsoft Graph, authorized with `Calendars.Read`:

```ts
import { outlookBusy } from '@reboschedule/calendars';

const busy = await outlookBusy({ accessToken, schedules: ['sofia@clinic.com'], from, to });
```

## In the calendar of a kind

```ts
import { cachedBusy, combineBusy, fetchIcsBusy } from '@reboschedule/calendars';

// Read once a minute at most; one calendar away does not close the others.
const theirs = cachedBusy((from, to) => fetchIcsBusy(secretAddress, { from, to, timeZone }), 60_000);
const busy = combineBusy(theirs, (from, to) => db.bookings.between(from, to));

createBookingHandler({ load: (slug) => ({ type, schedule, organizer, busy }) });
```

`BookingDay` shows it where it is, striped, with `away={busy}`.

## What stays yours

Asking for permission, keeping tokens and renewing them are your app's: they depend on your accounts with Google and Microsoft and on where you keep secrets. Being told at once of a change in their calendar (Google's push channels, Graph's subscriptions) is not done yet: read it again, `cachedBusy` keeps it a while.

## Writing their calendar {#writing}

`googleWriter` and `outlookWriter` put each booking in the owner's own calendar, and take it out when it is cancelled. Each event is found again by the booking's id, so writing the same booking twice changes it rather than adding another. The token needs `calendar.events` (Google) or `Calendars.ReadWrite` (Outlook).

```ts
import { googleWriter } from '@reboschedule/calendars';

const agenda = googleWriter({ accessToken: await tokenOf(owner) });

createBookingHandler({
  onBooked: async (b, { calendar }) => agenda.write(b, calendar.type, calendar.organizer),
  onMoved: async (b, { calendar }) => agenda.write(b, calendar.type, calendar.organizer),
  onCancelled: async (b, calendar) => agenda.write(b, calendar.type, calendar.organizer), // cancelled: taken out
});
```

The event says the kind and who booked, when, where, the seats or the resource, the answers and the price.
