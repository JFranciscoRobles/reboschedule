# Cómo funciona

Tres capas, cada una sobre la de abajo: el motor calcula, el servidor revisa y responde, los componentes y hooks dibujan y piden.

## El motor {#the-engine}

`@reboschedule/core` son funciones de datos simples, sin más que `Intl`. A partir del horario de quien atiende, un tipo y lo ocupado, `slotsOf` calcula los horarios libres:

1. **Los días.** De hoy (o `from`) al horizonte (o `to`), como los dice el reloj de quien atiende.
2. **El horario de cada uno.** El de su fecha si tiene, si no el de su día de la semana, en el horario propio del tipo si lo tiene.
3. **Los inicios.** Cada tramo cortado cada `increment` minutos, cada uno del largo pedido. Un minuto que no existe esa noche (cuando se adelanta la hora) se salta.
4. **Con anticipación, y no muy lejos.** Ninguno antes de `notice`, ninguno después de `horizon`.
5. **Lo ocupado.** Ninguno que toque algo ocupado, con `before` y `after` libres alrededor. Algo ocupado sin recurso los ocupa todos; uno de un recurso ocupa un lugar de él.
6. **El máximo al día.** Un día con `perDay` reservas no da más.

Cada horario libre dice cuántos lugares quedan (`free`) y de qué recursos (`resources`).

## El servidor {#the-server}

`createBookingHandler` responde `/slots` con esos horarios, con precio, y el tipo sin dónde es. En `/book` lee la solicitud, vuelve a calcular los horarios libres como están en ese segundo, y revisa la solicitud contra ellos; solo entonces hace la reserva, la cotiza y le avisa a tu aplicación. La dirección de cada reserva es su id firmado con tu secreto: sin cuenta, y sin que el servidor guarde nada.

## Los componentes y hooks {#the-components-and-hooks}

`useBooking` guarda lo que elige quien reserva y pide las rutas; `useMonth` y `useDay` calculan lo que ve quien atiende. Los componentes los dibujan. Nada en ellos decide si un horario está libre: lo decide el servidor.

## Zonas horarias {#time-zones}

Cada instante es ISO en UTC; cada día y hora se dice en una zona horaria. El horario de quien atiende está en la suya; los horarios libres se acomodan en los días de quien reserva, en la suya; el calendario de quien atiende, en la de quien atiende.
