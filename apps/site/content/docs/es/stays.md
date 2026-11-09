# Rentas por noche o por día

Una cabaña se renta por noches: se llega en la tarde de un día y se va a mediodía de otro. Un equipo (un kayak, una cámara) se renta por días completos. En los dos casos quien reserva elige el primer y el último día en un mes, y el tipo revisa cada noche (o cada día) de cada recurso.

<demo name="cabins" />

## El tipo {#the-kind}

Un tipo con `stay` reserva estancias en vez de horarios:

```ts
const cabana: EventType = {
  ...tipo,
  horizon: 120,
  stay: { unit: 'night', min: 2, max: 7, checkIn: '15:00', checkOut: '12:00' },
  price: { amount: 1800, currency: 'MXN', per: 'night' },
  resources: [
    { id: 'pino', name: 'Pino', image: '/pino.jpg', values: { people: 2 }, price: 1800 },
    { id: 'roble', name: 'Roble', image: '/roble.jpg', values: { people: 4 }, price: 2400 },
  ],
};
```

| Campo | Qué dice |
| --- | --- |
| `unit` | `'night'`: se llega un día y se va otro. `'day'`: días completos, el primero y el último incluidos. |
| `min`, `max` | Cuántas noches (o días) como mínimo y como máximo. |
| `checkIn`, `checkOut` | La hora de entrada del primer día y la de salida del último. |

El precio `per: 'night'` (o `'day'`) se multiplica por las noches, al precio de cada recurso.

## Las noches libres {#free-nights}

```ts
import { nightsOf, stayResource, makeStay, stayProblems, busyOfBookings } from '@reboschedule/core';

const noches = nightsOf(cabana, horario, { busy: busyOfBookings(reservas) });
// [{ day: '2026-11-07', resources: ['pino', 'roble'] }, …]

stayResource(cabana, noches, '2026-11-07', '2026-11-11');        // la primera cabaña con las 4 noches
stayResource(cabana, noches, '2026-11-07', '2026-11-11', 'roble'); // 'roble', o null si le falta una
```

Una noche de una estancia termina al mediodía siguiente y la siguiente estancia entra a las 3: el mismo día puede ser de salida de una y de llegada de otra.

## En el servidor {#on-the-server}

`createBookingHandler` responde `GET /:slug/stays` con las noches libres, y `POST /:slug/book` con `arrive` y `leave` en vez de `start`:

```json
{ "arrive": "2026-11-07", "leave": "2026-11-11", "resource": "roble", "name": "Lucía", "email": "lucia@example.com" }
```

El servidor revisa otra vez cada noche (`stayProblems`), cotiza, y guarda una sola reserva del primer día a la salida.

## Headless {#headless}

```tsx
import { useStay } from '@reboschedule/react';

const s = useStay({ endpoint: '/api/booking/cabana' });
// s.weeks, s.nights, s.pick(day), s.arrive, s.leave, s.units, s.fits, s.price, s.book(visitante)
```

`pick` toma el primer clic como la llegada y el segundo como la salida; un tercero empieza otra vez. `fits` dice qué cabaña tiene todas las noches, o `null`.
