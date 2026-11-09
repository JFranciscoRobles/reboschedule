# Cambios, reembolsos y anticipo

Quien reservó puede cambiar la fecha o cancelar desde la dirección de su reserva, la que llega en cada aviso, sin cuenta y sin escribirle a nadie. Cada tipo dice hasta cuándo se puede cambiar, cuánto se devuelve al cancelar y si al reservar se cobra solo un anticipo.

<demo name="cabins" />

## Las reglas de un tipo {#rules}

```ts
const cabana: EventType = {
  ...tipo,
  // Hasta 3 días antes, quien reservó la cambia solo.
  reschedule: 72,
  // Todo de vuelta hasta 14 días antes; la mitad hasta 3 días antes; después, nada.
  refunds: [
    { hours: 14 * 24, percent: 100 },
    { hours: 3 * 24, percent: 50 },
  ],
  // Al reservar se cobra el 30 %; el resto, al llegar.
  deposit: 30,
};
```

- **`reschedule`**: cuántas horas antes todavía se puede cambiar. Sin ese campo no se cambia. Tampoco se puede mover a una fecha que ya esté dentro de ese plazo.
- **`refunds`**: el porcentaje de lo pagado que se devuelve según cuántas horas faltan; se toma la primera regla que se cumpla. Sin reglas, se devuelve todo.
- **`deposit`**: el porcentaje que se cobra al reservar. Lo que falta queda en `booking.due` y aparece en el aviso como "Por pagar allá".

## En el servidor {#server}

Cambiar la fecha se activa al pasar `onMoved`:

```ts
createBookingHandler({
  onMoved: async (reserva, { before, notice }) => {
    await db.reservas.upsert(reserva);
    await correo.enviar(notice); // "Cambió: … ahora el …", su invitación con una versión más
  },
  onCancelled: async (reserva, _, notice) => {
    await db.reservas.upsert(reserva); // reserva.refunded: lo que se devolvió
    await correo.enviar(notice); // dice cuánto se devuelve, o que no hay reembolso
  },
});
```

| Ruta | Qué hace |
| --- | --- |
| `GET /s/b/:token` | La reserva, con `moveUntil` (hasta cuándo se puede cambiar) y `refund` (lo que devolvería cancelar ahora). |
| `POST /s/b/:token/move` | La cambia a `{ start }` o, si es una estancia, a `{ arrive }`. Conserva la duración, los asientos, las noches y el precio. |
| `POST /s/b/:token/cancel` | La cancela y devuelve lo que dicen las reglas con el `refund` de tu proveedor de pagos. |

Un código de descuento que solo vale ciertos días (el 2×1 del martes) no se puede llevar a un día en que no vale. El servidor lo rechaza con `bad-coupon`.

## En el navegador {#hooks}

`useManage` es la página "mi reserva", sin el diseño:

```tsx
const m = useManage({ address }); // la dirección de la reserva

m.managed?.booking;           // la reserva
m.canMove && m.choose(true);  // empezar a elegir
m.times;                      // los horarios a los que puede ir, por día
m.arrivals;                   // o los días de llegada, si es una estancia
await m.move(slot.start);
await m.cancel();             // m.managed.refund dice cuánto se devuelve antes de hacerlo
```

En las demos, "Cambiar o cancelar" (y "Abrir mi reserva" en los avisos) abre esto mismo.
