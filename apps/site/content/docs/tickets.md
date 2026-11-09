# Tickets: seats and zones

A cinema sells each seat of each show; a concert sells so many places of each zone. Both are whole turns (`whole: true`) of a kind with resources: in the cinema each seat is a resource with room for one, at the concert each zone a resource with its `capacity`.

<demo name="tickets" />

## A cinema, seat by seat {#seats}

```ts
import { seatsOf } from '@reboschedule/core';

// 8 rows (A to H), each of 3, 6 and 3 seats with an aisle between blocks; G and H dearer.
const room = { rows: 8, blocks: [3, 6, 3], prices: { G: 160, H: 160 } };
const shows = [{ from: '16:00', to: '18:10' }, { from: '19:00', to: '21:10' }, { from: '21:40', to: '23:50' }];

const movie: EventType = {
  ...kind,
  whole: true,
  capacity: 1,
  hours: { 0: shows, 1: shows, 2: shows, 3: shows, 4: shows, 5: shows, 6: shows },
  price: { amount: 120, currency: 'MXN', per: 'place' },
  seating: room,
  resources: seatsOf(room),
};
```

Each free time brings in `resources` the seats left: a map of the room. Several are booked together with `seats`:

```ts
await b.book(visitor, { seats: ['F5', 'F6', 'F7'] });
```

It is one booking; each seat counts as taken and is charged at its own price.

## A concert, by zones {#zones}

```ts
const jazz: EventType = {
  ...kind,
  whole: true,
  hours: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [{ from: '20:00', to: '23:30' }] },
  price: { amount: 450, currency: 'MXN', per: 'place' },
  resources: [
    { id: 'general', name: 'General', image: '', values: {}, price: null, capacity: 120 },
    { id: 'vip', name: 'VIP', image: '', values: {}, price: 900, capacity: 24 },
  ],
};
```

`setResource('vip')` and `setPlaces(4)` ask only for the dates with 4 places in VIP; the booking carries `places: 4` and is charged for each. If someone bought the last ones a moment before, the server answers `taken`.

## The room, as you lay it out {#seating}

`seating` says how the room is laid out: how many rows (`rows`, 1 to 26, `A` nearest the screen), how many seats each block of a row has from the left (`blocks`, an aisle between each), and which rows cost otherwise (`prices`). `seatsOf(room)` makes a resource of each seat (`A1`, `A2`…), and `readEventType` makes them again from `seating` as it reads the kind, so a kind kept never loses seats.

To draw it, `layoutOf(kind)` gives each row with its blocks:

```tsx
{layoutOf(kind).map(({ row, blocks }) => (
  <div key={row} className="row">
    {blocks.map((block) => (
      <div key={block[0]} className="block">
        {block.map((id) => <Seat key={id} id={id} free={free.has(id)} />)}
      </div>
    ))}
  </div>
))}
```

In the demo, the box office has **Lay out the room**: rows, blocks to each side and premium rows, the room drawn as you write it. It never takes away a seat sold for a show to come.
