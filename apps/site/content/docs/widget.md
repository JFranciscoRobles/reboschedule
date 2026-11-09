# The booking widget

`BookingWidget` is what whoever books sees: who and what, how long and where; the courts or rooms to choose from, with their pictures and prices; a month with the days that have times; the times of a day in their own time zone; their details; and, booked, the ways to put it in their calendar.

<demo name="widget" />

## Props

| Prop | What it is |
| --- | --- |
| `endpoint` | Where the routes of one kind are: `https://example.com/s/court`, its `/slots` and `/book`. |
| `locale` | `'en'` or `'es'`; English unless said. |
| `timeZone` | The time zone of whoever books; their browser's unless said. They can change it. |
| `onBooked` | Told each booking made, as the server answered it. |
| `fetch` | A fetch of your own: to add a header, for a test, or for a demo with no server. |
| `className` | A class of your own on its root. |

## What it does on its own

- **The first day with times is chosen**, so there are times to see at once.
- **Many times are grouped** into morning, afternoon and evening, as the clock of whoever books says them.
- **A resource chosen first** (a court, a room) asks the server for its times only, priced as it.
- **A time taken a moment ago** is said so, and the times are asked again.
- **Book another** starts again with the name and email kept.
- **Held while it is paid for** (when the server takes payments): it shows until when, a **Pay** button to the provider's checkout, and **Let it go**; when the minutes run out, it says so.
- **A discount code** field, only when the server takes codes, saying whether the code is good.

## What `onBooked` hands you

```ts
interface Booked {
  booking: Booking;   // what was booked, its price as the server quoted it
  type: EventType;    // the kind, with where it is (only who booked sees it)
  organizer: { name: string };
  manage: string;     // its own signed address, to see or cancel it
  ics: string;        // its invitation, as a file
  google: string;     // the address that puts it in Google Calendar
}
```

## A fetch of your own

The widget asks with the `fetch` it is given. Your app can add what its server needs:

```tsx
<BookingWidget
  endpoint="/s/court"
  fetch={(url, init) => fetch(url, { ...init, headers: { ...init?.headers, 'x-club': clubId } })}
/>
```

## Your own widget

`BookingWidget` is drawn on `useBooking`, which holds all of it: the times, what is chosen, the booking. To book in a look of your own, draw on the hook: see [Headless: your own UI](/docs/headless/).
