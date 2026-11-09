# API

What each package exports, by name. Types are in TypeScript, as the packages are written.

## @reboschedule/core

### slotsOf

`slotsOf(type, schedule, { busy, booked, length, from, to, now })`: the times free of a kind, the soonest first. Each `Slot` has `start`, `end`, `free` (places left), `resources` (those with a place) and, priced, `price`.

### slotsByDay

`slotsByDay(slots, timeZone)`: the times laid out by the days of a time zone, as a `Map` of day to slots.

### startsOn

`startsOn(type, schedule, day, minutes)`: the times a kind may start on a day, taken or not: the turns of a day.

### placeAt

`placeAt(start, slots, resource)`: the resource booked at a time free (the one asked, or the first with a place), `''` for a kind with none, `null` if the time is not free. `isFree` says the same as a yes or no.

### hoursOf

`hoursOf(schedule, day, own)`: the hours of a day, as its date says, else its weekday, in a kind's own hours if it has them.

### lengthsOf

`lengthsOf(type)` and `lengthOf(type, asked)`: the lengths a kind may be booked for, and the one asked if it has it.

### monthOf

`monthOf('2026-11')`: the days of a month as a calendar shows them, Monday first, in weeks.

### clockAt

`clockAt(ms, timeZone)`: what a clock shows at an instant: its `day`, its `minute`, its `weekday`.

### instantOf

`instantOf(day, minute, timeZone)`: the instant a clock shows a day and a minute; `null` if that minute does not exist that night.

### bookingProblems

`bookingProblems(request, type, free)`: what a request lacks, or why it may not be, as `BookingProblem` codes.

### describeBookingProblem

`describeBookingProblem(problem, locale, type)`: a problem in words, in English or Spanish.

### makeBooking

`makeBooking(request, type, now, free, quote)`: a booking made of a request that may be, at its price.

### moveBooking

`moveBooking(booking, start, type, free)`: a booking moved to another time free, or `null`.

### quoteOf

`quoteOf(type, { resource, length })`: what a booking costs by the kind's price, or the resource's own.

### priceSlots

`priceSlots(slots, type, { length, resource, quote })`: the times free, each with its price.

### priceOf

`priceOf(type, { resource, start, length }, quote)`: the price by your `Quote` if given, else by `quoteOf`.

### formatMoney

`formatMoney(money, locale)`: an amount as it is read: `$1,100 MXN`.

### icsOf

`icsOf(booking, type, organizer)`: the invitation, an iCalendar file; its cancelling when the booking is cancelled.

### googleCalendarUrl

`googleCalendarUrl(booking, type, organizer)`: the address that puts it in Google Calendar.

### readSchedule

`readSchedule(given)`, `readEventType(given)`, `readBookingRequest(given)`, `readHours`, `readPrice`, `readFields`, `readImage`: each reads what is given, keeping only what makes sense.

### planSeries

`planSeries(type, schedule, { start, repeat, length, resource, busy, now, owner })`: each time of a series, and whether it is free. `occurrencesOf` gives its times alone; `makeSeries` makes the bookings of those free. See [Every week](/docs/repeat/).

### assignRoster

`assignRoster({ type, schedule, month, members, unavailable, bookings, from })`: the turns of a month given evenly to the members of each group. `turnsOf`, `turnBooking`, `swapBookings`, `coverBooking`, `swapProblems`. See [Rosters of shifts](/docs/roster/).

### nightsOf

`nightsOf(type, schedule, { from, to, busy, now })`: each night (or day) free of a kind of stays, and the resources that have it. `stayResource`, `stayProblems`, `makeStay`, `stayTimes`, `unitsOf`. See [Rentals by the night](/docs/stays/).

### busyOfBookings

`busyOfBookings(bookings)`: bookings as what they take, each seat of them or so many places of their resource. `works(type, schedule, resource, day, from, to)` says whether a resource with its own hours works a stretch. See [People with their own hours](/docs/staff/) and [Tickets](/docs/tickets/).

### seatsOf

