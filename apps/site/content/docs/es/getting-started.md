# Primeros pasos

Tres pasos: las rutas de reserva en tu servidor, el widget en una página, y lo que tu aplicación hace con cada reserva. El calendario de quien atiende viene después, en [Mes, día y panel](/docs/calendar/).

## Instalar {#install}

```bash
npm install @reboschedule/core @reboschedule/server @reboschedule/react
```

Los paquetes necesitan Node 22 o más reciente en el servidor y React 19 en el navegador. El motor funciona donde funcione `Intl`.

## Las rutas, en tu servidor {#the-routes-on-your-server}

El servidor es una función de un `Request` a un `Response`. Le dices dónde están tus cosas: un tipo de reserva por su dirección (`load`), una reserva por su id (`find`), y qué hacer con cada reserva hecha (`onBooked`). En Next.js, una ruta responde todo:

```ts
// app/s/[...path]/route.ts
import { createBookingHandler } from '@reboschedule/server';
import { db } from '@/lib/db';

const handle = createBookingHandler({
  secret: process.env.BOOKING_SECRET!, // largo, aleatorio, el mismo en cada proceso
  base: 'https://example.com',
  load: (slug) => db.calendarioDe(slug),
  find: (id) => db.reservaConCalendario(id),
  onBooked: async (reserva, { calendar, manage, ics }) => {
    await db.reservas.insertar(reserva);
    await correo(reserva.email, { manage, ics });
  },
});

export const GET = handle;
export const POST = handle;
```

Un calendario es un tipo de reserva con lo que necesita: el horario de quien atiende, su nombre y correo, y lo que ya está ocupado.

```ts
const calendarioDe = async (slug: string) => {
  const type = await db.tipos.porDireccion(slug);
  if (!type) return null;
  return {
    type,
    schedule: await db.horario(),
    organizer: { name: 'Club Rebo', email: 'club@example.com' },
    busy: (from, to) => db.reservas.entre(type.id, from, to),
  };
};
```

## El widget, en una página {#the-widget-on-a-page}

```tsx
'use client';
import '@reboschedule/react/styles.css';
import { BookingWidget } from '@reboschedule/react';

export default function ReservaCancha() {
  return <BookingWidget endpoint="/s/cancha" locale="es" />;
}
```

Pide a `/s/cancha/slots` los horarios libres, los muestra en la zona horaria de quien reserva, y manda la reserva a `/s/cancha/book`, donde el servidor la revisa otra vez.

<demo name="widget" />

## Tu horario y tus tipos {#your-hours-and-your-kinds}

El motor trae muestras para empezar: `sampleSchedule()` (entre semana y sábado en la mañana) y `sampleEventTypes()` (una llamada, una visita, canchas, salas y guardias). Tu aplicación guarda los suyos como JSON, escritos por los [editores](/docs/editors/) y leídos con `readSchedule` y `readEventType`, que solo conservan lo que tiene sentido.

## Después {#next}

- [El widget de reserva](/docs/widget/): qué muestra, y qué te entrega.
- [Mes, día y panel](/docs/calendar/): el lado de quien atiende.
- [Las rutas](/docs/server/): cada ruta, y cada opción.
