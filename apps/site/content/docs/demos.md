# Demos to run

Nine cases of use, each with both of its sides, run in this site with no server: the same engine works out the times free in the page, and what you book is kept in your browser. In the repository, the playground runs them against the real server.

## On this site

| Demo | Whoever books | Whoever looks after it |
| --- | --- | --- |
| [An agent's appointments](/demos/appointments/) | A call or a visit, with time kept free around it | Laura's month and day |
| [Sports courts](/demos/courts/) | A court, for how long, at its price | The club's day, a column for each court |
| [Meeting rooms](/demos/rooms/) | A room by how many it holds | The office's day |
| [Shifts](/demos/shifts/) | Their turns, the days they cannot, changes with a colleague | The month's roster, given automatically or by hand |
| [Weekly classes](/demos/classes/) | A class, once or every week | Each class and who comes |
| [A clinic](/demos/clinic/) | A consultation, in four steps | The doctor's day, her Google striped in it |
| [Cabins](/demos/cabins/) | A cabin, from the day they arrive to the day they leave | A strip of four weeks, a row per cabin |
| [A barbershop](/demos/barber/) | A service, with a barber or the first free | The day, a column per barber, his hours off striped |
| [Box office](/demos/tickets/) | Seats of a show, or tickets of a zone | Each show, how full, who sits where |

Each has its settings too: add a field to the courts, upload a picture, change a price, and go back to the side of whoever books.

Besides the two sides, each demo has **Messages** (the email whoever booked would get, its QR when there is one and its WhatsApp version, with "Open my booking" to change or cancel it) and **Reports** (what came in, how full, no-shows, codes, and the CSV of every booking).

## What to try {#what-to-try}

| Demo | Try |
| --- | --- |
| Box office | Buy with `MARTES2X1` on a Tuesday show: pay in the test checkout, see your QR, and at the box office, **The door**, scan it twice. Join the waitlist of a full jazz night. **Lay out the room** changes rows, blocks and premium rows. |
| Cabins | Book with `BOSQUE10`: 30% is paid today and the rest on arrival. From "Change dates or cancel", see how much comes back by how long before. |
| Barbershop | Leave your WhatsApp when booking and see the message in **Messages**. Use `PRIMERA`. As the shop, mark **Came** or **Did not come**, and look at the **Week**. |
| All | What is held shows striped on the owner's side until it is paid or runs out. |

## Nine designs, one state {#four-designs-one-state}

The side of whoever books is drawn differently in each, with nothing of the package's look: each is [`useBooking`](/docs/headless/) and Tailwind. A switch above each shows the same demo with the package's widget, to see they are one state.

| Demo | Its design |
| --- | --- |
| Appointments | A concierge: cream and serif, the kinds as large cards, the days as a strip, the appointment beside them. |
| Courts | A club's board: dark and lime, every court a column and every time a row, each free cell a court to take. |
| Rooms | An office finder: how many are coming, the rooms they fit in, the room's day as a line of free stretches. |
| Shifts | Yellow and black: the agent's own turns, the changes asked of them, the days they cannot. |
| Classes | A studio: rose and sage, the places left as dots, once or every week. |
| Clinic | A walk of four steps: the reason, the day, the hour, the details. |
| Cabins | A lodge in the woods: cream paper and green, the cabins with their picture, the arrival and the departure on the month. It is [`useStay`](/docs/stays/). |
| Barbershop | Black and brass: the service, the barber with the days he comes, the strip of days. |
| Box office | The dark room: the posters, the shows, the room seat by seat; the zones and how many tickets. |

Their code is in the repository, in `apps/site/components/designs`.

## In the repository

```bash
git clone https://github.com/JFranciscoRobles/reboschedule
cd reboschedule
npm install
npm run dev      # the playground, on http://localhost:5320
npm run site     # this site, on http://localhost:5321
npm test         # every test of the three packages
```

The playground is one page with everything: whoever books, the hours, the kinds, the calendar with the panel, the bookings. Its server is `createBookingHandler` itself, its bookings kept in memory while it runs.
