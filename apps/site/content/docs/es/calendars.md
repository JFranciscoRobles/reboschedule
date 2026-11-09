# Google, Outlook e iCal

Quien da citas tiene su propio calendario: lo que hay en él está ocupado, y nunca se ofrece. `@reboschedule/calendars` lo lee como lo toma el motor. Tu aplicación autoriza; el paquete lee.

<demo name="clinic" />

## Una dirección iCal secreta {#a-secret-ical-address}

Google, Outlook y Apple le dan a cada calendario una dirección secreta. Quien da citas la pega una vez; sin OAuth, sin consola.

```ts
import { fetchIcsBusy } from '@reboschedule/calendars';

const ocupado = await fetchIcsBusy(direccionSecreta, { from, to, timeZone: 'America/Tijuana' });
// [{ start, end, title }, …]
```

Lee lo que ocupa tiempo, en la zona horaria que dice; los días completos; los eventos que se repiten (diario o semanal, cada tanto, tantas veces o hasta un día, sin los días que se excluyen); y deja fuera lo marcado como libre y lo cancelado. `icsBusy(texto, …)` lee el texto mismo.

En Google: *Configuración → el calendario → Integrar el calendario → Dirección secreta en formato iCal*. En Outlook: *Configuración → Calendario → Calendarios compartidos → Publicar un calendario → ICS*.

## Google Calendar {#google-calendar}

Con un token de tu aplicación, autorizado con el permiso `calendar.freebusy`:

```ts
import { googleBusy } from '@reboschedule/calendars';

const ocupado = await googleBusy({ accessToken, calendars: ['primary'], from, to });
```

## Outlook {#outlook}

Con un token de Microsoft Graph, autorizado con `Calendars.Read`:

```ts
import { outlookBusy } from '@reboschedule/calendars';

const ocupado = await outlookBusy({ accessToken, schedules: ['sofia@consultorio.com'], from, to });
```

## En el calendario de un tipo {#in-the-calendar-of-a-kind}

```ts
import { cachedBusy, combineBusy, fetchIcsBusy } from '@reboschedule/calendars';

// Leído una vez por minuto como máximo; un calendario que no responde no cierra los demás.
const suyo = cachedBusy((from, to) => fetchIcsBusy(direccionSecreta, { from, to, timeZone }), 60_000);
const busy = combineBusy(suyo, (from, to) => db.reservas.entre(from, to));

createBookingHandler({ load: (slug) => ({ type, schedule, organizer, busy }) });
```

`BookingDay` lo muestra donde cae, rayado, con `away={ocupado}`.

## Lo que sigue siendo tuyo {#what-stays-yours}

Pedir permiso, guardar los tokens y renovarlos es cosa de tu aplicación: depende de tus cuentas de Google y Microsoft y de dónde guardas los secretos. Enterarse al instante de un cambio en su calendario (los canales push de Google, las suscripciones de Graph) todavía no se hace: vuelve a leerlo, `cachedBusy` lo guarda un rato.

## Escribir en su calendario {#writing}

`googleWriter` y `outlookWriter` ponen cada reserva en el calendario de quien atiende y la quitan cuando se cancela. Cada evento se vuelve a encontrar por el id de la reserva, así que escribir la misma reserva dos veces la cambia en lugar de duplicarla. El token necesita `calendar.events` (Google) o `Calendars.ReadWrite` (Outlook).

```ts
import { googleWriter } from '@reboschedule/calendars';

const agenda = googleWriter({ accessToken: await tokenDe(quienAtiende) });

createBookingHandler({
  onBooked: async (r, { calendar }) => agenda.write(r, calendar.type, calendar.organizer),
  onMoved: async (r, { calendar }) => agenda.write(r, calendar.type, calendar.organizer),
  onCancelled: async (r, calendar) => agenda.write(r, calendar.type, calendar.organizer), // cancelada: se quita
});
```

El evento dice el tipo y quién reservó, cuándo, dónde, los asientos o el recurso, las respuestas y el precio.
