# Month, day and panel

Whoever looks after the bookings has three components: `BookingCalendar`, the month, with who has each turn and the gaps still free; `BookingDay`, one day with a column for each court, room or place; and `BookingPanel`, to give a gap to someone, change who has a booking, move it or delete it.

<demo name="shifts" />

## BookingCalendar

The month. Given one kind in turns that do not overlap (the shifts of an office), each day shows its turns, `Shift 1` and `Shift 2`, with the names of who has each. Any other kind, or all of them, shows each day its bookings, the time and the name.

```tsx
<BookingCalendar
  bookings={bookings}
  types={types}
  schedule={schedule}
  type="shift"
  slots={gaps}              // the times free, as /slots gives them: the gaps, shown
  onPick={(slot) => give(slot)}
  onSelect={(booking) => open(booking)}
  onDay={(day) => showDay(day)}
  locale="en"
/>
```

Given `slots`, it shows each place free of a turn as `+ Free`, and above the month how many gaps are still free ahead, with a button that goes to the next one.

## BookingDay

One day, a column for each court or room (or each place of a turn), the hours down the side, each booking a block as long as it is, and each gap a `+` that gives that very court at that very time. A red line says where now is, on today.

```tsx
<BookingDay bookings={bookings} types={types} schedule={schedule} type="court" day={day} onDay={setDay} slots={gaps} onPick={give} onSelect={open} />
```

## BookingPanel

The panel beside them. Without a booking, it gives a gap to someone; with one, it changes who has it, moves it (the next gap chosen in the calendar is where) or deletes it, once it is said so. What is asked of the server is your app's: the panel tells you, and shows what went wrong.

```tsx
<BookingPanel
  type={type}
  booking={booking}
  timeZone={schedule.timeZone}
  moving={moving}
  onMove={setMoving}
  onSave={async (details) => (await api.change(booking.id, details)).problems}
  onDelete={() => api.cancel(booking.id)}
  onClose={close}
/>
```

## Moving a booking

Moving is two steps: the panel says it is being moved (`onMove(true)`), you pass `moving` to the calendar so its gaps are shown as where it may go, and the gap chosen comes to `onPick`. On your server, `moveBooking` checks that time against the times free without the booking itself:

```ts
import { moveBooking, slotsOf } from '@reboschedule/core';

const free = slotsOf(type, schedule, { busy: busyWithout(booking.id), length });
const moved = moveBooking(booking, start, type, free); // null if it is not free
```

## Your own calendar

`BookingCalendar` and `BookingDay` are drawn on `useMonth` and `useDay`: the turns, who has each, the gaps, the columns and the blocks, worked out. See [Headless: your own UI](/docs/headless/#usemonth).
