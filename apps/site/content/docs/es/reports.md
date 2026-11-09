# Reportes

`reportOf` arma, de un día a otro (según el día de cada reserva, en la zona de quien atiende):

- lo que entró cada día y lo que se devolvió;
- cuántas reservas y cuántos lugares;
- qué tan lleno estuvo cada recurso respecto a las horas (o noches) que tuvo abiertas;
- quién llegó y quién no, y la tasa de faltas;
- lo que descontaron los códigos y cuántas veces se usó cada uno;
- lo que falta cobrar allá.

`bookingsCsv` da todas las reservas como CSV, que Excel o Google Sheets abren con acentos y comas bien.

<demo name="cabins" />

```ts
import { bookingsCsv, lastDays, reportOf } from '@reboschedule/core';

const r = reportOf(reservas, tipos, horario, lastDays(30, horario.timeZone));

r.totals;    // { revenue, refunded, bookings, places, cancelled, arrived, noShows, noShowRate, discounts, due }
r.days;      // [{ day, revenue, refunded, bookings, places, cancelled }]
r.resources; // [{ type, resource, name, occupancy (0 a 1), bookings, revenue }]
r.coupons;   // [{ code, uses, amount }]

new Response(bookingsCsv(reservas, tipos, horario), { headers: { 'content-type': 'text/csv; charset=utf-8' } });
```

Lo apartado sin pagar no cuenta. Una reserva cancelada cuenta lo que se cobró menos lo que se devolvió. Dibujarlo es tuyo; la pestaña **Reportes** de cada demo es un ejemplo.
