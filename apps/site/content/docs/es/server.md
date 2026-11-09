# Las rutas

`createBookingHandler` da las rutas que necesitan las reservas, como una función de un `Request` a un `Response`: una ruta de Next.js, un Worker, Bun, o `node:http` con `nodeHandler`. No guarda nada: tu aplicación dice lo que tiene, y se le avisa qué se reserva y qué se cancela.

## Rutas {#routes}

| Ruta | Qué responde |
| --- | --- |
| `GET /s/:slug/slots` | Los horarios libres de un tipo, con precio: `?from`, `?to` (días), `?length` (minutos), `?resource`. |
| `POST /s/:slug/book` | Una reserva, revisada otra vez: `201` con ella, `409` si el horario ya lo tomaron, `422` por lo que le falte. |
| `GET /s/b/:token` | Una reserva, por su dirección propia firmada. |
| `GET /s/b/:token/ics` | Su invitación, como archivo. |
| `POST /s/b/:token/cancel` | La cancela. |
| `POST /s/b/:token/move` | La cambia de fecha, con `onMoved`: ver [Cambios y reembolsos](/docs/policies/). |
| `POST /s/:slug/wait` | Alguien que espera un horario lleno, con `waitlist`: ver [Lista de espera](/docs/waitlist/). |
| `POST /s/paid` | El aviso del proveedor de pagos, con `payments`: ver [Cobrar](/docs/payments/). |

El tipo en `/slots` llega sin dónde es: la dirección y la liga de una llamada se le dicen solo a quien la reservó.

## Opciones {#options}

| Opción | Qué es |
| --- | --- |
| `secret` | Largo, aleatorio, el mismo en cada proceso: con lo que se firma la dirección de cada reserva. Dieciséis caracteres al menos. |
| `base` | Desde dónde se ve el servidor por fuera: `https://example.com`. |
| `prefix` | La ruta bajo la que están las rutas; `/s` si no se dice. |
| `load(slug)` | Un tipo por su dirección, como `Calendar`; ninguno si no existe. |
| `find(id)` | Una reserva por su id, con su calendario. |
| `onBooked(booking, done)` | Se le avisa de cada reserva hecha, con su `calendar`, su dirección `manage`, su `ics`, el mensaje para mandar (`notice`) y, si se reservó cada semana, su `series` (guárdalas todas) y los horarios que se dejaron fuera (`skipped`). |
| `onCancelled(booking, calendar, notice)` | Se le avisa de cada reserva que cancela quien la reservó, con el mensaje que lo dice. |
| `tickets` | El código de entrada de cada reserva, en su aviso y su respuesta: ver [Entrada y asistencia](/docs/checkin/). |
| `keep` | Guarda lo reservado en el mismo paso en que revisa que siga libre: ver [Tu base de datos](/docs/database/). |
| `onMoved` | Se le avisa de cada reserva que cambia quien la hizo; si se da, se puede cambiar. |
| `coupons` | Un descuento por su código: ver [Códigos de descuento](/docs/coupons/). |
| `waitlist`, `page` | Quien espera un horario lleno, y a dónde lo manda el aviso. |
| `payments`, `hold`, `onHeld` | Quién cobra, cuántos minutos se aparta lo que cuesta y a quién se le avisa de lo apartado: ver [Cobrar](/docs/payments/). |
| `quote` | Cuánto cuesta una reserva según reglas propias; el precio del tipo si no se da. |
| `locale` | El idioma de los problemas que dice; inglés si no se dice. |
| `now` | Ahora, en milisegundos; para pruebas. |

## Un calendario {#a-calendar}

```ts
interface Calendar {
  type: EventType;
  schedule: Schedule;
  organizer: { name: string; email: string };
  busy(from: string, to: string): Busy[] | Promise<Busy[]>;
}
```

`busy` es lo ocupado entre dos instantes: las reservas del tipo y, para el tiempo propio de quien atiende, también su propio calendario. Un tiempo ocupado que no nombra recurso los ocupa todos.

## Con node:http y Express {#with-node-http-and-express}

```ts
import { createServer } from 'node:http';
import { createBookingHandler, nodeHandler } from '@reboschedule/server';

const handle = nodeHandler(createBookingHandler({ /* … */ }));
createServer(handle).listen(3000);
// Express: app.use('/s', handle)
```

## Cuando algo falla {#when-something-fails}

Lo que falle en una ruta (tu `load`, una base de datos que no responde) se responde con `500` y se escribe en la consola; el servidor sigue.

## La invitación por correo {#the-invitation-by-email}

ReboSchedule no manda correos: tu aplicación los manda con lo que use, su proveedor, su propio SMTP, el servicio que elija. `onBooked` recibe lo que hay que mandar: la invitación como texto (`ics`) y la dirección propia de la reserva (`manage`). Adjunta la invitación como `invitacion.ics`, con `text/calendar; method=REQUEST`, y cualquier calendario la muestra como invitación. `onCancelled` es el momento de mandar su cancelación, `icsOf` de la reserva como está ahora.
