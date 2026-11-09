# Components and hooks

Every component of `@reboschedule/react`, with every prop, and the hooks they are drawn on.

## BookingWidget

| Prop | Type | What it is |
| --- | --- | --- |
| `endpoint` | `string` | Where the routes of one kind are. |
| `locale` | `'en' \| 'es'` | English unless said. |
| `timeZone` | `string` | Of whoever books; their browser's unless said. |
| `onBooked` | `(booked: Booked) => void` | Each booking made. |
| `fetch` | `typeof fetch` | A fetch of your own. |
| `className` | `string` | On its root. |

## BookingCalendar

| Prop | Type | What it is |
| --- | --- | --- |
| `bookings` · `types` · `schedule` | | What is booked, the kinds, the owner's hours. |
| `type` | `string` | The id of the kind shown; all unless said. |
| `slots` | `Slot[]` | The times free of that kind: the gaps. |
| `onPick` | `(slot) => void` | A gap chosen. |
| `onSelect` | `(booking) => void` | A booking clicked. |
| `onDay` | `(day) => void` | A day's number clicked. |
| `selected` · `moving` | `string` · `boolean` | The booking marked; whether one is being moved. |
| `locale` · `now` · `className` | | |

## BookingDay

The props of `BookingCalendar`, and `day` (the day shown) and `onDay` (told as it changes). Its `onPick` gets the slot of the very column clicked: `resources` is that one.

## BookingWeek {#bookingweek}

The week, Monday first: a column for each day, the hours down the side, each booking a block as long as it lasts (those that overlap, side by side), each gap a `+` to give. The same props as `BookingDay`; `useWeek` is its hook.

## BookingPanel

| Prop | Type | What it is |
| --- | --- | --- |
| `type` | `EventType` | The kind. |
| `booking` · `slot` | | A booking to change, or a gap to give. |
| `timeZone` | `string` | The owner's. |
| `moving` · `onMove` | | Whether it is being moved, and told so. |
| `onSave` | `(details) => string[] \| undefined` | What was written; the problems, if any. |
| `onDelete` · `onClose` | | Deleted once it was said so; closed. |
| `onAttend` | | Marked as came or did not come (`null`, unmarked); given, both buttons show from the day of it. |

## ScheduleEditor and EventTypeEditor

| Prop | Type | What it is |
| --- | --- | --- |
| `schedule` / `type` | | What is written. |
| `onChange` | | The whole of it, at each change. |
| `locale` · `className` | | |

## BookingList

`bookings`, `types`, `timeZone`, `locale`, `now`, `className`.

## Hooks

| Hook | What it gives | See |
| --- | --- | --- |
| `useBooking(options)` | The widget's state: times, choices, the booking. | [Headless](/docs/headless/#usebooking) |
| `useMonth(options)` | The month: its days, turns and gaps. | [Headless](/docs/headless/#usemonth) |
| `useDay(options)` | The day: columns, rows and blocks. | [Headless](/docs/headless/#useday) |
| `useStay(options)` | A stay: the nights free, the arrival and the departure, the cabin that has them, the total. | [Rentals by the night](/docs/stays/#headless) |
| `useWeek(options)` | The week: its days, rows and blocks, side by side when they overlap. | [BookingWeek](#bookingweek) |
| `useManage(options)` | A booking from its own address: move it, cancel it, what is given back. | [Changes and refunds](/docs/policies/#hooks) |

`valuesOf(type, resource)` says what a resource says of itself, in words, as the cards show it.
