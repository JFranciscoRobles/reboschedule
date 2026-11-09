# A booking

A booking (`Booking`) is when, of what kind, which resource, who, what they answered, its price and its status. Times are ISO strings in UTC; the time zone of whoever booked is kept, to tell them their time in it.

```ts
interface Booking {
  id: string;
  type: string;          // the id of its kind
  resource: string;      // the id of the resource; '' for none
  start: string;
  end: string;
  name: string;
  email: string;
  timeZone: string;
  answers: Record<string, string>;
  price?: Money | null;
  status: 'confirmed' | 'cancelled' | 'held';
  held?: string;         // held while it is paid for: until when its place is kept
  payment?: { provider: string; id: string; url?: string; paid?: string; amount?: number };
  due?: Money;           // left to pay there, when only a deposit was paid
  discount?: { code: string; amount: number };
  refunded?: Money;      // what was given back when it was cancelled
  seats?: string[];      // the seats of a cinema
  places?: number;       // so many places of a zone
  series?: string;       // the id its weekly series shares
  sequence?: number;     // its invitation's version
  reminded?: string;     // when whoever booked was reminded
  attended?: 'arrived' | 'no-show';
  arrived?: string;      // when it came in at the door
  created: string;
}
```

## Checked as it comes

`bookingProblems(request, type, free)` says what a request lacks, or why it may not be: `taken` (the time is not free, or the resource asked has no place), `no-name`, `bad-email`, `missing-answer`; for a stay, `too-short` and `too-long`; `bad-coupon` (a code that does not exist or is not good for it); moving it, `too-late`. The hooks add `run-out` (a hold whose minutes ran out unpaid) and `failed` (the server did not answer). `describeBookingProblem` says each in words, in English or Spanish. The server checks against the times free as they are when the request comes: whoever was first keeps it.

## Made

`makeBooking(request, type, now, free, quote)` makes it: for the length asked, of the resource asked or the first free, at its price.

## Moved

`moveBooking(booking, start, type, free)` moves it to another time free, its length kept, its resource the same if it has a place there. `free` are the times free without it.

## Its invitation

`icsOf(booking, type, organizer)` is its invitation, an iCalendar file every calendar opens, and its cancelling when it is cancelled. `googleCalendarUrl` puts it in Google Calendar in one click.

## Its own address

Each booking has an address of its own, signed with your secret: `/s/b/<token>` to see it, `/s/b/<token>/ics` for its invitation, and a `POST` to `/s/b/<token>/cancel` to cancel it. No account: whoever has the address may.

## What happens to it after {#after}

- **Held and paid:** [Payments](/docs/payments/).
- **Changed or cancelled by whoever booked, with its refund:** [Changes and refunds](/docs/policies/).
- **With a discount:** [Discount codes](/docs/coupons/).
- **Reminded, or a place freed for whoever waits:** [Waitlist and reminders](/docs/waitlist/).
- **In at the door, came or did not:** [Entry and attendance](/docs/checkin/).
- **Kept at once, never two for one place:** [Your database](/docs/database/).
