# Hours and time zones

The owner's hours (`Schedule`) are said as their clock says them, in their time zone: the stretches of each day of the week, and the days that are not as the week says. Whoever books sees the same times in theirs.

<demo name="slots" />

## A schedule

```ts
const schedule: Schedule = {
  timeZone: 'America/Tijuana',
  weekly: {
    0: [],                                     // Sunday, a day off
    1: [{ from: '09:00', to: '13:00' }, { from: '15:00', to: '18:00' }],
    // … 2 to 5 as Monday
    6: [{ from: '10:00', to: '13:00' }],       // Saturday morning
  },
  dates: {
    '2026-12-25': [],                          // closed
    '2026-12-19': [{ from: '10:00', to: '14:00' }],
  },
};
```

Days of the week go as `Date` counts them, Sunday 0. A stretch may end at `24:00`. `readSchedule` sorts the stretches, drops those that overlap or a clock cannot show, and takes UTC for a time zone the system does not know.

## Time zones

The engine uses nothing but `Intl`. `clockAt(ms, timeZone)` says what a clock shows at an instant; `instantOf(day, minute, timeZone)` says the instant a clock shows a day and a minute, and says none for a minute that does not exist that night, when the clocks go forward. Such a time is never offered.

`slotsByDay(slots, timeZone)` lays the times free out by the days of whoever books: the afternoon in Tijuana is the next morning in Madrid, and is shown on that day.

## Hours of a kind's own

A kind can have its own hours instead of the owner's: a court open every day from 7 to 22, the rooms on weekdays only. The owner's days that are not as the week still close it: a holiday closes everything.

```ts
const court = { ...type, hours: { 0: [{ from: '08:00', to: '20:00' }], 1: [{ from: '07:00', to: '22:00' }], /* … */ } };
```

<demo name="hours" />
