# Entrada y asistencia

Cada boleto lleva un código de entrada. Su QR va en el correo, y en la puerta se escanea: entra **una sola vez**, el día de la función. Si alguien lo usa otra vez, la puerta lo rechaza y dice a qué hora entró. En citas y canchas, quien atiende marca **llegó** o **no vino**; con eso los reportes miden las faltas.

<demo name="tickets" />

## El código {#code}

```ts
const reservas = createBookingHandler({ tickets: true /* … */ });
```

Con `tickets: true`, cada reserva confirmada trae `ticket` en su respuesta, y su aviso dice que el QR va adjunto. Dibujarlo es cosa de tu aplicación, con la librería que quieras:

```ts
import QRCode from 'qrcode';

onBooked: async (reserva, { notice }) => {
  const codigo = await reservas.ticketOf(reserva);
  await correo.enviar({ ...notice, attachments: [{ filename: 'boleto.png', content: await QRCode.toBuffer(codigo) }] });
};
```

El código (`RS1.…`) está firmado aparte de la dirección de la reserva. Quien vea el QR puede entrar, pero no puede cancelar ni cambiar la reserva.

## En la puerta {#door}

Tu pantalla de entrada (solo para tu personal) lee el código y pregunta:

```ts
const id = await reservas.readTicket(codigo); // null si no lo firmó este servidor
const reserva = id && (await db.reservas.porId(id));
const entrada = checkIn(reserva, Date.now(), zonaHoraria);

if (entrada.ok) await db.reservas.upsert(entrada.booking); // attended: 'arrived', arrived: ahora
else mostrar(describeEntry(entrada.reason, 'es', reserva.arrived, zonaHoraria)); // "Este boleto ya entró a las 9:50."
```

Las razones para rechazar un boleto: `used` (ya entró), `cancelled`, `held` (no se pagó) y `not-today`.

Un lector de códigos funciona como teclado: escribe el código y da Enter. En el navegador, `BarcodeDetector` lee QR con la cámara; la demo usa las dos formas.

## Llegó o no vino {#attendance}

`markAttendance(reserva, 'arrived' | 'no-show')`. `BookingPanel` muestra los dos botones desde el día de la cita si le pasas `onAttend`:

```tsx
<BookingPanel booking={reserva} onAttend={(a) => guardar(a ? markAttendance(reserva, a) : sinMarca(reserva))} />
```
