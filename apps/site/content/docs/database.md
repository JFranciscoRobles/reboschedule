# Your database

ReboSchedule keeps nothing: the kinds, the hours and the bookings are your database's. This page is what it needs of it, in any database; the examples are SQL.

## What to keep

```sql
create table booking_types (
  id text primary key,
  slug text unique not null,
  data jsonb not null           -- the EventType, as the editor wrote it
);

create table bookings (
  id text primary key,
  type text not null references booking_types(id),
  resource text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  name text not null,
  email text not null,
  data jsonb not null,          -- the Booking whole: answers, price, time zone
  status text not null default 'confirmed'
);

create index bookings_when on bookings (type, starts_at);
```

Read the kinds back through `readEventType`, and the hours through `readSchedule`: they keep only what makes sense, whatever an old row has.

## What is busy

`busy(from, to)` is a query of the bookings that touch those instants:

```ts
busy: (from, to) =>
  sql`select starts_at as start, ends_at as end, resource from bookings
      where type = ${type.id} and status = 'confirmed' and starts_at < ${to} and ends_at > ${from}`,
```

For the owner's own time (an agent's calls and visits), take the bookings of all their kinds, without `resource`: they take all of their time.

## Two at the same second

The server checks each booking against the times free as they are when it comes. Two requests for the last place, at the very same moment, may both pass that check before either is kept. Let the database say no to the second:

```sql
-- One booking for each resource at each start: courts, rooms.
create unique index one_at_a_time on bookings (type, resource, starts_at) where status = 'confirmed';
```

That index covers one booking per start, not one that overlaps another at a different start. For that, give the server `keep`: it keeps what is booked (or held) at once with checking it is still free, and a `false` is answered as `taken` (`409`), so whoever books chooses again.

`claimsOf(booking, type, timeZone)` gives the keys a booking claims: each seat (or the resource, or the owner's own time) every five minutes, or each night of a stay. With a unique index on them, two bookings that would overlap share a key, and the database refuses the second itself:

```sql
create table booking_claims (key text primary key, booking text not null references bookings(id));
```

```ts
createBookingHandler({
  keep: async (bookings, { calendar }) => {
    try {
      await db.transaction(async (tx) => {
        for (const b of bookings) {
          await tx.bookings.upsert(b);
          await tx.claims.insertMany(claimsOf(b, calendar.type, calendar.schedule.timeZone)!.map((key) => ({ key, booking: b.id })));
        }
      });
      return true;
    } catch (e) {
      if (isUniqueViolation(e)) return false; // someone took it a moment ago
      throw e;
    }
  },
});
```

When a booking is cancelled (or a hold runs out), delete its claims. For places at once (a zone of 120, a shift of two), `claimsOf` gives `null`: lock the time in a transaction (`select … for update`, an advisory lock) and call `check()`, which asks the times again as they are kept now:

```ts
keep: (bookings, { check }) => db.withLock(`${bookings[0].type}:${bookings[0].start}`, async (tx) => (await check()) && (await tx.bookings.upsertMany(bookings), true)),
```

## Cancelled, not deleted

A booking cancelled keeps its row with `status = 'cancelled'`: its place is free again, and what was booked is still known.