`seatsOf(seating)`: the seats of a room as it is laid out, a resource each, those of the premium rows at their price. `layoutOf(type)` gives each row with its blocks, to draw it; `readSeating`, `rowName`, `rowOf`. See [Tickets](/docs/tickets/#seating).

### holdBooking

`holdBooking(booking, minutes)`: a booking held while it is paid for. `confirmBooking(booking, paid)` confirms it; `takes(booking, now)` says whether it takes its place (confirmed, or held and not run out); `runOut(booking, now)` whether its minutes ran out. See [Payments](/docs/payments/).

### refundOf

`refundOf(booking, type, now)`: what cancelling now gives back. `depositOf(type, price)`, `movableUntil(booking, type)`, `withCoupon(booking, type, schedule, coupon)`, `discountOf`, `couponFits`, `remindersDue(bookings, now, hours)`, `claimsOf(booking, type, timeZone)`, `readWaiting`, `offerOf`. See [Changes and refunds](/docs/policies/), [Discount codes](/docs/coupons/), [Waitlist](/docs/waitlist/).

### checkIn

`checkIn(booking, now, timeZone)`: let in once, or refused and why; `describeEntry`, `markAttendance`. `reportOf(bookings, types, schedule, { from, to })`, `bookingsCsv`, `lastDays`. `shortOf(notice, type, organizer, { phone, link })`, `phoneOf`, `phoneOfBooking`. See [Entry](/docs/checkin/), [Reports](/docs/reports/), [WhatsApp and SMS](/docs/messages/).

### noticeOf

`noticeOf(kind, booking, type, organizer, { locale, manage, before })`: the message to send whoever booked, its invitation as it is now. `changeOf`, `changeBooking`, `cancelBooking`. See [Telling whoever booked](/docs/notices/).

### courtPicture

`courtPicture({ color, covered })` and `roomPicture(people, color)`: pictures to start from, as data.

### sampleSchedule

`sampleSchedule(timeZone)` and `sampleEventTypes(locale)`: hours and kinds to start from and try things with.

### Types

`Schedule`, `Hours`, `Weekday`, `EventType`, `Place`, `Question`, `Resource`, `ResourceField`, `Price`, `Money`, `Quote`, `Busy`, `Slot`, `Booking`, `Seating`, `RefundRule`, `Coupon`, `Waiting`, `Offer`, `Notice`, `Entry`, `Report`, `ShortMessage`, `BookingRequest`, `BookingProblem`, `Organizer`, `Day`, `Locale`.

## @reboschedule/server

### createBookingHandler

`createBookingHandler(options)`: the routes of booking, a function from a `Request` to a `Response`. See [The routes](/docs/server/). The function also has `addresses(booking)`, `reminder(booking, calendar)`, `offer(calendar, start)`, `ticketOf(booking)` and `readTicket(code)`, for your cron and your door.

### nodeHandler

`nodeHandler(handle)`: the same, for `node:http` and Express.

### publicType

`publicType(type)`: a kind as anyone may see it: all but where it is.

### Payments

`Payments` and `Charge`: what the server needs of whoever takes payments. See [Payments](/docs/payments/#own).

## @reboschedule/payments

### stripePayments

`stripePayments({ secretKey, webhookSecret })`: payments by Stripe Checkout; its webhook's signature checked, its payment intent refunded.

### mercadoPagoPayments

`mercadoPagoPayments({ accessToken, webhookSecret })`: payments by Mercado Pago's Checkout Pro; its signature (`x-signature`) checked, the payment asked of its API, and refunded.

## @reboschedule/calendars

### icsBusy

`icsBusy(text, { from, to, timeZone })` and `fetchIcsBusy(address, …)`: what is busy in a calendar given as iCalendar. See [Google, Outlook and iCal](/docs/calendars/).

### googleBusy

`googleBusy({ accessToken, calendars, from, to })`: Google Calendar's free/busy.

### outlookBusy

`outlookBusy({ accessToken, schedules, from, to })`: Outlook's schedule.

### googleWriter

`googleWriter({ accessToken, calendar })` and `outlookWriter(…)`: each booking written in the owner's calendar, taken out when cancelled. See [Google, Outlook and iCal](/docs/calendars/#writing).

### cachedBusy

`cachedBusy(read, ms)` and `combineBusy(...reads)`: read less often, and several as one.

## @reboschedule/messages

### twilioMessenger

`twilioMessenger({ accountSid, authToken, from, channel, templates })`: SMS or WhatsApp by Twilio; a template's Content SID when it has one. See [WhatsApp and SMS](/docs/messages/).

### whatsAppCloudMessenger

`whatsAppCloudMessenger({ accessToken, phoneNumberId, templates, language })`: WhatsApp by Meta's Cloud API, with its approved templates.

## @reboschedule/react

### BookingWidget

The widget of whoever books. See [The booking widget](/docs/widget/).

### BookingCalendar

The month, with its turns, bookings and gaps. See [Month, day and panel](/docs/calendar/).

### BookingDay

One day, a column for each resource or place.

### BookingWeek

The week, a column for each day. See [Components](/docs/components/#bookingweek).

### BookingPanel

To give a gap, change who has a booking, move it or delete it, and mark whether they came.

### ScheduleEditor

The owner's hours. See [The editors](/docs/editors/).

### EventTypeEditor

A kind of booking, all of it.

### BookingList

What is booked, the coming ones first.

### useBooking

`useBooking({ endpoint, timeZone, onBooked, fetch })`: the state of the widget, to draw one of your own. See [Headless](/docs/headless/#usebooking).

### useMonth

`useMonth({ bookings, types, schedule, type, slots, now })`: the month, its days, turns and gaps.

### useDay

`useDay({ bookings, types, schedule, type, slots, now, day, onDay })`: the day, its columns, rows and blocks.

### useWeek

`useWeek({ bookings, types, schedule, type, slots, now, day, onDay })`: the week, its days, rows and blocks, side by side when they overlap.

### useStay

`useStay({ endpoint, onBooked, fetch })`: a stay, its nights, arrival, departure and total. See [Rentals by the night](/docs/stays/#headless).

### useManage

`useManage({ address, timeZone, fetch })`: a booking from its own address, to move or cancel it. See [Changes and refunds](/docs/policies/#hooks).

### valuesOf

`valuesOf(type, resource)`: what a resource says of itself, in words.

### WORDS

The words of the components, in English and Spanish.
