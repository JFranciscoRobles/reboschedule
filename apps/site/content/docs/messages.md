# WhatsApp and SMS

Every message also comes in a short version, to send to the phone of whoever booked: a line or two with the link to change or cancel. In Mexico, a WhatsApp reminder gets read far more than an email. You choose the provider, as with email.

<demo name="barber" />

## The phone {#phone}

Give the kind a phone question (`kind: 'phone'`). `phoneOfBooking(booking, type)` takes its answer and writes it as providers want it: `664 123 4567` becomes `+526641234567` (Mexico when it has no country code).

## The message {#short}

```ts
import { phoneOfBooking, shortOf } from '@reboschedule/core';

const short = shortOf(notice, type, organizer, { locale: 'en', phone: phoneOfBooking(booking, type), link: manage });
// short.text: "Rebo Barber: a reminder, your haircut is Tue, Nov 3, 9:30 AM. Change or cancel: https://…"
// short.template: { name: 'reboschedule_reminder', params: ['Rebo Barber', 'your haircut', 'Tue, Nov 3, 9:30 AM', 'https://…'] }
```

## Sending it {#send}

`@reboschedule/messages` has Twilio (SMS and WhatsApp) and WhatsApp's Cloud API (Meta), with no SDK:

```ts
import { twilioMessenger, whatsAppCloudMessenger } from '@reboschedule/messages';

const whatsapp = whatsAppCloudMessenger({
  accessToken: process.env.WA_TOKEN!,
  phoneNumberId: process.env.WA_NUMBER!,
  templates: { reboschedule_reminder: 'appointment_reminder', reboschedule_booked: 'appointment_booked' },
});
// or: twilioMessenger({ accountSid, authToken, from: '+1555…', channel: 'sms' })

if (short) await whatsapp.send(short);
```

WhatsApp only lets a business start a conversation with **approved templates**. At Meta (or in Twilio Content), create one template per kind of message, with 4 variables in this order: business, what, when, link. `templates` maps their names to the ones here. Without a template, the whole text is sent, which only arrives if the person wrote to you in the last 24 hours.

In the demo, each message in the **Messages** tab also shows how it would arrive by WhatsApp.
