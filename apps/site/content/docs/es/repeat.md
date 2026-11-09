# Cada semana

Una reserva puede ser el mismo día de la semana y a la misma hora, una y otra vez: una clase cada martes, una guardia cada lunes en la mañana. Cada semana se revisa como cualquier reserva; las libres se reservan, compartiendo el id de su serie, y las que no se dicen.

<demo name="classes" />

## Los horarios de una serie {#the-times-of-a-series}

```ts
import { occurrencesOf } from '@reboschedule/core';

occurrencesOf(inicio, 60, { every: 1, count: 8 }, 'America/Tijuana');
// [{ start, end }, …] ocho martes a las 7:00, como lo dice el reloj de quien atiende
```

Un `Repeat` es cada cuántas semanas (`every`), y cuántas veces (`count`) o hasta qué día (`until`). La hora es la del reloj de quien atiende, también la noche que cambia la hora: las 7:00 de marzo siguen siendo las 7:00 después del cambio, no una hora antes.

## Cuáles están libres {#which-are-free}

`planSeries` dice, para cada horario de una serie, si está libre, como lo dice `slotsOf` ese día, y de qué recurso:

```ts
import { planSeries } from '@reboschedule/core';

const plan = planSeries(tipo, horario, { start: inicio, repeat: { every: 1, count: 8 }, busy, resource: 'court-4' });
// [{ start, end, resource: 'court-4' }, { start, end, resource: null }, …] null: no está libre
```

`owner: true` omite la anticipación y el horizonte: quien coordina asigna los turnos de meses por delante.

## Hacerlas {#making-them}

`makeSeries(request, type, plan)` hace las reservas de los horarios libres, todas con el mismo `series`. Una sola no lleva.

## Quien reserva, cada semana {#whoever-books-every-week}

Un tipo deja que quien reserva lo tome cada semana hasta `series` veces (`0`, una a la vez). El widget ofrece entonces *Una vez* o *Cada semana × n*, y el servidor responde con todas y con las que se dejaron fuera:

```ts
// POST /s/clase/book  { …, repeat: { every: 1, count: 8 } }
// 201 { booking, series: [8 reservas], skipped: [] }
```

`onBooked` recibe `done.series`: guárdalas todas.

## Desde el panel {#from-the-panel}

`BookingPanel` ofrece *Cada semana × 4, 8, 12* cuando se le da `onPlan`: muestra cada fecha, libre o no, antes de apartarla. Una reserva de una serie se elimina sola o con las siguientes: `onDelete('one' | 'series')`.

```tsx
<BookingPanel slot={hueco} onPlan={(repeat) => planSeries(tipo, horario, { start: hueco.start, repeat, busy, owner: true })} … />
```
