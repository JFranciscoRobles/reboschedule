# API

Lo que exporta cada paquete, por su nombre. Los tipos están en TypeScript, como están escritos los paquetes.

## @reboschedule/core

### slotsOf

`slotsOf(type, schedule, { busy, booked, length, from, to, now })`: los horarios libres de un tipo, los más próximos primero. Cada `Slot` tiene `start`, `end`, `free` (lugares que quedan), `resources` (los que tienen lugar) y, con precio, `price`.

### slotsByDay

`slotsByDay(slots, timeZone)`: los horarios acomodados en los días de una zona horaria, como un `Map` de día a horarios.

### startsOn

`startsOn(type, schedule, day, minutes)`: los horarios en que un tipo puede empezar un día, ocupados o no: los turnos de un día.

### placeAt

`placeAt(start, slots, resource)`: el recurso que se reserva en un horario libre (el pedido, o el primero con lugar), `''` para un tipo sin recursos, `null` si el horario no está libre. `isFree` dice lo mismo como un sí o no.

### hoursOf

`hoursOf(schedule, day, own)`: el horario de un día, como dice su fecha, si no su día de la semana, en el horario propio de un tipo si lo tiene.

### lengthsOf

`lengthsOf(type)` y `lengthOf(type, asked)`: las duraciones por las que se puede reservar un tipo, y la pedida si la tiene.

### monthOf

`monthOf('2026-11')`: los días de un mes como los muestra un calendario, lunes primero, en semanas.

### clockAt

`clockAt(ms, timeZone)`: lo que marca un reloj en un instante: su `day`, su `minute`, su `weekday`.

### instantOf

`instantOf(day, minute, timeZone)`: el instante en que un reloj marca un día y un minuto; `null` si ese minuto no existe esa noche.

### bookingProblems

`bookingProblems(request, type, free)`: lo que le falta a una solicitud, o por qué no puede ser, como códigos `BookingProblem`.

### describeBookingProblem

`describeBookingProblem(problem, locale, type)`: un problema en palabras, en inglés o español.

### makeBooking

`makeBooking(request, type, now, free, quote)`: una reserva hecha de una solicitud que puede ser, a su precio.

### moveBooking

`moveBooking(booking, start, type, free)`: una reserva movida a otro horario libre, o `null`.

### quoteOf

`quoteOf(type, { resource, length })`: cuánto cuesta una reserva según el precio del tipo, o el propio del recurso.

### priceSlots

`priceSlots(slots, type, { length, resource, quote })`: los horarios libres, cada uno con su precio.

### priceOf

`priceOf(type, { resource, start, length }, quote)`: el precio según tu `Quote` si lo das, si no según `quoteOf`.

### formatMoney

`formatMoney(money, locale)`: un monto como se lee: `$1,100 MXN`.

### icsOf

`icsOf(booking, type, organizer)`: la invitación, un archivo iCalendar; su cancelación cuando la reserva se cancela.

### googleCalendarUrl

`googleCalendarUrl(booking, type, organizer)`: la dirección que la pone en Google Calendar.

### readSchedule

`readSchedule(given)`, `readEventType(given)`, `readBookingRequest(given)`, `readHours`, `readPrice`, `readFields`, `readImage`: cada uno lee lo que se le da, y solo conserva lo que tiene sentido.

### planSeries

`planSeries(type, schedule, { start, repeat, length, resource, busy, now, owner })`: cada horario de una serie, y si está libre. `occurrencesOf` da solo sus horarios; `makeSeries` hace las reservas de los libres. Ve [Cada semana](/docs/repeat/).

### assignRoster

`assignRoster({ type, schedule, month, members, unavailable, bookings, from })`: los turnos de un mes repartidos parejo entre los miembros de cada grupo. `turnsOf`, `turnBooking`, `swapBookings`, `coverBooking`, `swapProblems`. Ve [Roles de guardias](/docs/roster/).

### nightsOf

`nightsOf(type, schedule, { from, to, busy, now })`: cada noche (o día) libre de un tipo de estancias, y los recursos que la tienen. `stayResource`, `stayProblems`, `makeStay`, `stayTimes`, `unitsOf`. Ve [Rentas por noche](/docs/stays/).

### busyOfBookings

`busyOfBookings(bookings)`: las reservas como lo que ocupan, cada asiento o tantos lugares de su recurso. `works(type, schedule, resource, day, from, to)` dice si un recurso con su propio horario trabaja en un tramo. Ve [Personas con su horario](/docs/staff/) y [Boletos](/docs/tickets/).

### seatsOf

