# Courts, rooms and shifts

A kind can be booked in three ways. The owner's own time: one at a time, as an agent's calls and visits. Things alike, each booked on its own: courts, rooms, desks (`resources`). And places at once: the people of a turn or a class (`capacity`).

<demo name="rooms" />

## Resources

```ts
const court: EventType = {
  ...type,
  fields: [
    { id: 'surface', label: 'Surface', kind: 'text', unit: '' },
    { id: 'covered', label: 'Covered', kind: 'yes-no', unit: '' },
  ],
  resources: [
    { id: 'court-1', name: 'Court 1', image: courtPicture(), values: { surface: 'Glass' }, price: null },
    { id: 'court-4', name: 'Court 4', image: courtPicture({ covered: true }), values: { surface: 'Glass', covered: true }, price: 450 },
  ],
};
```

A time is free while one of them has a place. Each time free says which have (`slot.resources`) and how many places are left of all of them (`slot.free`). Whoever books chooses one, or any free; the booking keeps which (`booking.resource`).

## Fields and pictures

`fields` are what every resource of a kind says of itself: a line, a number with its unit, or a yes or no. The widget shows them on each card: a yes is the field's name (`Covered`), a no is nothing, a number goes with its unit (`10 people`). Each resource may have a picture: an address, or an image as data. `courtPicture()` and `roomPicture(people)` draw one to start from.

## Places at once

`capacity` is how many may book the same time of each resource: two guards to a shift, twenty people to a class. A kind with turns that do not overlap (`increment` as long as `duration`) is shown by the calendar as its turns, with who has each.

<demo name="shifts" />

## What is busy, and of which

Each `Busy` your calendar gives may say which resource it takes. One that says none takes all of them: the owner is away. Bookings of a kind with resources or places say theirs:

```ts
busy: () => bookings.map((b) => ({ start: b.start, end: b.end, resource: b.resource })),
```
