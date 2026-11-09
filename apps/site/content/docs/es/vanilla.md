# Sin React

El motor no usa el DOM ni React: en una página de JavaScript simple, una aplicación de Vue o de Svelte, un worker o un script, calcula los horarios libres, y las rutas del servidor responden a cualquier fetch.

## Las rutas, desde cualquier página {#the-routes-from-any-page}

```js
const respuesta = await fetch('/s/cancha/slots?length=90&resource=court-4');
const { type, timeZone, slots } = await respuesta.json();
// slots: [{ start, end, free, resources, price }, …]

const reservada = await fetch('/s/cancha/book', {
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
// 201 { booking, type, manage, ics, google } · 409 tomado · 422 lo que falte
```

## El motor, en el navegador {#the-engine-in-the-browser}

```ts
import { formatMoney, monthOf, slotsByDay } from '@reboschedule/core';

const dias = slotsByDay(slots, 'Europe/Madrid'); // Map de día → horarios, como van los días de Madrid
const semanas = monthOf('2026-11');              // la cuadrícula de un mes, lunes primero
formatMoney(slots[0].price, 'es');               // '$675 MXN'
```

## El motor, sin ningún servidor {#the-engine-with-no-server-at-all}

Una página que conoce su horario y lo ocupado calcula sola los horarios libres, como los demos de este sitio:

```ts
import { sampleEventTypes, sampleSchedule, slotsOf } from '@reboschedule/core';

const [llamada] = sampleEventTypes('es');
const libres = slotsOf(llamada, sampleSchedule('America/Tijuana'), { busy: [] });
```

La reserva misma conviene revisarla en un servidor: dos páginas que calculan el mismo horario libre lo reservarían las dos.
