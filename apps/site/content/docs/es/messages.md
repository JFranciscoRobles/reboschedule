# WhatsApp y SMS

Cada aviso también existe en versión corta, para mandarla al teléfono de quien reservó: una o dos líneas con la liga para cambiar o cancelar. En México, un recordatorio por WhatsApp se lee mucho más que un correo. El proveedor lo eliges tú, igual que el de correo.

<demo name="barber" />

## El teléfono {#phone}

Agrega al tipo una pregunta de teléfono (`kind: 'phone'`). `phoneOfBooking(reserva, tipo)` toma la respuesta y la deja como la piden los proveedores: `664 123 4567` se vuelve `+526641234567` (México si no trae lada de país).

## El mensaje {#short}

```ts
import { phoneOfBooking, shortOf } from '@reboschedule/core';

const corto = shortOf(aviso, tipo, organizador, { locale: 'es', phone: phoneOfBooking(reserva, tipo), link: manage });
// corto.text: "Rebo Barber: te recordamos tu corte, mar, 3 nov, 9:30. Cambiar o cancelar: https://…"
// corto.template: { name: 'reboschedule_reminder', params: ['Rebo Barber', 'tu corte', 'mar, 3 nov, 9:30', 'https://…'] }
```

## Mandarlo {#send}

`@reboschedule/messages` trae Twilio (SMS y WhatsApp) y la Cloud API de WhatsApp (Meta), sin SDK:

```ts
import { twilioMessenger, whatsAppCloudMessenger } from '@reboschedule/messages';

const whatsapp = whatsAppCloudMessenger({
  accessToken: process.env.WA_TOKEN!,
  phoneNumberId: process.env.WA_NUMBER!,
  templates: { reboschedule_reminder: 'recordatorio_cita', reboschedule_booked: 'cita_confirmada' },
});
// o: twilioMessenger({ accountSid, authToken, from: '+1555…', channel: 'sms' })

if (corto) await whatsapp.send(corto);
```

WhatsApp solo deja que un negocio inicie la conversación con **plantillas aprobadas**. Crea en Meta (o en Twilio Content) una plantilla por tipo de aviso, con 4 variables en este orden: negocio, qué, cuándo, liga. `templates` relaciona sus nombres con los de aquí. Sin plantilla, se manda el texto completo, que solo llega si la persona te escribió en las últimas 24 horas.

En la demo, cada aviso de la pestaña **Avisos** muestra también cómo llegaría por WhatsApp.
