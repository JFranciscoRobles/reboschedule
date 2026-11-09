# Mes, día y panel

Quien atiende tiene tres componentes: `BookingCalendar`, el mes, con quién tiene cada turno y los huecos libres; `BookingDay`, un día con una columna por cancha, sala o lugar; y `BookingPanel`, para apartar un hueco para alguien, cambiar quién tiene una reserva, moverla o eliminarla.

<demo name="shifts" />

## BookingCalendar {#bookingcalendar}

El mes. Con un tipo de turnos que no se enciman (las guardias de una oficina), cada día muestra sus turnos, `Turno 1` y `Turno 2`, con el nombre de quien tiene cada uno. Cualquier otro tipo, o todos, muestra en cada día sus reservas, la hora y el nombre.

```tsx
<BookingCalendar
  bookings={reservas}
  types={tipos}
  schedule={horario}
  type="shift"
  slots={huecos}            // los horarios libres, como los da /slots: los huecos, a la vista
  onPick={(slot) => apartar(slot)}
  onSelect={(reserva) => abrir(reserva)}
  onDay={(dia) => verDia(dia)}
  locale="es"
/>
```

Con `slots`, cada lugar libre de un turno aparece como `+ Libre`, y arriba del mes cuántos huecos quedan libres por delante, con un botón que lleva al siguiente.

## BookingDay {#bookingday}

Un día, una columna por cancha o sala (o por lugar de un turno), las horas de lado, cada reserva un bloque del largo que dura, y cada hueco un `+` que aparta justo esa cancha a esa hora. Una línea roja marca la hora actual, hoy.

```tsx
<BookingDay bookings={reservas} types={tipos} schedule={horario} type="court" day={dia} onDay={setDia} slots={huecos} onPick={apartar} onSelect={abrir} />
```

## BookingPanel {#bookingpanel}

El panel de al lado. Sin reserva, aparta un hueco para alguien; con una, cambia quién la tiene, la mueve (el siguiente hueco que se elija en el calendario es a donde va) o la elimina, una vez que se confirma. Lo que se le pide al servidor es cosa de tu aplicación: el panel te avisa, y muestra lo que salió mal.

```tsx
<BookingPanel
  type={tipo}
  booking={reserva}
  timeZone={horario.timeZone}
  moving={moviendo}
  onMove={setMoviendo}
  onSave={async (datos) => (await api.cambiar(reserva.id, datos)).problems}
  onDelete={() => api.cancelar(reserva.id)}
  onClose={cerrar}
/>
```

## Mover una reserva {#moving-a-booking}

Mover son dos pasos: el panel avisa que se está moviendo (`onMove(true)`), le pasas `moving` al calendario para que sus huecos se vean como a donde puede ir, y el hueco elegido llega a `onPick`. En tu servidor, `moveBooking` revisa ese horario contra los horarios libres sin contar la reserva misma:

```ts
import { moveBooking, slotsOf } from '@reboschedule/core';

const libres = slotsOf(tipo, horario, { busy: ocupadoSin(reserva.id), length });
const movida = moveBooking(reserva, inicio, tipo, libres); // null si no está libre
```

## Tu propio calendario {#your-own-calendar}

`BookingCalendar` y `BookingDay` están hechos sobre `useMonth` y `useDay`: los turnos, quién tiene cada uno, los huecos, las columnas y los bloques, ya calculados. Ve [Headless: tu propia interfaz](/docs/headless/#usemonth).
