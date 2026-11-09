# Avisar a quien reservó

Cuando una reserva se hace, se mueve, se corrige o se cancela, se le avisa a quien la reservó, y su calendario la cambia. ReboSchedule arma el mensaje: un asunto y un texto en su idioma y su zona horaria, y la invitación como está ahora. Tu aplicación lo manda, con el proveedor que use.

<demo name="clinic" />

## El mensaje {#the-message}

```ts
import { noticeOf } from '@reboschedule/core';

const aviso = noticeOf('moved', despues, tipo, organizador, { locale: 'es', before: antes, manage });
aviso.to;       // { name, email }
aviso.subject;  // 'Cambió: Consulta dental · ahora lunes, 2 de noviembre, 18:30'
aviso.text;     // el cuerpo, en texto
aviso.ics;      // la invitación, para adjuntar
aviso.method;   // 'REQUEST' | 'CANCEL'
```

`changeOf(antes, despues)` dice qué cambió: `booked`, `moved`, `changed` o `cancelled`. El `kind` de un aviso también puede ser `reminder`, el día antes (ver [Recordatorios](/docs/waitlist/#reminders)).

Lo que dice el mensaje además de cuándo y dónde, cuando aplica:

- el código usado y su descuento;
- lo que falta pagar allá, cuando solo se pagó anticipo;
- al cancelar una reserva pagada, cuánto se devuelve, o que no hay reembolso;
- el código de entrada, cuando el servidor da boletos (con su QR adjunto, ver [Entrada](/docs/checkin/));
- la liga "para verla, cambiarla o cancelarla", cuando se puede cambiar.

A quien espera en una lista le llega `offerOf(espera, tipo, organizador, { link })` cuando se libera un lugar. Cada aviso tiene también una versión corta para WhatsApp o SMS: ver [WhatsApp y SMS](/docs/messages/).

## Cada cambio, una versión {#each-change-a-version}

Una invitación tiene versión (`SEQUENCE`). Cada cambio la sube, y Google, Outlook y Apple cambian el evento que tienen, con el mismo `UID`, en lugar de agregar otro:

- `moveBooking` la mueve, una versión más.
- `changeBooking(booking, { name, email, answers })` la corrige, una versión más.
- `cancelBooking(booking)` la cancela, una versión más, su invitación un `CANCEL`.

## Desde el servidor {#from-the-server}

`onBooked` recibe el mensaje de cada reserva hecha (`done.notice`), y `onCancelled` el de cada una que cancela quien la reservó. Lo que quien atiende cambia desde el panel lo hace tu aplicación, con las funciones de arriba.

```ts
createBookingHandler({
  onBooked: async (reserva, { notice, series }) => {
    await db.reservas.insertarVarias(series);
    await correo.enviar({
      to: notice.to.email,
      subject: notice.subject,
      text: notice.text,
      attachments: [{ filename: 'invitacion.ics', content: notice.ics, contentType: `text/calendar; method=${notice.method}` }],
    });
  },
});
```

## Mandarlo {#sending}

El paquete no manda nada: ni proveedor, ni cuenta, ni cola. `correo.enviar` es tuyo: SMTP, Resend, Amazon SES, SendGrid, lo que tu aplicación ya use.
