# Tu base de datos

ReboSchedule no guarda nada: los tipos, el horario y las reservas son de tu base de datos. Esta página es lo que necesita de ella, en cualquier base de datos; los ejemplos son SQL.

## Qué guardar {#what-to-keep}

```sql
create table booking_types (
  id text primary key,
  slug text unique not null,
  data jsonb not null           -- el EventType, como lo escribió el editor
);

create table bookings (
  id text primary key,
  type text not null references booking_types(id),
  resource text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  name text not null,
  email text not null,
  data jsonb not null,          -- la Booking completa: respuestas, precio, zona horaria
  status text not null default 'confirmed'
);

create index bookings_when on bookings (type, starts_at);
```

Lee los tipos de vuelta con `readEventType`, y el horario con `readSchedule`: solo conservan lo que tiene sentido, tenga lo que tenga una fila vieja.

## Qué está ocupado {#what-is-busy}

`busy(from, to)` es una consulta de las reservas que tocan esos instantes:

```ts
busy: (from, to) =>
  sql`select starts_at as start, ends_at as end, resource from bookings
      where type = ${type.id} and status = 'confirmed' and starts_at < ${to} and ends_at > ${from}`,
```

Para el tiempo propio de quien atiende (las llamadas y visitas de un asesor), toma las reservas de todos sus tipos, sin `resource`: ocupan todo su tiempo.

## Dos en el mismo segundo {#two-at-the-same-second}

El servidor revisa cada reserva contra los horarios libres como están cuando llega. Dos solicitudes por el último lugar, en el mismo instante, pueden pasar las dos esa revisión antes de que se guarde cualquiera. Deja que la base de datos le diga que no a la segunda:

```sql
-- Una reserva por recurso en cada inicio: canchas, salas.
create unique index one_at_a_time on bookings (type, resource, starts_at) where status = 'confirmed';
```

Ese índice cubre una reserva por inicio, pero no una que se encime con otra que empieza a otra hora. Para eso, dale al servidor `keep`: guarda lo reservado (o apartado) en el mismo paso en que revisa que siga libre. Si devuelve `false`, el servidor responde `taken` (`409`) y quien reserva vuelve a elegir.

`claimsOf(reserva, tipo, zonaHoraria)` da las claves que ocupa una reserva: cada asiento (o el recurso, o el tiempo de quien atiende) cada cinco minutos, o cada noche de una estancia. Con un índice único sobre ellas, dos reservas que se enciman comparten una clave y la base de datos rechaza la segunda por sí misma:

```sql
create table booking_claims (key text primary key, booking text not null references bookings(id));
```

```ts
createBookingHandler({
  keep: async (reservas, { calendar }) => {
    try {
      await db.transaction(async (tx) => {
        for (const r of reservas) {
          await tx.reservas.upsert(r);
          await tx.claves.insertarVarias(claimsOf(r, calendar.type, calendar.schedule.timeZone)!.map((key) => ({ key, booking: r.id })));
        }
      });
      return true;
    } catch (e) {
      if (esUnicoRepetido(e)) return false; // alguien la tomó hace un momento
      throw e;
    }
  },
});
```

Cuando una reserva se cancela (o vence un apartado), borra sus claves. Para lugares a la vez (una zona de 120, una guardia de dos), `claimsOf` da `null`: bloquea el horario en una transacción (`select … for update`, un advisory lock) y llama a `check()`, que vuelve a revisar los horarios como están guardados en ese momento:

```ts
keep: (reservas, { check }) => db.conCandado(`${reservas[0].type}:${reservas[0].start}`, async (tx) => (await check()) && (await tx.reservas.upsertVarias(reservas), true)),
```

## Cancelada, no borrada {#cancelled-not-deleted}

Una reserva cancelada conserva su fila con `status = 'cancelled'`: su lugar queda libre otra vez, y se sigue sabiendo qué se reservó.
