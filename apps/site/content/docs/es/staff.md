# Personas con su propio horario

Una barbería con tres barberos que no vienen los mismos días; un consultorio con dos doctoras; un taller con mecánicos de mañana y de tarde. Cada persona es un recurso con sus `hours`, y cada servicio un tipo que comparte esos recursos.

<demo name="barber" />

## Cada uno su horario {#own-hours}

```ts
const semana = (h, dias) => Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, dias.includes(d) ? h : []]));

const barberos = [
  { id: 'tono', name: 'Toño', image: '/tono.jpg', values: {}, price: null, hours: semana([{ from: '10:00', to: '19:00' }], [2, 3, 4, 5, 6]) },
  { id: 'memo', name: 'Memo', image: '/memo.jpg', values: {}, price: null, hours: semana([{ from: '09:00', to: '14:00' }], [1, 2, 3, 4, 5]) },
  { id: 'pau', name: 'Pau', image: '/pau.jpg', values: {}, price: null, hours: semana([{ from: '13:00', to: '20:00' }], [0, 3, 4, 5, 6]) },
];
```

Un recurso con `hours` solo se ofrece en ellas; uno sin `hours` usa las del tipo. Los horarios libres de un día son la unión de todos, y cada uno dice en `resources` quién está libre.

## Servicios que comparten personas {#shared}

```ts
const corte = { ...tipo, id: 'cut', duration: 30, price: { amount: 250, currency: 'MXN', per: 'booking' }, resources: barberos };
const barba = { ...tipo, id: 'beard', duration: 20, price: { amount: 150, currency: 'MXN', per: 'booking' }, resources: barberos };
```

Para que un corte con Toño lo ocupe también para una barba, pasa como ocupado lo de cualquier tipo que tome el mismo recurso:

```ts
const ocupado = busyOfBookings(reservas.filter((b) => barberos.some((r) => r.id === b.resource)));
slotsOf(barba, horario, { busy: ocupado });
```

## Elegir o el primero libre {#choose-or-any}

Con `useBooking`, `setResource('memo')` pide solo los horarios de Memo; `setResource('')` los de cualquiera, y la reserva se queda con el primero libre a esa hora. `works(type, schedule, 'memo', day, desde, hasta)` dice si alguien trabaja en un tramo: `BookingDay` lo usa para rayar las horas en que no está.
