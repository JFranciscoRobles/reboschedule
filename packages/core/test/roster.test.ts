import { describe, expect, it } from 'vitest';
import { assignRoster, coverBooking, type EventType, type Member, sampleEventTypes, sampleSchedule, slotsOf, swapBookings, swapProblems, turnsOf } from '../src';

const tz = 'America/Tijuana';
const schedule = sampleSchedule(tz);
const every = [
  { from: '10:00', to: '14:00' },
  { from: '14:00', to: '19:00' },
];
// The shifts of an office: two divisions, every day, a turn of 10 to 14 and one of 14 to 19, one person each.
const shift: EventType = {
  ...sampleEventTypes('es').find((t) => t.id === 'shift')!,
  hours: { 0: every, 1: every, 2: every, 3: every, 4: every, 5: every, 6: every },
  whole: true,
  duration: 60,
  increment: 60,
  capacity: 1,
  resources: [
    { id: 'res', name: 'Residencial', image: '', values: {}, price: null },
    { id: 'com', name: 'Comercial', image: '', values: {}, price: null },
  ],
};
const member = (id: string, group: string): Member => ({ id, name: id.toUpperCase(), email: `${id}@x.co`, group });
const members = [member('ana', 'res'), member('beto', 'res'), member('carla', 'res'), member('diego', 'com'), member('elena', 'com')];
const local = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' });

describe('whole turns', () => {
  it('are each stretch of the hours, as long as it is', () => {
    const slots = slotsOf(shift, schedule, { now: Date.parse('2026-11-01T08:00:00Z'), from: '2026-11-02', to: '2026-11-02' });
    expect(slots.map((s) => [local(s.start), local(s.end), s.resources])).toEqual([
      ['10:00', '14:00', ['res', 'com']],
      ['14:00', '19:00', ['res', 'com']],
    ]);
  });
});

describe('a roster', () => {
  it('has every turn of every group of the month', () => {
    expect(turnsOf(shift, schedule, '2026-11')).toHaveLength(30 * 2 * 2);
    expect(turnsOf(shift, schedule, '2026-11', '2026-11-29')).toHaveLength(2 * 2 * 2);
  });

  it('is given evenly, each group by its own, none on a day one cannot', () => {
    const { bookings, unfilled } = assignRoster({ type: shift, schedule, month: '2026-11', members, unavailable: { ana: ['2026-11-02', '2026-11-03'] } });
    expect(unfilled).toEqual([]);
    expect(bookings).toHaveLength(120);
    const of = (id: string) => bookings.filter((b) => b.member === id);
    // Sixty turns of each division: three to share them, twenty each; two, thirty each.
    expect(['ana', 'beto', 'carla'].map((id) => of(id).length)).toEqual([20, 20, 20]);
    expect(['diego', 'elena'].map((id) => of(id).length)).toEqual([30, 30]);
    expect(bookings.filter((b) => b.resource === 'res').every((b) => ['ana', 'beto', 'carla'].includes(b.member!))).toBe(true);
    expect(of('ana').some((b) => b.start.startsWith('2026-11-02') || b.start.startsWith('2026-11-03T1'))).toBe(false);
    // The mornings go round too: each of the three has about as many mornings as afternoons.
    for (const id of ['ana', 'beto', 'carla']) {
      const mornings = of(id).filter((b) => local(b.start) === '10:00').length;
      expect(Math.abs(mornings - (of(id).length - mornings))).toBeLessThanOrEqual(2);
    }
    // In residential, no one twice the same day: three of them for two turns.
    const days = of('beto').map((b) => new Date(b.start).toLocaleDateString('en-CA', { timeZone: tz }));
    expect(new Set(days).size).toBe(days.length);
  });

  it('keeps what was given, and says what no one could cover', () => {
    const first = assignRoster({ type: shift, schedule, month: '2026-11', members, from: '2026-11-30' });
    const kept = first.bookings.find((b) => b.resource === 'com')!;
    const again = assignRoster({
      type: shift,
      schedule,
      month: '2026-11',
      members: members.filter((m) => m.id !== 'elena'),
      from: '2026-11-30',
      bookings: [kept],
      unavailable: { diego: ['2026-11-30'] },
    });
    // The commercial turn given before is kept; the other one, with Diego away and Elena gone, no one covers.
    expect(again.bookings.some((b) => b.resource === 'com')).toBe(false);
    const other = turnsOf(shift, schedule, '2026-11', '2026-11-30').find((t) => t.group === 'com' && t.start !== kept.start)!;
    expect(again.unfilled).toEqual([other]);
  });
});

describe('changes between members', () => {
  const { bookings } = assignRoster({ type: shift, schedule, month: '2026-11', members, from: '2026-11-02' });
  const ana = bookings.find((b) => b.member === 'ana')!;
  const beto = bookings.find((b) => b.member === 'beto')!;

  it('swap two turns, each a new version', () => {
    const [a, b] = swapBookings(ana, beto);
    expect([a.member, b.member]).toEqual(['beto', 'ana']);
    expect([a.start, b.start]).toEqual([ana.start, beto.start]);
    expect([a.sequence, b.sequence]).toEqual([1, 1]);
  });

  it('give a turn to cover, and say why one may not', () => {
    expect(coverBooking(ana, members[2])).toMatchObject({ member: 'carla', email: 'carla@x.co', sequence: 1 });
    expect(swapProblems(ana, null, members[0], members[3])).toEqual(['other-group']);
    const day = new Date(ana.start).toLocaleDateString('en-CA', { timeZone: tz });
    expect(swapProblems(ana, null, members[0], members[1], { beto: [day] }, tz)).toEqual(['unavailable']);
    expect(swapProblems(ana, beto, members[0], members[1], {}, tz)).toEqual([]);
  });
});
