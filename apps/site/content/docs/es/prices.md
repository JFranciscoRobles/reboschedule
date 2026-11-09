# Precios

Un tipo puede tener precio: un monto por hora, o por reserva, en una moneda. Un recurso puede tener el suyo. Quien reserva ve el total antes de reservar, el servidor lo vuelve a cotizar cuando llega la reserva, y la reserva lo guarda. Cobrarlo es cosa de tu aplicación.

<demo name="courts" />

## Un precio {#a-price}

```ts
const cancha: EventType = {
  ...tipo,
  price: { amount: 350, currency: 'MXN', per: 'hour' },
  resources: [
    { ...canchaUno, price: null },     // el del tipo: 350 por hora
    { ...canchaCuatro, price: 450 },   // el suyo
  ],
};
```

`quoteOf(type, { resource, length })` dice cuánto cuesta una reserva según el precio: 450 × 2 horas son 900. `priceSlots` le pone ese precio a cada horario libre, según el recurso pedido o el primero libre; el servidor lo hace en `/slots`.

## Reglas propias {#rules-of-your-own}

Una noche que cuesta más, un precio de socio, un descuento: dale al servidor un `Quote`, y ese es el precio, en los horarios libres y en la reserva.

```ts
import { quoteOf } from '@reboschedule/core';

createBookingHandler({
  // …
  quote: ({ type, resource, start, length }) => {
    const precio = quoteOf(type, { resource, length });
    return precio && esNoche(start) ? { ...precio, amount: precio.amount + 100 } : precio;
  },
});
```

## En la reserva {#on-the-booking}

`booking.price` es lo que cotizó el servidor: `{ amount: 900, currency: 'MXN' }`. Lo que mande el navegador nunca es el precio. `formatMoney(money, locale)` lo dice como se lee: `$1,100 MXN`.

## Cobrar {#taking-the-money}

El paquete no cobra. Con el precio en la reserva, tu aplicación lo cobra a su manera: una liga de pago en el correo, un pago antes de confirmar, pagar en el club.
