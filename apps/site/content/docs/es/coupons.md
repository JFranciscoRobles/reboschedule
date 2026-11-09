# Códigos de descuento

Un código quita un porcentaje (`percent`) o una cantidad (`amount`), o deja pagar `pay` de cada `take` lugares: un 2×1. Puede valer solo para algunos tipos, algunos días de la semana o hasta una fecha. El servidor lo revisa y aplica al hacer la reserva, igual que el precio: lo que diga el navegador no cuenta.

<demo name="tickets" />

```ts
const codigos: Coupon[] = [
  { code: 'MARTES2X1', label: '2×1 los martes', take: 2, pay: 1, days: [2], types: ['pelicula'] },
  { code: 'BOSQUE10', label: '10 % en tu estancia', percent: 10 },
  { code: 'PRIMERA', label: '$50 menos', amount: 50, until: '2026-12-31' },
];

createBookingHandler({
  coupons: (code, tipo) => codigos.find((c) => c.code === code),
});
```

- El 2×1 regala los lugares más baratos: de 4 asientos se pagan los 2 más caros.
- La reserva guarda `discount: { code, amount }` y su `price` ya tiene el descuento. El aviso muestra las dos cosas.
- Un código que no existe o no aplica a esa reserva se rechaza con el problema `bad-coupon`.

## En el navegador {#hooks}

`useBooking` y `useStay` tienen `coupons` (si el servidor acepta códigos), `coupon` y `setCoupon`, y `applied` (el código, si vale para este tipo). Para mostrar cuánto se descuenta antes de reservar:

```ts
const menos = b.discountFor(asientos.map(precioDe), b.slot.start); // 0 si ese día no aplica
```

`useStay` ya da `discount`, y su `price` lo incluye. El widget del paquete muestra el campo solo si el servidor acepta códigos.
