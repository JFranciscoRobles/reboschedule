# A complete interface

The demo below books a court with nothing of ReboSchedule's look: the courts as a row of pictures, the next days as tabs, the times as a strip with their price, and who books in one line. It is `useBooking` and Tailwind, and books against the same routes as the widget.

<demo name="headless" />

## The code

```tsx
'use client';
import { formatMoney } from '@reboschedule/core';
import { useBooking } from '@reboschedule/react';
import { useState } from 'react';

export function Courts() {
  const b = useBooking({ endpoint: '/s/court' });
  const [who, setWho] = useState({ name: '', email: '', phone: '' });
  const clock = (iso: string) => new Date(iso).toLocaleTimeString('en', { timeZone: b.timeZone, timeStyle: 'short' });

  if (b.status !== 'ready' || !b.type) return null;
  if (b.booked) return <p>✓ Booked. <button onClick={b.again}>Book another</button></p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {[null, ...b.type.resources].map((r) => (
          <button key={r?.id ?? 'any'} onClick={() => b.setResource(r?.id ?? '')}>
            {r ? <img src={r.image} alt="" /> : '✱'} {r?.name ?? 'Any'}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {b.lengths.map((n) => <button key={n} onClick={() => b.setLength(n)}>{n / 60} h</button>)}
        {[...b.days.keys()].slice(0, 6).map((d) => <button key={d} onClick={() => b.setDay(d)}>{d}</button>)}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {b.times.map((s) => (
          <button key={s.start} onClick={() => b.choose(s)}>
            {clock(s.start)} {s.price && formatMoney(s.price, 'en')}
          </button>
        ))}
      </div>
      {b.slot && (
        <form onSubmit={(e) => { e.preventDefault(); b.book({ name: who.name, email: who.email, answers: { phone: who.phone } }); }}>
          <input required placeholder="Name" value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} />
          <input required type="email" placeholder="Email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} />
          <input required placeholder="Phone" value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} />
          <button disabled={b.sending}>Book {b.slot.price && formatMoney(b.slot.price, 'en')}</button>
          {b.problems.map((p) => <p key={p.code}>{p.message}</p>)}
        </form>
      )}
    </div>
  );
}
```

## What it shows

- **The resource first.** `setResource` asks the server for that court's times only, each priced as it.
- **The day.** `days` has only days with times; `day` is the one chosen, or the first.
- **The price at each time.** The server put it there, by your [rules](/docs/prices/), if you gave some.
- **A time taken a moment ago.** `book` answers `null`, `problems` says `taken`, and the times are asked for again.
