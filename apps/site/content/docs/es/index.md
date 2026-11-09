# Qué es ReboSchedule

ReboSchedule son las reservas que integras en tu aplicación: quien necesita una cita, una cancha, una sala o una guardia reserva uno de los horarios libres, en su propia zona horaria y a su precio; quien las atiende ve el mes y el día, los huecos por cubrir, y aparta, mueve o libera cada reserva.

Son tres paquetes que se apoyan en un mismo motor, y sus componentes están hechos sobre hooks con los que puedes dibujar los tuyos. El motor no usa el DOM ni tiene dependencias: calcula los horarios libres a partir del horario de alguien, lo que ya está ocupado y las reglas de cada tipo de reserva, en cualquier zona horaria. El servidor revisa otra vez cada reserva al llegar, así que dos personas nunca se quedan con el mismo horario. El paquete de React trae el widget de quien reserva, y el mes, el día y el panel de quien atiende.

<demo name="courts" />

## Para qué sirve {#what-it-is-for}

- **Citas.** Un asesor que da una primera llamada y visitas a propiedades, en su horario, con tiempo libre para llegar, nunca dos a la vez.
- **Cosas que se reservan.** Cinco canchas de pádel, cinco salas de juntas, escritorios: cada una por separado, con su imagen, lo que dice de sí misma y su precio.
- **Guardias.** Los turnos en recepción de una oficina, una o varias personas en cada uno, los huecos por cubrir y quién tiene cuál.

## Qué no es {#what-it-is-not}

No es un servicio: las reservas viven en tu base de datos, las invitaciones salen por tu correo, y nada va a nadie más. Tampoco cobra: dice cuánto cuesta una reserva y lo guarda en ella; cobrarlo es cosa de tu aplicación.

## Por dónde seguir {#where-to-go-from-here}

- [Primeros pasos](/docs/getting-started/): una ruta en tu servidor y el widget en una página.
- [Headless: tu propia interfaz](/docs/headless/): el mismo estado, dibujado a tu manera.
- [Canchas, salas y guardias](/docs/resources/): reservar cosas, y lugares para varios.
- [Las rutas](/docs/server/): qué responde el servidor, y qué le dice a tu aplicación.
