# Lista de espera

Cuando una función, una zona o un horario está lleno, quien quería ir puede anotarse. Si se libera un lugar, porque alguien canceló, cambió de fecha o no pagó a tiempo, se le avisa al primero de la lista que quepa, con la liga para reservar. Gana quien reserve primero: la lista no aparta lugares.

<demo name="tickets" />

```ts
createBookingHandler({
  waitlist: {
    list: (tipo, inicio) => db.espera.porHorario(tipo.id, inicio), // el primero primero
    onAdded: (espera) => db.espera.insertar(espera),
    onOffered: async (espera, aviso) => {
      await db.espera.marcar(espera.id, espera.offered); // ya se le avisó: una sola vez
      await correo.enviar(aviso); // "Se liberó un lugar: …"
    },
  },
  page: (tipo) => `https://example.com/reservar/${tipo.slug}`, // a dónde lleva la liga del aviso
});
```

- `GET /s/:slug/slots` también da `full`: los horarios llenos, para ofrecer la lista.
- `POST /s/:slug/wait` con `{ start, places, resource, name, email }` anota a alguien. Si en realidad sí hay lugar, responde `409` con `free`, para que reserve de una vez.
- Cancelar y cambiar de fecha avisan solos. Un apartado que vence sin pagar no avisa a nadie por sí mismo: llama a `handler.offer(calendario, inicio)` desde el mismo cron de los recordatorios.

En el navegador, `useBooking` da `waitlist`, `full`, `wait(visitante, inicio, { places })` y `waiting`.

## Recordatorios {#reminders}

Un aviso el día antes reduce mucho las faltas. `remindersDue(reservas, ahora, 24)` dice a quién le toca: confirmadas, que empiezan en las próximas 24 horas y sin recordatorio todavía. `handler.reminder(reserva, calendario)` arma el mensaje, con la liga para cambiarla o cancelarla.

```ts
// Cada 15 minutos, desde tu cron.
for (const reserva of remindersDue(await db.reservas.proximas())) {
  await correo.enviar(await reservas.reminder(reserva, calendarioDe(reserva)));
  await db.reservas.upsert({ ...reserva, reminded: new Date().toISOString() });
}
```
