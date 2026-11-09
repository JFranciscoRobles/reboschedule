# Cobrar: apartar mientras se paga

Cuando un tipo tiene precio, el servidor puede cobrar antes de confirmar. La reserva llega y queda **apartada** unos minutos (`status: 'held'`, hasta `held`): nadie más toma ese asiento, esas noches o esa hora. Quien reservó paga con el proveedor que elijas. Cuando el proveedor avisa que se pagó, la reserva queda confirmada; si se acaba el tiempo sin pago, el lugar se libera solo.

<demo name="tickets" />

## Con Stripe o Mercado Pago {#providers}

`@reboschedule/payments` trae los dos, con tus llaves y sin SDK; también puedes escribir el tuyo (ver abajo).

```ts
import { createBookingHandler } from '@reboschedule/server';
import { stripePayments } from '@reboschedule/payments';
// o: import { mercadoPagoPayments } from '@reboschedule/payments';

const reservas = createBookingHandler({
  secret: process.env.BOOKING_SECRET!,
  base: 'https://example.com',
  payments: stripePayments({ secretKey: process.env.STRIPE_KEY!, webhookSecret: process.env.STRIPE_WHSEC! }),
  // payments: mercadoPagoPayments({ accessToken: process.env.MP_TOKEN!, webhookSecret: process.env.MP_SECRET! }),
  hold: 10, // minutos; 10 si no se dice
  load,
  find,
  onHeld: (reserva, { series }) => db.bookings.upsertMany(series), // apartada: guárdala, ya ocupa su lugar
  onBooked: (reserva, { notice }) => (db.bookings.upsert(reserva), mandar(notice)), // pagada, o sin precio
  onCancelled: (reserva) => db.bookings.upsert(reserva),
});
```

En el proveedor, apunta el webhook a `https://example.com/s/paid`:

- **Stripe**: el evento `checkout.session.completed`. Su secreto de firma (`whsec_…`) es `webhookSecret`.
- **Mercado Pago**: las notificaciones de pagos. Su clave secreta es `webhookSecret`; además, cada preferencia lleva su `notification_url`.

## Qué pasa {#flow}

1. `POST /s/:slug/book` revisa la reserva como siempre. Si cuesta algo, la guarda como `held` hasta dentro de `hold` minutos, empieza el cobro y responde **`202`** con `pay` (a dónde mandar a quien paga) y `until`.
2. Mientras está apartada, `busyOfBookings` la cuenta como ocupada. Cuando pasa `held`, deja de contar sola: no hace falta un cron.
3. El proveedor avisa a `POST /s/paid`. Se revisa su firma, la reserva se confirma (`payment.paid` guarda el id del pago para reembolsar) y llega a `onBooked` con su mensaje.
4. Si el pago llega después de `held`, se revisa otra vez: si el lugar sigue libre, se confirma; si alguien lo tomó, la reserva se cancela, se reembolsa (`refund`) y llega a `onCancelled`.
5. Quien apartó puede soltarla antes con `POST /s/b/:token/cancel`.

Al terminar, el proveedor regresa a quien pagó a la dirección de su reserva (`manage`, con `?paid=1`).

Stripe deja abierto un checkout 30 minutos como mínimo. Por eso el paso 4 existe: un pago tardío nunca quita un lugar que ya vendiste a otro.

## Anticipo y reembolsos {#deposits}

Un tipo con `deposit: 30` cobra el 30 % al reservar; el resto queda en `booking.due`. Al cancelar se devuelve lo que digan sus `refunds`, con `refund(booking, amount)`. Ver [Cambios y reembolsos](/docs/policies/).

## En el navegador {#hooks}

`useBooking` y `useStay` dan `held` cuando el servidor responde `202`:

```tsx
const b = useBooking({ endpoint });

if (b.held)
  return (
    <div>
      <p>Apartado hasta {hora(b.held.until)}: {dinero(b.held.booking.price)}</p>
      <a href={b.held.pay}>Pagar</a>
      <button onClick={b.release}>Soltarlo</button>
    </div>
  );
```

- `held`: la reserva apartada, con `pay` y `until`.
- `check()`: pregunta otra vez a su dirección si ya se pagó; si sí, la pasa a `booked`.
- `release()`: la suelta y se libera el lugar.

Si se acaba el tiempo, `held` vuelve a `null` y `problems` dice `run-out`. El widget del paquete ya hace todo esto.

## Tu propio proveedor {#own}

```ts
import type { Payments } from '@reboschedule/server';

const mio: Payments = {
  provider: 'mi-banco',
  async checkout({ booking, total, until, back, notify }) {
    const cobro = await miBanco.crear({ monto: total.amount, moneda: total.currency, referencia: booking.id, vence: until, regreso: back, aviso: notify });
    return { id: cobro.id, url: cobro.url };
  },
  async notified(request) {
    const aviso = await miBanco.leerAviso(request); // revisa su firma
    return aviso?.pagado ? { booking: aviso.referencia, paid: aviso.id } : null;
  },
  async refund(booking) {
    await miBanco.reembolsar(booking.payment!.paid!);
  },
};
```
