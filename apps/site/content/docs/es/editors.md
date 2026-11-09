# Los editores

`ScheduleEditor` escribe el horario de quien atiende: su zona horaria, los tramos de cada día de la semana, y los días distintos a la semana. `EventTypeEditor` escribe un tipo de reserva, completo. `BookingList` lista lo reservado, las próximas primero.

<demo name="editor" />

## ScheduleEditor {#scheduleeditor}

```tsx
<ScheduleEditor schedule={horario} onChange={setHorario} locale="es" />
```

Cada día se enciende o se apaga, tiene los tramos que necesite, y se puede copiar a todos los días en un clic. Un día distinto a la semana (un festivo, un sábado abierto) tiene su propio horario, o ninguno.

## EventTypeEditor {#eventtypeeditor}

```tsx
<EventTypeEditor type={tipo} onChange={setTipo} locale="es" />
```

Escribe el título y la dirección del tipo, cuánto dura y las otras duraciones a elegir, cada cuántos minutos puede empezar, el tiempo libre antes y después, con cuánta anticipación y hasta cuándo, el máximo al día, el precio, dónde es, qué se reserva (canchas, salas, con sus campos e imágenes), los lugares a la vez, el horario propio, qué se pregunta, y su color.

## Guardar lo que escriben {#keeping-what-they-write}

Los dos editores te entregan el objeto completo en cada cambio. Guárdalo como JSON, y léelo de vuelta con el motor, que solo conserva lo que tiene sentido: horas que un reloj puede marcar, una zona horaria que el sistema conoce, minutos y días dentro de lo razonable, una imagen que lo sea.

```ts
import { readEventType, readSchedule } from '@reboschedule/core';

const horario = readSchedule(await request.json());
const tipo = readEventType(fila.json);
```

## BookingList {#bookinglist}

```tsx
<BookingList bookings={reservas} types={tipos} timeZone={horario.timeZone} locale="es" />
```
