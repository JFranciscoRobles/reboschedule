# Tipos de reserva

Un tipo de reserva (`EventType`) es lo que alguien puede reservar, y sus reglas: cuánto dura, cada cuántos minutos puede empezar, el tiempo libre alrededor, con cuánta anticipación y hasta cuándo, cuántas al día, dónde, y qué se pregunta.

## Cuánto dura {#how-long}

| Campo | Qué es |
| --- | --- |
| `duration` | Minutos; la duración elegida de inicio cuando hay varias. |
| `lengths` | Otras duraciones que quien reserva puede elegir: una cancha por 60, 90 o 120. |
| `increment` | Cada cuántos minutos puede empezar; su duración si no se dice. |
| `before`, `after` | Minutos libres alrededor de cada reserva: el camino, las notas después. |

## Cuándo {#when}

| Campo | Qué es |
| --- | --- |
| `notice` | Con cuánta anticipación se puede reservar, en minutos desde ahora. |
| `horizon` | Hasta cuándo, en días. |
| `perDay` | Cuántas al día como máximo; `null`, las que quepan. |
| `hours` | Horario propio, en lugar del de quien atiende; `null`, el de quien atiende. |

## Dónde {#where}

`place` es dónde es: `in-person` (una dirección), `phone`, `video` (la liga de la llamada) o `custom` (palabras). La dirección y la liga se le dicen solo a quien reservó: los horarios libres, que cualquiera puede pedir, llevan el tipo sin ellas.

## Qué se pregunta {#what-is-asked}

Además del nombre y el correo, cada tipo pregunta lo que necesita: `questions`, cada una una línea, un párrafo o un teléfono, obligatoria o no. Las respuestas llegan con la reserva, por el id de cada pregunta.

## Lo demás {#more}

| Campo | Qué es | Ver |
| --- | --- | --- |
| `resources`, `fields`, `capacity`, `whole` | Lo que se reserva (canchas, salas), sus campos, lugares a la vez, turnos completos. | [Canchas, salas y guardias](/docs/resources/) |
| `price` | Por hora, por reserva, por lugar, por noche. | [Precios](/docs/prices/) |
| `series` | Cuántas veces cada semana. | [Cada semana](/docs/repeat/) |
| `stay` | Por noches o días. | [Rentas por noche](/docs/stays/) |
| `seating` | La sala de un cine: filas, bloques, filas preferentes. | [Boletos](/docs/tickets/#seating) |
| `deposit`, `refunds`, `reschedule` | El anticipo, lo que se devuelve según cuánto falte, hasta cuándo se puede cambiar. | [Cambios y reembolsos](/docs/policies/) |

## Los horarios libres {#the-times-free}

`slotsOf(type, schedule, options)` da los horarios libres de un tipo, los más próximos primero: el horario de cada día cortado en inicios cada `increment`, cada uno lo bastante largo, con la anticipación debida y no demasiado lejos, ninguno que toque lo ocupado con su tiempo libre alrededor, y no más al día de los que puede tener.

```ts
const libres = slotsOf(tipo, horario, {
  busy,           // lo ocupado: reservas, el calendario de quien atiende
  length: 90,     // de las duraciones que tiene el tipo
  from: '2026-11-03',
  to: '2026-11-09',
});
```
