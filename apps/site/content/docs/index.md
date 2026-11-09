# What is ReboSchedule

ReboSchedule is booking you build into your app: whoever needs an appointment, a court, a room or a shift books one of the times still free, in their own time zone and at its price; whoever looks after them sees the month and the day, the gaps still to cover, and gives, moves or frees each booking.

It is three packages that stand on one engine, and its components are drawn on hooks you can draw your own on. The engine has no DOM and no dependencies: it works out the times free from someone's hours, what is already taken and the rules of each kind of booking, in any time zone. The server checks every booking again as it comes, so two people never get the same time. The React package has the widget of whoever books, and the month, the day and the panel of whoever looks after them.

<demo name="courts" />

## What it is for

- **Appointments.** An agent who gives a first call and visits to homes, in their hours, with time kept free to get there, never two at once.
- **Things booked.** Five padel courts, five meeting rooms, desks: each booked on its own, with its picture, what it says of itself and its price.
- **Shifts.** The turns at the front desk of an office, one or several people to each, the gaps still to cover and who has which.

## What it is not

It is not a service: the bookings live in your database, the invitations go out through your email, and nothing goes to anyone else. It does not take money either: it says what a booking costs, and keeps it on the booking; charging it is your app's.

## Where to go from here

- [Getting started](/docs/getting-started/): a route on your server and the widget on a page.
- [Headless: your own UI](/docs/headless/): the same state, drawn your way.
- [Courts, rooms and shifts](/docs/resources/): booking things, and places for several.
- [The routes](/docs/server/): what the server answers, and what it tells your app.
