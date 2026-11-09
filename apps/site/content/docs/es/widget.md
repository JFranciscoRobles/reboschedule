# El widget de reserva

`BookingWidget` es lo que ve quien reserva: quién y qué, cuánto dura y dónde; las canchas o salas para elegir, con su imagen y su precio; un mes con los días que tienen horarios; los horarios de un día en su propia zona horaria; sus datos; y, ya reservado, las formas de ponerlo en su calendario.

<demo name="widget" />

## Props {#props}

| Prop | Qué es |
| --- | --- |
| `endpoint` | Dónde están las rutas de un tipo: `https://example.com/s/cancha`, su `/slots` y su `/book`. |
| `locale` | `'en'` o `'es'`; inglés si no se dice. |
| `timeZone` | La zona horaria de quien reserva; la de su navegador si no se dice. Puede cambiarla. |
| `onBooked` | Se le avisa de cada reserva hecha, como la respondió el servidor. |
| `fetch` | Un fetch propio: para agregar un encabezado, para una prueba, o para un demo sin servidor. |
| `className` | Una clase propia en su raíz. |

## Lo que hace solo {#what-it-does-on-its-own}

- **El primer día con horarios ya viene elegido**, para que haya horarios a la vista desde el principio.
- **Muchos horarios se agrupan** en mañana, tarde y noche, como los dice el reloj de quien reserva.
- **Un recurso elegido primero** (una cancha, una sala) le pide al servidor solo sus horarios, con su precio.
- **Un horario que alguien tomó hace un momento** se dice, y los horarios se vuelven a pedir.
- **Reservar otra** vuelve a empezar sin borrar el nombre y el correo.
- **Apartada mientras se paga** (cuando el servidor cobra): dice hasta cuándo, con un botón **Pagar** al checkout del proveedor y otro para **soltarla**; si se acaba el tiempo, lo dice.
- **Un campo de código de descuento**, solo cuando el servidor acepta códigos, que dice si el código vale.

## Lo que te entrega onBooked {#what-onbooked-hands-you}

```ts
interface Booked {
  booking: Booking;   // lo reservado, con su precio como lo cotizó el servidor
  type: EventType;    // el tipo, con dónde es (solo quien reservó lo ve)
  organizer: { name: string };
  manage: string;     // su dirección propia, firmada, para verla o cancelarla
  ics: string;        // su invitación, como archivo
  google: string;     // la dirección que la pone en Google Calendar
}
```

## Un fetch propio {#a-fetch-of-your-own}

El widget pide con el `fetch` que se le da. Tu aplicación puede agregar lo que su servidor necesita:

```tsx
<BookingWidget
  endpoint="/s/cancha"
  fetch={(url, init) => fetch(url, { ...init, headers: { ...init?.headers, 'x-club': clubId } })}
/>
```

## Tu propio widget {#your-own-widget}

`BookingWidget` está hecho sobre `useBooking`, que tiene todo: los horarios, lo elegido, la reserva. Para reservar con un aspecto propio, dibuja sobre el hook: ve [Headless: tu propia interfaz](/docs/headless/).
