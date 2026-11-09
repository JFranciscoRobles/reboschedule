# Horario y zonas horarias

El horario de quien atiende (`Schedule`) se dice como lo marca su reloj, en su zona horaria: los tramos de cada día de la semana, y los días distintos a la semana. Quien reserva ve esos mismos horarios en la suya.

<demo name="slots" />

## Un horario {#a-schedule}

```ts
const horario: Schedule = {
  timeZone: 'America/Tijuana',
  weekly: {
    0: [],                                     // domingo, descanso
    1: [{ from: '09:00', to: '13:00' }, { from: '15:00', to: '18:00' }],
    // … del 2 al 5 como el lunes
    6: [{ from: '10:00', to: '13:00' }],       // sábado en la mañana
  },
  dates: {
    '2026-12-25': [],                          // cerrado
    '2026-12-19': [{ from: '10:00', to: '14:00' }],
  },
};
```

Los días de la semana van como los cuenta `Date`, domingo 0. Un tramo puede terminar a las `24:00`. `readSchedule` ordena los tramos, quita los que se enciman o que un reloj no puede marcar, y toma UTC si la zona horaria no la conoce el sistema.

## Zonas horarias {#time-zones}

El motor no usa más que `Intl`. `clockAt(ms, timeZone)` dice qué marca un reloj en un instante; `instantOf(day, minute, timeZone)` dice el instante en que un reloj marca un día y un minuto, y dice que ninguno para un minuto que no existe esa noche, cuando se adelanta la hora. Ese horario nunca se ofrece.

`slotsByDay(slots, timeZone)` acomoda los horarios libres en los días de quien reserva: la tarde en Tijuana es la mañana siguiente en Madrid, y se muestra en ese día.

## El horario propio de un tipo {#hours-of-a-kind-s-own}

Un tipo puede tener su propio horario en lugar del de quien atiende: una cancha abierta todos los días de 7 a 22, las salas solo entre semana. Los días distintos a la semana de quien atiende la cierran igual: un festivo cierra todo.

```ts
const cancha = { ...tipo, hours: { 0: [{ from: '08:00', to: '20:00' }], 1: [{ from: '07:00', to: '22:00' }], /* … */ } };
```

<demo name="hours" />
