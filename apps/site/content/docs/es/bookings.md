# Una reserva

Una reserva (`Booking`) es cuándo, de qué tipo, qué recurso, quién, qué respondió, su precio y su estado. Los horarios son textos ISO en UTC; se guarda la zona horaria de quien reservó, para decirle su horario en ella.

```ts
interface Booking {
  id: string;
  type: string;          // el id de su tipo
  resource: string;      // el id del recurso; '' si no hay
  start: string;
  end: string;
  name: string;
  email: string;
  timeZone: string;
  answers: Record<string, string>;
  price?: Money | null;
  status: 'confirmed' | 'cancelled' | 'held';
  held?: string;         // apartada mientras se paga: hasta cuándo guarda su lugar
  payment?: { provider: string; id: string; url?: string; paid?: string; amount?: number };
  due?: Money;           // por pagar allá, cuando solo se pagó anticipo
  discount?: { code: string; amount: number };
  refunded?: Money;      // lo que se devolvió al cancelarla
  seats?: string[];      // los asientos de un cine
  places?: number;       // tantos lugares de una zona
  series?: string;       // el id que comparte su serie semanal
  sequence?: number;     // la versión de su invitación
  reminded?: string;     // cuándo se le recordó
  attended?: 'arrived' | 'no-show';
  arrived?: string;      // cuándo entró por la puerta
  created: string;
}
```

## Revisada al llegar {#checked-as-it-comes}

`bookingProblems(request, type, free)` dice qué le falta a una solicitud, o por qué no puede ser: `taken` (el horario no está libre, o el recurso pedido no tiene lugar), `no-name`, `bad-email`, `missing-answer`; en una estancia, `too-short` y `too-long`; `bad-coupon` (un código que no existe o no aplica); al cambiarla, `too-late`. Los hooks agregan `run-out` (un apartado que venció sin pagar) y `failed` (el servidor no respondió). `describeBookingProblem` dice cada uno en palabras, en inglés o español. El servidor revisa contra los horarios libres como están cuando llega la solicitud: quien llegó primero se la queda.

## Hecha {#made}

`makeBooking(request, type, now, free, quote)` la hace: por la duración pedida, del recurso pedido o el primero libre, a su precio.

## Movida {#moved}

`moveBooking(booking, start, type, free)` la mueve a otro horario libre, con su duración, y su mismo recurso si tiene lugar ahí. `free` son los horarios libres sin contarla.

## Su invitación {#its-invitation}

`icsOf(booking, type, organizer)` es su invitación, un archivo iCalendar que cualquier calendario abre, y su cancelación cuando se cancela. `googleCalendarUrl` la pone en Google Calendar en un clic.

## Su dirección propia {#its-own-address}

Cada reserva tiene su propia dirección, firmada con tu secreto: `/s/b/<token>` para verla, `/s/b/<token>/ics` para su invitación, y un `POST` a `/s/b/<token>/cancel` para cancelarla. Sin cuenta: quien tiene la dirección puede.

## Lo que le pasa después {#after}

- **Apartada y pagada:** [Cobrar](/docs/payments/).
- **Cambiada o cancelada por quien reservó, con su reembolso:** [Cambios y reembolsos](/docs/policies/).
- **Con descuento:** [Códigos de descuento](/docs/coupons/).
- **Recordada, o un lugar liberado para quien espera:** [Lista de espera y recordatorios](/docs/waitlist/).
- **Entrada por la puerta, llegó o no vino:** [Entrada y asistencia](/docs/checkin/).
- **Guardada de una vez, sin dos para el mismo lugar:** [Tu base de datos](/docs/database/).
