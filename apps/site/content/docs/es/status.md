# Estado y hoja de ruta

ReboSchedule está en la 0.1. Lo que dicen estas páginas funciona, tiene pruebas, y corre en los seis demos. Todavía no está en npm.

## Qué funciona {#what-works}

- Los horarios libres en cualquier zona horaria, también la noche que cambia la hora.
- Tipos con duraciones a elegir, tiempo libre alrededor, anticipación, horizonte y máximo al día; horario propio.
- Recursos con campos e imágenes; lugares a la vez; turnos.
- Precios por hora o por reserva, el propio de un recurso, y reglas propias; cotizados otra vez por el servidor y guardados en la reserva.
- Una reserva revisada otra vez al llegar; su invitación, su dirección firmada, su cancelación.
- El widget; el mes, el día y el panel; los editores; inglés y español.
- Reservas cada semana, como serie; roles de guardias asignados automáticamente o a mano, y cambios entre miembros.
- Estancias por noche o por día; personas con su propio horario, compartidas entre servicios; boletos por asiento o por zona.
- Códigos de entrada como QR, que pasan una sola vez por la puerta; llegó o no vino; reportes y todas las reservas en CSV; WhatsApp y SMS con Twilio o la Cloud API de Meta.
- Cambios y cancelaciones de quien reservó, reembolsos según cuánto falte, anticipos; códigos de descuento; lista de espera; recordatorios; reservas guardadas de una vez con un índice único o un candado; la semana; las citas escritas en el Google o el Outlook de quien atiende.
- Cobrar con Stripe, Mercado Pago o tu proveedor: el lugar apartado unos minutos mientras se paga, liberado solo si no; la sala de un cine acomodada en filas, bloques y pasillos.
- El mensaje de cada cambio, su invitación una versión nueva; el Google, Outlook o iCal de quien atiende leído como ocupado.

## Con pruebas {#tested}

Cada paquete tiene sus pruebas: el motor (zonas horarias, los horarios libres, recursos, lugares, precios, la lectura), el servidor (sus rutas, dos personas para un horario, una cancha para cada quien, una guardia de dos), y los componentes, el widget contra el servidor de verdad.

## Qué falta {#what-is-missing}

- **Enterarse al instante.** Saber de un cambio en el Google o el Outlook de quien atiende en cuanto pasa (por ahora se vuelve a leer).
- **npm.** Publicar los paquetes, y la documentación de cada prop.

## De dónde viene {#where-it-comes-from}

ReboSchedule es parte de la suite Rebo, con Rebodocs, Rebomail y ReboProfiles: cada uno un paquete que tu aplicación toma, no un servicio al que manda a su gente.
