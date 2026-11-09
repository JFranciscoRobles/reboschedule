# Headless: tu propia interfaz

Los componentes están hechos sobre tres hooks, y los hooks tienen todo: los horarios libres, lo elegido, la reserva y sus problemas; el mes, sus turnos y huecos; el día, sus columnas y bloques. Dibuja tu propia interfaz sobre ellos, y reserva, mueve y cuenta exactamente como los componentes.

<demo name="headless" />

## useBooking {#usebooking}

Todo lo que es el widget, sin cómo se ve. Pide las rutas del servidor como el widget.

```tsx
import { useBooking } from '@reboschedule/react';

function Horarios() {
  const b = useBooking({ endpoint: '/s/cancha' });
  if (b.status !== 'ready') return <p>…</p>;
  return (
    <>
      {b.times.map((slot) => (
        <button key={slot.start} onClick={() => b.choose(slot)}>
          {new Date(slot.start).toLocaleTimeString('es', { timeZone: b.timeZone, timeStyle: 'short' })}
        </button>
      ))}
      {b.slot && <button onClick={() => b.book({ name: 'Ana', email: 'ana@example.com' })}>Reservar</button>}
    </>
  );
}
```

| Campo | Qué es |
| --- | --- |
| `status` | `'loading'`, `'failed'` o `'ready'`. |
| `type` · `organizer` | El tipo (sin dónde es) y de quién es. |
| `timeZone` · `setTimeZone` · `ownerTimeZone` | La zona horaria de quien reserva, y la de quien atiende. |
| `lengths` · `length` · `setLength` | Las duraciones a elegir, la más corta primero, y la elegida. |
| `resource` · `setResource` | El recurso elegido, `''` para cualquiera libre; sus horarios se piden solos, con su precio. |
| `days` | Los horarios libres, por los días de quien reserva: un `Map` de día a horarios. |
| `month` · `weeks` · `setMonth` · `moveMonth` | El mes a la vista, sus semanas (lunes primero), y moverlo. |
| `day` · `setDay` | El día elegido, mientras tenga horarios; si no, el primero del mes que tenga. |
| `times` · `parts` · `dayPrice` | Los horarios de ese día, los mismos por mañana, tarde y noche, y el precio cuando todos cuestan igual. |
| `slot` · `choose` | El horario elegido; `choose(null)` para volver a elegir. |
| `book(visitor)` | Manda la reserva: la reserva hecha, o `null` y `problems`. Un horario tomado hace un momento vuelve a pedir los horarios. |
| `sending` · `problems` | Mientras se manda; lo que el servidor dijo que estaba mal, cada uno con su `code` y su `message`. |
| `booked` · `again` | La reserva hecha, y reservar otra. |
| `reload` | Vuelve a pedir los horarios. |
| `held` · `check` · `release` | Apartada mientras se paga (`pay`, `until`); preguntar a su dirección si ya se pagó; soltarla. Ver [Cobrar](/docs/payments/#hooks). |
| `coupons` · `coupon` · `setCoupon` · `applied` · `discountFor` | Si el servidor acepta códigos; el código escrito; el descuento, si aplica a este tipo; cuánto quita en un horario. Ver [Códigos de descuento](/docs/coupons/#hooks). |
| `waitlist` · `full` · `wait` · `waiting` | Si el servidor lleva lista de espera; los horarios llenos; anotarse en uno. Ver [Lista de espera](/docs/waitlist/). |

Otros tres hooks: `useStay` para estancias ([Rentas por noche](/docs/stays/#headless)), `useManage` para una reserva desde su dirección ([Cambios y reembolsos](/docs/policies/#hooks)), y `useWeek`, la semana como la dibuja `BookingWeek` ([Componentes](/docs/components/#bookingweek)).

## useMonth {#usemonth}

El mes de quien atiende, ya calculado.

```tsx
import { useMonth } from '@reboschedule/react';

const m = useMonth({ bookings: reservas, types: tipos, schedule: horario, type: 'shift', slots: huecos });
m.weeks.flat().map((dia) => dia && dia.turns.map((turno) => `${turno.n}: ${turno.who.map((b) => b.name)} · ${turno.free} libres`));
```

| Campo | Qué es |
| --- | --- |
| `month` · `setMonth` · `moveMonth` · `today` | El mes a la vista, moverlo, y hoy. |
| `kind` · `inTurns` | El tipo a la vista, y si sus inicios son turnos propios. |
| `weeks` | Cada día: `day`, `today`, `past`, sus `bookings`, sus `turns` (`n`, `start`, `end`, `who`, `free`, `gap`) y sus `gaps`. |
| `ahead` · `firstGap` | Cuántos quedan libres por delante, y el día del primero. |

## useDay {#useday}

Un día, sus columnas y filas, y cada reserva donde va.

```tsx
import { useDay } from '@reboschedule/react';

const d = useDay({ bookings: reservas, types: tipos, schedule: horario, type: 'court', slots: huecos, day: '2026-11-03' });
```

| Campo | Qué es |
| --- | --- |
| `day` · `setDay` · `moveDay` · `today` | El día a la vista, y moverlo. |
| `columns` | Cada recurso (`id`, `name`, `image`), o cada lugar de un turno (`place`), o quien atiende solo. |
| `rows` | Una fila por paso, de la apertura al cierre: su `minute`, su instante `at`, y por cada columna los `gaps` que se pueden apartar ahí. |
| `blocks` | Cada reserva: su `column`, su primera `row`, y cuántas filas abarca (`span`). |
| `step` · `closed` · `free` · `now` | Los minutos de una fila, un día sin horario, sus huecos, y dónde está ahora, en filas. |

## Lo que sigue siendo tuyo {#what-stays-yours}

Los hooks guardan estado y piden las rutas; no dibujan ni guardan nada. Las palabras son tuyas (o `WORDS`), el aspecto es tuyo, y dónde viven las reservas lo decide tu servidor.
