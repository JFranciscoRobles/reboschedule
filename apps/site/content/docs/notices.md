# Telling whoever booked

When a booking is made, moved, corrected or cancelled, whoever booked it is told, and their calendar changes it. ReboSchedule makes the message: a subject and a text in their language and their time zone, and the invitation as it is now. Your app sends it, with whatever provider it uses.

<demo name="clinic" />

## The message

```ts
import { noticeOf } from '@reboschedule/core';

const notice = noticeOf('moved', after, type, organizer, { locale: 'en', before, manage });
notice.to;       // { name, email }
notice.subject;  // 'Moved: Dental consultation · now Monday, November 2, 6:30 PM'
notice.text;     // the body, plain text
notice.ics;      // the invitation, to attach
notice.method;   // 'REQUEST' | 'CANCEL'
```

`changeOf(before, after)` says what changed: `booked`, `moved`, `changed` or `cancelled`. A notice's `kind` can also be `reminder`, the day before (see [Reminders](/docs/waitlist/#reminders)).

What the message says besides when and where, when it applies:

- the code taken off and its discount;
- what is left to pay there, when only a deposit was paid;
- on cancelling a paid booking, how much is given back, or that nothing is;
- the entry code, when the server gives tickets (its QR attached, see [Entry](/docs/checkin/));
- the link "to see it, move it or cancel it" when it can be moved.

Someone waiting on a list gets `offerOf(waiting, type, organizer, { link })` when a place frees up. Each message also has a short version for WhatsApp or SMS: see [WhatsApp and SMS](/docs/messages/).

## Each change, a version

An invitation has a version (`SEQUENCE`). Each change raises it, and Google, Outlook and Apple change the event they have, with the same `UID`, instead of adding another:

- `moveBooking` moves it, a version more.
- `changeBooking(booking, { name, email, answers })` corrects it, a version more.
- `cancelBooking(booking)` cancels it, a version more, its invitation a `CANCEL`.

## From the server

`onBooked` gets the message of each booking made (`done.notice`), and `onCancelled` the one of each cancelled by whoever booked it. What the owner changes from the panel is your app's to make, with the functions above.

```ts
createBookingHandler({
  onBooked: async (booking, { notice, series }) => {
    await db.bookings.insertMany(series);
    await mail.send({
      to: notice.to.email,
      subject: notice.subject,
      text: notice.text,
      attachments: [{ filename: 'invite.ics', content: notice.ics, contentType: `text/calendar; method=${notice.method}` }],
    });
  },
});
```

## Sending

The package sends nothing: no provider, no account, no queue. `mail.send` above is yours: SMTP, Resend, Amazon SES, SendGrid, whatever your app already uses.
