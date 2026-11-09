# Boletos: asientos y zonas

Un cine vende cada asiento de cada función; un concierto vende tantos lugares de cada zona. Los dos son turnos completos (`whole: true`) de un tipo con recursos: en el cine cada asiento es un recurso con lugar para uno, en el concierto cada zona un recurso con su `capacity`.

<demo name="tickets" />

## Un cine, asiento por asiento {#seats}

```ts
import { seatsOf } from '@reboschedule/core';

// 8 filas (A a H), cada una de 3, 6 y 3 asientos con un pasillo entre bloques; G y H más caras.
const sala = { rows: 8, blocks: [3, 6, 3], prices: { G: 160, H: 160 } };
const funciones = [{ from: '16:00', to: '18:10' }, { from: '19:00', to: '21:10' }, { from: '21:40', to: '23:50' }];

const pelicula: EventType = {
  ...tipo,
  whole: true,
  capacity: 1,
  hours: { 0: funciones, 1: funciones, 2: funciones, 3: funciones, 4: funciones, 5: funciones, 6: funciones },
  price: { amount: 120, currency: 'MXN', per: 'place' },
  seating: sala,
  resources: seatsOf(sala),
};
```

Cada horario libre trae en `resources` los asientos que quedan: un mapa de la sala. Se reservan varios juntos con `seats`:

```ts
await b.book(visitante, { seats: ['F5', 'F6', 'F7'] });
```

Es una sola reserva; cada asiento cuenta como ocupado y se cobra a su precio.

## Un concierto, por zonas {#zones}

```ts
const jazz: EventType = {
  ...tipo,
  whole: true,
  hours: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [{ from: '20:00', to: '23:30' }] },
  price: { amount: 450, currency: 'MXN', per: 'place' },
  resources: [
    { id: 'general', name: 'General', image: '', values: {}, price: null, capacity: 120 },
    { id: 'vip', name: 'VIP', image: '', values: {}, price: 900, capacity: 24 },
  ],
};
```

`setResource('vip')` y `setPlaces(4)` piden solo las fechas con 4 lugares en VIP; la reserva lleva `places: 4` y se cobra por cada uno. Si alguien compró los últimos un momento antes, el servidor responde `taken`.

## La sala, como la acomodas {#seating}

`seating` dice cómo está acomodada la sala: cuántas filas (`rows`, de 1 a 26, `A` la más cercana a la pantalla), cuántos asientos tiene cada bloque de una fila de izquierda a derecha (`blocks`, con un pasillo entre cada uno) y qué filas cuestan distinto (`prices`). `seatsOf(sala)` hace un recurso por asiento (`A1`, `A2`…) y `readEventType` los vuelve a hacer a partir de `seating` cuando lee el tipo; así un tipo guardado nunca pierde asientos.

Para dibujarla, `layoutOf(tipo)` da cada fila con sus bloques:

```tsx
{layoutOf(tipo).map(({ row, blocks }) => (
  <div key={row} className="fila">
    {blocks.map((bloque) => (
      <div key={bloque[0]} className="bloque">
        {bloque.map((id) => <Asiento key={id} id={id} libre={libres.has(id)} />)}
      </div>
    ))}
  </div>
))}
```

En la demo, la taquilla tiene **Configurar la sala**: filas, bloques por lado y filas preferentes, con la sala dibujada mientras la escribes. No deja quitar un asiento vendido para una función por venir.
