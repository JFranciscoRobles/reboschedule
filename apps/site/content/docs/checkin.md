# Entry and attendance

Each ticket carries an entry code. Its QR goes in the email, and it is scanned at the door: it gets in **once**, on the day of the show. If someone uses it again, the door refuses it and says what time it came in. For appointments and courts, whoever looks after them marks **came** or **did not come**; with that, the reports measure no-shows.

<demo name="tickets" />

## The code {#code}

```ts
const handler = createBookingHandler({ tickets: true /* … */ });
```

With `tickets: true`, each confirmed booking carries `ticket` in its answer, and its message says the QR is attached. Drawing it is your app's, with any library:

```ts
import QRCode from 'qrcode';

onBooked: async (booking, { notice }) => {
  const code = await handler.ticketOf(booking);
  await mail.send({ ...notice, attachments: [{ filename: 'ticket.png', content: await QRCode.toBuffer(code) }] });
};
```

The code (`RS1.…`) is signed apart from the booking's address. Whoever sees the QR can get in, but cannot cancel or change the booking.

## At the door {#door}

Your entry screen (for your staff only) reads the code and asks:

```ts
const id = await handler.readTicket(code); // null if this server did not sign it
const booking = id && (await db.bookings.byId(id));
const entry = checkIn(booking, Date.now(), timeZone);

if (entry.ok) await db.bookings.upsert(entry.booking); // attended: 'arrived', arrived: now
else show(describeEntry(entry.reason, 'en', booking.arrived, timeZone)); // "This ticket already came in at 9:50."
```

The reasons a ticket is refused: `used` (already in), `cancelled`, `held` (not paid) and `not-today`.

A barcode scanner works as a keyboard: it types the code and presses Enter. In the browser, `BarcodeDetector` reads QR with the camera; the demo does both.

## Came or not {#attendance}

`markAttendance(booking, 'arrived' | 'no-show')`. `BookingPanel` shows both buttons from the day of the booking when given `onAttend`:

```tsx
<BookingPanel booking={booking} onAttend={(a) => save(a ? markAttendance(booking, a) : unmarked(booking))} />
```
