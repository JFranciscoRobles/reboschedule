# Una interfaz completa

El demo de abajo reserva una cancha sin nada del aspecto de ReboSchedule: las canchas como una fila de imágenes, los próximos días como pestañas, los horarios como una tira con su precio, y quien reserva en una línea. Es `useBooking` y Tailwind, y reserva contra las mismas rutas que el widget.

<demo name="headless" />

## El código {#the-code}

```tsx
'use client';
import { formatMoney } from '@reboschedule/core';
import { useBooking } from '@reboschedule/react';
import { useState } from 'react';

export function Canchas() {
  const b = useBooking({ endpoint: '/s/cancha' });
  const [quien, setQuien] = useState({ name: '', email: '', phone: '' });
  const reloj = (iso: string) => new Date(iso).toLocaleTimeString('es', { timeZone: b.timeZone, timeStyle: 'short' });

  if (b.status !== 'ready' || !b.type) return null;
  if (b.booked) return <p>✓ Reservada. <button onClick={b.again}>Reservar otra</button></p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {[null, ...b.type.resources].map((r) => (
          <button key={r?.id ?? 'any'} onClick={() => b.setResource(r?.id ?? '')}>
            {r ? <img src={r.image} alt="" /> : '✱'} {r?.name ?? 'Cualquiera'}
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
            {reloj(s.start)} {s.price && formatMoney(s.price, 'es')}
          </button>
        ))}
      </div>
      {b.slot && (
        <form onSubmit={(e) => { e.preventDefault(); b.book({ name: quien.name, email: quien.email, answers: { phone: quien.phone } }); }}>
          <input required placeholder="Nombre" value={quien.name} onChange={(e) => setQuien({ ...quien, name: e.target.value })} />
          <input required type="email" placeholder="Correo" value={quien.email} onChange={(e) => setQuien({ ...quien, email: e.target.value })} />
          <input required placeholder="Teléfono" value={quien.phone} onChange={(e) => setQuien({ ...quien, phone: e.target.value })} />
          <button disabled={b.sending}>Reservar {b.slot.price && formatMoney(b.slot.price, 'es')}</button>
          {b.problems.map((p) => <p key={p.code}>{p.message}</p>)}
        </form>
      )}
    </div>
  );
}
```

## Lo que muestra {#what-it-shows}

- **El recurso primero.** `setResource` le pide al servidor solo los horarios de esa cancha, cada uno con su precio.
- **El día.** `days` solo tiene días con horarios; `day` es el elegido, o el primero.
- **El precio en cada horario.** Lo puso el servidor, según tus [reglas](/docs/prices/), si diste alguna.
- **Un horario tomado hace un momento.** `book` responde `null`, `problems` dice `taken`, y los horarios se vuelven a pedir.
