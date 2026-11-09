# Roles de guardias

Un rol son los turnos de un mes asignados a los miembros de cada grupo, como una oficina asigna sus guardias: cada división (residencial, comercial) con su grupo de asesores, cada día un turno de 10 a 2 y uno de 2 a 7, una persona en cada uno. Quien coordina asigna el mes automáticamente o a mano; los asesores ven sus guardias, dicen qué días no pueden, y se piden cambios entre ellos.

<demo name="shifts" />

## El tipo {#the-kind}

Las divisiones son los recursos del tipo, y cada tramo de su horario un turno completo (`whole: true`), dure lo que dure:

```ts
const guardia: EventType = {
  ...tipo,
  whole: true,
  capacity: 1,
  hours: { 0: turnos, 1: turnos, 2: turnos, 3: turnos, 4: turnos, 5: turnos, 6: turnos },
  resources: [
    { id: 'res', name: 'Residencial', image: '', values: {}, price: null },
    { id: 'com', name: 'Comercial', image: '', values: {}, price: null },
  ],
};
const turnos = [{ from: '10:00', to: '14:00' }, { from: '14:00', to: '19:00' }];
```

## Los miembros {#the-members}

```ts
const miembros: Member[] = [
  { id: 'ana', name: 'Ana López', email: 'ana@example.com', group: 'res' },
  { id: 'diego', name: 'Diego Soto', email: 'diego@example.com', group: 'com' },
  // …
];
```

## Automático {#given-automatically}

```ts
import { assignRoster } from '@reboschedule/core';

const { bookings, unfilled } = assignRoster({
  type: guardia,
  schedule: horario,
  month: '2026-11',
  members: miembros,
  unavailable: { carla: ['2026-11-03', '2026-11-04'] },
  bookings: asignadas,   // las de antes: se conservan, y se cuentan
  from: hoy,             // lo pasado, como estaba
});
```

Cada turno de cada división va a alguien de su grupo: primero quien tiene menos turnos, nadie en un día que dijo que no puede, nadie dos veces el mismo día mientras otro pueda. `unfilled` dice los turnos que nadie pudo cubrir. Cada reserva lleva su `member`.

## A mano {#by-hand}

`turnsOf(type, schedule, month)` da cada turno del mes, de cada grupo: una tabla para asignar cada uno a mano. `turnBooking(turn, member, type, schedule)` hace la reserva de uno.

## Cambios entre miembros {#changes-between-members}

Un miembro le pide a otro un cambio: su turno por uno del otro, o que le cubra el suyo.

```ts
import { coverBooking, swapBookings, swapProblems } from '@reboschedule/core';

swapProblems(mio, suyo, yo, otro, noPueden, zonaHoraria); // [] | ['other-group' | 'unavailable' | 'same-member']
const [a, b] = swapBookings(mio, suyo);                   // los miembros intercambiados, cada una una versión nueva
const cubierta = coverBooking(mio, otro);                 // asignada al otro
```

Cuando se acepta, a cada uno se le avisa: el turno que ahora tiene (`booked`) y el que ya no (`cancelled`), cada uno con su invitación. Guardar las solicitudes, y quién puede responderlas, es cosa de tu aplicación.
