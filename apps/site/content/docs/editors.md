# The editors

`ScheduleEditor` writes the owner's hours: their time zone, the stretches of each day of the week, and the days that are not as the week says. `EventTypeEditor` writes a kind of booking, all of it. `BookingList` lists what is booked, the coming ones first.

<demo name="editor" />

## ScheduleEditor

```tsx
<ScheduleEditor schedule={schedule} onChange={setSchedule} locale="en" />
```

Each day is switched on or off, has as many stretches as it needs, and can be copied to every day at a click. A day that is not as the week (a holiday, a Saturday open) has its own hours, or none.

## EventTypeEditor

```tsx
<EventTypeEditor type={type} onChange={setType} locale="en" />
```

It writes the title and the address of the kind, how long and the other lengths to choose, every how many minutes one may start, the time kept free before and after, how soon and how far ahead, the most a day, the price, where it is, what is booked (courts, rooms, with their fields and pictures), the places at once, hours of its own, what is asked, and its colour.

## Keeping what they write

Both editors hand you the whole object at each change. Keep it as JSON, and read it back through the engine, which keeps only what makes sense: hours a clock may show, a time zone the system knows, minutes and days within reason, a picture that is one.

```ts
import { readEventType, readSchedule } from '@reboschedule/core';

const schedule = readSchedule(await request.json());
const type = readEventType(row.json);
```

## BookingList

```tsx
<BookingList bookings={bookings} types={types} timeZone={schedule.timeZone} locale="en" />
```
