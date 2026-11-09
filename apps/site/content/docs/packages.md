# Packages

Four packages. Each stands on the engine, and on nothing else of the suite.

| Package | What it does | Runs in |
| --- | --- | --- |
| `@reboschedule/core` | The engine: hours, kinds, the times free in any time zone, resources and places, prices, the checks of a booking, iCalendar. No dependencies. | Browser and Node |
| `@reboschedule/server` | The routes of booking, as a Request to a Response, and `nodeHandler` for `node:http`. | Node, Workers, Bun |
| `@reboschedule/messages` | Short messages to a phone: SMS and WhatsApp by Twilio, WhatsApp by Meta's Cloud API with approved templates. | Node, Workers |
| `@reboschedule/payments` | Payments for what is held: Stripe's Checkout and Mercado Pago's, their notices checked by signature, refunds. | Node, Workers |
| `@reboschedule/calendars` | The owner's own calendar read as busy: a secret iCal address, Google's free/busy, Outlook's schedule. | Node, Workers, browser |
| `@reboschedule/react` | The widget; the month, the day and the panel; the editors; the list. | React 19 |

## Installing

```bash
npm install @reboschedule/core                 # the engine alone
npm install @reboschedule/server               # the routes
npm install @reboschedule/react                # the components
npm install @reboschedule/calendars            # Google, Outlook, iCal
npm install @reboschedule/payments             # Stripe, Mercado Pago
npm install @reboschedule/messages             # WhatsApp, SMS
```

## Versions

The four go together, at the same version. ReboSchedule is at 0.1: what is written here works and is tested, and may still change before 1.0. See [Status and roadmap](/docs/status/).
