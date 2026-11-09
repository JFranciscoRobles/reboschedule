# Componentes y hooks

Cada componente de `@reboschedule/react`, con cada prop, y los hooks sobre los que están hechos.

## BookingWidget {#bookingwidget}

| Prop | Tipo | Qué es |
| --- | --- | --- |
| `endpoint` | `string` | Dónde están las rutas de un tipo. |
| `locale` | `'en' \| 'es'` | Inglés si no se dice. |
| `timeZone` | `string` | De quien reserva; la de su navegador si no se dice. |
| `onBooked` | `(booked: Booked) => void` | Cada reserva hecha. |
| `fetch` | `typeof fetch` | Un fetch propio. |
| `className` | `string` | En su raíz. |

## BookingCalendar {#bookingcalendar}

| Prop | Tipo | Qué es |
| --- | --- | --- |
| `bookings` · `types` · `schedule` | | Lo reservado, los tipos, el horario de quien atiende. |
| `type` | `string` | El id del tipo a la vista; todos si no se dice. |
| `slots` | `Slot[]` | Los horarios libres de ese tipo: los huecos. |
| `onPick` | `(slot) => void` | Un hueco elegido. |
| `onSelect` | `(booking) => void` | Una reserva a la que se le dio clic. |
| `onDay` | `(day) => void` | El número de un día al que se le dio clic. |
| `selected` · `moving` | `string` · `boolean` | La reserva marcada; si se está moviendo una. |
| `locale` · `now` · `className` | | |

## BookingDay {#bookingday}

Las props de `BookingCalendar`, y `day` (el día a la vista) y `onDay` (se le avisa cuando cambia). Su `onPick` recibe el horario de la columna misma a la que se le dio clic: `resources` es ese.

## BookingWeek {#bookingweek}

La semana, de lunes a domingo: una columna por día, las horas al costado, cada reserva un bloque tan largo como dura (las que se enciman, lado a lado), cada hueco un `+` para darlo. Las mismas props que `BookingDay`; su hook es `useWeek`.

## BookingPanel {#bookingpanel}

| Prop | Tipo | Qué es |
| --- | --- | --- |
| `type` | `EventType` | El tipo. |
| `booking` · `slot` | | Una reserva para cambiar, o un hueco para apartar. |
| `timeZone` | `string` | La de quien atiende. |
| `moving` · `onMove` | | Si se está moviendo, y avisarlo. |
| `onSave` | `(details) => string[] \| undefined` | Lo escrito; los problemas, si hay. |
| `onDelete` · `onClose` | | Eliminada una vez confirmada; cerrado. |
| `onAttend` | | Marcada como llegó o no vino (`null`, sin marca); si se da, los dos botones aparecen desde el día de la reserva. |

## ScheduleEditor y EventTypeEditor {#scheduleeditor-and-eventtypeeditor}

| Prop | Tipo | Qué es |
| --- | --- | --- |
| `schedule` / `type` | | Lo que se escribe. |
| `onChange` | | Todo, en cada cambio. |
| `locale` · `className` | | |

## BookingList {#bookinglist}

`bookings`, `types`, `timeZone`, `locale`, `now`, `className`.

## Hooks {#hooks}

| Hook | Qué da | Ve |
| --- | --- | --- |
| `useBooking(options)` | El estado del widget: horarios, lo elegido, la reserva. | [Headless](/docs/headless/#usebooking) |
| `useMonth(options)` | El mes: sus días, turnos y huecos. | [Headless](/docs/headless/#usemonth) |
| `useDay(options)` | El día: columnas, filas y bloques. | [Headless](/docs/headless/#useday) |
| `useStay(options)` | Una estancia: las noches libres, la llegada y la salida, la cabaña que las tiene, el total. | [Rentas por noche](/docs/stays/#headless) |
| `useWeek(options)` | La semana: sus días, filas y bloques, lado a lado cuando se enciman. | [BookingWeek](#bookingweek) |
| `useManage(options)` | Una reserva desde su dirección: cambiarla, cancelarla, cuánto se devuelve. | [Cambios y reembolsos](/docs/policies/#hooks) |

`valuesOf(type, resource)` dice lo que un recurso dice de sí mismo, en palabras, como lo muestran las tarjetas.
