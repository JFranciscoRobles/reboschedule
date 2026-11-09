# Demos para correr

Nueve casos de uso, cada uno con sus dos lados, corren en este sitio sin servidor: el mismo motor calcula los horarios libres en la página, y lo que reserves se guarda en tu navegador. En el repositorio, el playground los corre contra el servidor de verdad.

## En este sitio {#on-this-site}

| Demo | Quien reserva | Quien atiende |
| --- | --- | --- |
| [Citas de un asesor](/demos/appointments/) | Una llamada o una visita, con tiempo libre alrededor | El mes y el día de Laura |
| [Canchas deportivas](/demos/courts/) | Una cancha, por cuánto tiempo, a su precio | El día del club, una columna por cancha |
| [Salas de juntas](/demos/rooms/) | Una sala según cuántos caben | El día de la oficina |
| [Guardias](/demos/shifts/) | Sus guardias, los días que no puede, cambios con un compañero | El rol del mes, asignado automático o a mano |
| [Clases semanales](/demos/classes/) | Una clase, una vez o cada semana | Cada clase y quién viene |
| [Consultorio](/demos/clinic/) | Una consulta, en cuatro pasos | El día de la doctora, con su Google rayado |
| [Cabañas](/demos/cabins/) | Una cabaña, del día que llega al que se va | Una tira de cuatro semanas, una fila por cabaña |
| [Barbería](/demos/barber/) | Un servicio, con un barbero o el primero libre | El día, una columna por barbero, sus horas libres rayadas |
| [Taquilla](/demos/tickets/) | Asientos de una función, o boletos de una zona | Cada función, qué tan llena, quién está en cada asiento |

Cada uno tiene también sus ajustes: agrega un campo a las canchas, sube una imagen, cambia un precio, y vuelve al lado de quien reserva.

Además de los dos lados, cada demo tiene **Avisos** (el correo que le llegaría a quien reservó, su QR si lo hay y su versión por WhatsApp, con "Abrir mi reserva" para cambiarla o cancelarla) y **Reportes** (ingresos, ocupación, faltas, códigos y el CSV de todas las reservas).

## Qué probar {#what-to-try}

| Demo | Prueba |
| --- | --- |
| Taquilla | Compra con `MARTES2X1` en una función de martes: paga en el checkout de prueba, mira tu QR, y en la taquilla, **Entrada**, escanéalo dos veces. Anótate en la lista de espera de una noche de jazz llena. **Configurar la sala** cambia filas, bloques y filas preferentes. |
| Cabañas | Reserva con `BOSQUE10`: hoy se paga el 30 % y el resto al llegar. Desde "Cambiar fechas o cancelar", mira cuánto se devuelve según cuánto falte. |
| Barbería | Deja tu WhatsApp al reservar y mira el aviso en **Avisos**. Usa `PRIMERA`. En la barbería, marca **Llegó** o **No vino**, y mira la **Semana**. |
| Todas | Lo apartado se ve a rayas del lado de quien atiende hasta que se paga o vence. |

## Nueve diseños, un estado {#four-designs-one-state}

El lado de quien reserva está dibujado distinto en cada uno, sin nada del aspecto del paquete: cada uno es [`useBooking`](/docs/headless/) y Tailwind. Un interruptor arriba de cada uno muestra el mismo demo con el widget del paquete, para ver que son un mismo estado.

| Demo | Su diseño |
| --- | --- |
| Citas | Un concierge: crema y serif, los tipos como tarjetas grandes, los días como una tira, la cita al lado. |
| Canchas | El tablero de un club: oscuro y verde lima, cada cancha una columna y cada horario una fila, cada celda libre una cancha para tomar. |
| Salas | Un buscador de oficina: cuántos van, las salas en que caben, el día de la sala como una línea de tramos libres. |
| Guardias | Amarillo y negro: las guardias del asesor, los cambios que le piden, los días que no puede. |
| Clases | Un estudio: rosa y salvia, los lugares como puntos, una vez o cada semana. |
| Consultorio | Un recorrido de cuatro pasos: el motivo, el día, la hora, los datos. |
| Cabañas | Un hospedaje en el bosque: papel crema y verde, las cabañas con su foto, la llegada y la salida en el mes. Es [`useStay`](/docs/stays/). |
| Barbería | Negro y latón: el servicio, el barbero con los días que viene, la tira de días. |
| Taquilla | La sala oscura: los carteles, las funciones, la sala asiento por asiento; las zonas y cuántos boletos. |
| Cabañas | Un hospedaje en el bosque: papel crema y verde, las cabañas con su foto, la llegada y la salida en el mes. Es [`useStay`](/docs/stays/). |
| Barbería | Negro y latón: el servicio, el barbero con los días que viene, la tira de días. |
| Taquilla | La sala oscura: los carteles, las funciones, la sala asiento por asiento; las zonas y cuántos boletos. |

Su código está en el repositorio, en `apps/site/components/designs`.

## En el repositorio {#in-the-repository}

```bash
git clone https://github.com/JFranciscoRobles/reboschedule
cd reboschedule
npm install
npm run dev      # el playground, en http://localhost:5320
npm run site     # este sitio, en http://localhost:5321
npm test         # todas las pruebas de los tres paquetes
```

El playground es una página con todo: quien reserva, el horario, los tipos, el calendario con el panel, las reservas. Su servidor es el mismo `createBookingHandler`, con las reservas en memoria mientras corre.
