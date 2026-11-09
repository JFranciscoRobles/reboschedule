# Canchas, salas y guardias

Un tipo se puede reservar de tres maneras. El tiempo propio de quien atiende: una a la vez, como las llamadas y visitas de un asesor. Cosas iguales, cada una por separado: canchas, salas, escritorios (`resources`). Y lugares a la vez: las personas de un turno o de una clase (`capacity`).

<demo name="rooms" />

## Recursos {#resources}

```ts
const cancha: EventType = {
  ...tipo,
  fields: [
    { id: 'surface', label: 'Superficie', kind: 'text', unit: '' },
    { id: 'covered', label: 'Techada', kind: 'yes-no', unit: '' },
  ],
  resources: [
    { id: 'court-1', name: 'Cancha 1', image: courtPicture(), values: { surface: 'Cristal' }, price: null },
    { id: 'court-4', name: 'Cancha 4', image: courtPicture({ covered: true }), values: { surface: 'Cristal', covered: true }, price: 450 },
  ],
};
```

Un horario está libre mientras alguno de ellos tenga lugar. Cada horario libre dice cuáles tienen (`slot.resources`) y cuántos lugares quedan entre todos (`slot.free`). Quien reserva elige uno, o cualquiera libre; la reserva guarda cuál (`booking.resource`).

## Campos e imágenes {#fields-and-pictures}

`fields` son lo que cada recurso de un tipo dice de sí mismo: una línea, un número con su unidad, o un sí o no. El widget los muestra en cada tarjeta: un sí es el nombre del campo (`Techada`), un no no se muestra, un número va con su unidad (`10 personas`). Cada recurso puede tener una imagen: una dirección, o una imagen como datos. `courtPicture()` y `roomPicture(personas)` dibujan una para empezar.

## Lugares a la vez {#places-at-once}

`capacity` es cuántos pueden reservar el mismo horario de cada recurso: dos asesores por guardia, veinte personas por clase. Un tipo con turnos que no se enciman (`increment` igual de largo que `duration`) se muestra en el calendario como sus turnos, con quién tiene cada uno.

<demo name="shifts" />

## Qué está ocupado, y de cuál {#what-is-busy-and-of-which}

Cada `Busy` que da tu calendario puede decir qué recurso ocupa. Uno que no dice ninguno los ocupa todos: quien atiende no está. Las reservas de un tipo con recursos o lugares dicen el suyo:

```ts
busy: () => reservas.map((b) => ({ start: b.start, end: b.end, resource: b.resource })),
```