`seatsOf(seating)`: los asientos de una sala acomodada, un recurso cada uno, los de las filas preferentes a su precio. `layoutOf(type)` da cada fila con sus bloques para dibujarla; `readSeating`, `rowName`, `rowOf`. Ve [Boletos](/docs/tickets/#seating).

### holdBooking

`holdBooking(booking, minutes)`: una reserva apartada mientras se paga. `confirmBooking(booking, paid)` la confirma; `takes(booking, now)` dice si ocupa su lugar (confirmada, o apartada y vigente); `runOut(booking, now)` dice si se le acabó el tiempo. Ve [Cobrar](/docs/payments/).

### refundOf

`refundOf(booking, type, now)`: lo que devolvería cancelar ahora. `depositOf(type, price)`, `movableUntil(booking, type)`, `withCoupon(booking, type, schedule, coupon)`, `discountOf`, `couponFits`, `remindersDue(bookings, now, hours)`, `claimsOf(booking, type, timeZone)`, `readWaiting`, `offerOf`. Ve [Cambios y reembolsos](/docs/policies/), [Códigos de descuento](/docs/coupons/), [Lista de espera](/docs/waitlist/).

### checkIn

`checkIn(booking, now, timeZone)`: deja entrar una sola vez, o rechaza y dice por qué; `describeEntry`, `markAttendance`. `reportOf(bookings, types, schedule, { from, to })`, `bookingsCsv`, `lastDays`. `shortOf(notice, type, organizer, { phone, link })`, `phoneOf`, `phoneOfBooking`. Ve [Entrada](/docs/checkin/), [Reportes](/docs/reports/), [WhatsApp y SMS](/docs/messages/).

### noticeOf

`noticeOf(kind, booking, type, organizer, { locale, manage, before })`: el mensaje para quien reservó, con su invitación como está ahora. `changeOf`, `changeBooking`, `cancelBooking`. Ve [Avisar a quien reservó](/docs/notices/).

### courtPicture

`courtPicture({ color, covered })` y `roomPicture(people, color)`: imágenes para empezar, como datos.

### sampleSchedule

`sampleSchedule(timeZone)` y `sampleEventTypes(locale)`: horario y tipos para empezar y para probar.

### Tipos {#types}

`Schedule`, `Hours`, `Weekday`, `EventType`, `Place`, `Question`, `Resource`, `ResourceField`, `Price`, `Money`, `Quote`, `Busy`, `Slot`, `Booking`, `Seating`, `RefundRule`, `Coupon`, `Waiting`, `Offer`, `Notice`, `Entry`, `Report`, `ShortMessage`, `BookingRequest`, `BookingProblem`, `Organizer`, `Day`, `Locale`.

## @reboschedule/server

### createBookingHandler

`createBookingHandler(options)`: las rutas de reserva, una función de un `Request` a un `Response`. Ve [Las rutas](/docs/server/). La función también tiene `addresses(booking)`, `reminder(booking, calendar)`, `offer(calendar, start)`, `ticketOf(booking)` y `readTicket(code)`, para tu cron y tu puerta.

### nodeHandler

`nodeHandler(handle)`: lo mismo, para `node:http` y Express.

### publicType

`publicType(type)`: un tipo como cualquiera puede verlo: todo menos dónde es.

### Payments

`Payments` y `Charge`: lo que el servidor necesita de quien cobra. Ve [Cobrar](/docs/payments/#own).

## @reboschedule/payments

### stripePayments

`stripePayments({ secretKey, webhookSecret })`: cobra con Checkout de Stripe; revisa la firma de su webhook y reembolsa su payment intent.

### mercadoPagoPayments

`mercadoPagoPayments({ accessToken, webhookSecret })`: cobra con Checkout Pro de Mercado Pago; revisa la firma (`x-signature`), consulta el pago y lo reembolsa.

## @reboschedule/calendars

### icsBusy

`icsBusy(text, { from, to, timeZone })` y `fetchIcsBusy(direccion, …)`: lo ocupado de un calendario dado como iCalendar. Ve [Google, Outlook e iCal](/docs/calendars/).

### googleBusy

`googleBusy({ accessToken, calendars, from, to })`: el free/busy de Google Calendar.

### outlookBusy

`outlookBusy({ accessToken, schedules, from, to })`: la agenda de Outlook.

### googleWriter

`googleWriter({ accessToken, calendar })` y `outlookWriter(…)`: cada reserva escrita en el calendario de quien atiende, y quitada al cancelarse. Ve [Google, Outlook e iCal](/docs/calendars/#writing).

### cachedBusy

`cachedBusy(read, ms)` y `combineBusy(...reads)`: leer menos seguido, y varios como uno.

## @reboschedule/messages

### twilioMessenger

`twilioMessenger({ accountSid, authToken, from, channel, templates })`: SMS o WhatsApp con Twilio; con el Content SID de una plantilla cuando la tiene. Ve [WhatsApp y SMS](/docs/messages/).

### whatsAppCloudMessenger

`whatsAppCloudMessenger({ accessToken, phoneNumberId, templates, language })`: WhatsApp con la Cloud API de Meta, con sus plantillas aprobadas.

## @reboschedule/react

### BookingWidget

El widget de quien reserva. Ve [El widget de reserva](/docs/widget/).

### BookingCalendar

El mes, con sus turnos, reservas y huecos. Ve [Mes, día y panel](/docs/calendar/).

### BookingDay

Un día, una columna por recurso o lugar.

### BookingWeek

La semana, una columna por día. Ve [Componentes](/docs/components/#bookingweek).

### BookingPanel

Para apartar un hueco, cambiar quién tiene una reserva, moverla o eliminarla.

### ScheduleEditor

El horario de quien atiende. Ve [Los editores](/docs/editors/).

### EventTypeEditor

Un tipo de reserva, completo.

### BookingList

Lo reservado, las próximas primero.

### useBooking

`useBooking({ endpoint, timeZone, onBooked, fetch })`: el estado del widget, para dibujar uno propio. Ve [Headless](/docs/headless/#usebooking).

### useMonth

`useMonth({ bookings, types, schedule, type, slots, now })`: el mes, sus días, turnos y huecos.

### useDay

`useDay({ bookings, types, schedule, type, slots, now, day, onDay })`: el día, sus columnas, filas y bloques.

### useWeek

`useWeek({ bookings, types, schedule, type, slots, now, day, onDay })`: la semana, sus días, filas y bloques, lado a lado cuando se enciman.

### useStay

`useStay({ endpoint, onBooked, fetch })`: una estancia, sus noches, llegada, salida y total. Ve [Rentas por noche](/docs/stays/#headless).

### useManage

`useManage({ address, timeZone, fetch })`: una reserva desde su dirección, para cambiarla o cancelarla. Ve [Cambios y reembolsos](/docs/policies/#hooks).

### valuesOf

`valuesOf(type, resource)`: lo que un recurso dice de sí mismo, en palabras.

### WORDS

Las palabras de los componentes, en inglés y español.
