# Without React

The engine has no DOM and no React: in a page of plain JavaScript, a Vue or Svelte app, a worker or a script, it works out the times free, and the server's routes answer any fetch.

## The routes, from any page

```js
const answer = await fetch('/s/court/slots?length=90&resource=court-4');
const { type, timeZone, slots } = await answer.json();
// slots: [{ start, end, free, resources, price }, …]

const booked = await fetch('/s/court/book', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    start: slots[0].start,
    length: 90,
    resource: 'court-4',
    name: 'Ana López',
    email: 'ana@example.com',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    answers: { phone: '664 123 4567' },
  }),
});
// 201 { booking, type, manage, ics, google } · 409 taken · 422 what it lacks
```

## The engine, in the browser

```ts
import { formatMoney, monthOf, slotsByDay } from '@reboschedule/core';

const days = slotsByDay(slots, 'Europe/Madrid'); // Map of day → slots, as Madrid's days go
const weeks = monthOf('2026-11');                // the grid of a month, Monday first
formatMoney(slots[0].price, 'en');               // '$675 MXN'
```

## The engine, with no server at all

A page that knows its hours and what is taken works out the times free itself, as the demos of this site do:

```ts
import { sampleEventTypes, sampleSchedule, slotsOf } from '@reboschedule/core';

const [call] = sampleEventTypes('en');
const free = slotsOf(call, sampleSchedule('America/Tijuana'), { busy: [] });
```

The booking itself is best checked on a server: two pages working out the same time free would both book it.
