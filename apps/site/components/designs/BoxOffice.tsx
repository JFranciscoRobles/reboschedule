'use client';

// A box office as a cinema's page has it: dark, red velvet, the posters.
// The film, its shows by day, and the room drawn seat by seat, those taken
// greyed, the dearer rows gold, the seats chosen and their total; the jazz
// night, its Saturdays, a zone and how many tickets. Each a kind: the
// film's seats are its resources, one place each; the night's zones are
// its own, so many places each. Nothing of ReboSchedule's look: `useBooking`.

import { type EventType, formatMoney, layoutOf } from '@reboschedule/core';
import { useBooking } from '@reboschedule/react';
import { useEffect, useState } from 'react';
import { Checkout, said } from './Checkout';
import { ManageBooking } from './ManageBooking';
import { Qr } from './Qr';
import { CouponField, type DesignProps, empty, endpointOf, Fields, type Filled, formats, told } from './shared';

export function BoxOffice(props: DesignProps) {
  const { types, posters = {} } = props.store.data;
  const [chosen, setChosen] = useState(types[0].id);
  return (
    <div className="rounded-[22px] bg-[#0b0b10] p-5 text-[#ece7e1] sm:p-7">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.35em] text-[#ef4444]">{props.store.data.organizer.name}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-[420px]">
        {types.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={chosen === t.id}
            onClick={() => setChosen(t.id)}
            className="cursor-pointer overflow-hidden rounded-xl border-2 border-transparent text-left opacity-60 transition hover:opacity-90 aria-pressed:border-[#ef4444] aria-pressed:opacity-100"
          >
            {/* biome-ignore lint/performance/noImgElement: the poster, as data. */}
            {posters[t.id] && <img src={posters[t.id]} alt="" className="block aspect-[240/150] w-full object-cover object-top" />}
            <span className="block bg-[#16161d] px-3 py-2 text-sm font-bold">{t.title}</span>
          </button>
        ))}
      </div>
      {types.find((t) => t.id === chosen)!.seating ? <Seats key={chosen} {...props} id={chosen} /> : <Zones key={chosen} {...props} id={chosen} />}
    </div>
  );
}

const typeOf = (types: EventType[], id: string) => types.find((x) => x.id === id)!;

/** A show's room, seat by seat. */
function Seats({ store, locale, onBooked, id }: DesignProps & { id: string }) {
  const es = locale === 'es';
  const b = useBooking({ endpoint: endpointOf(typeOf(store.data.types, id)), fetch: store.fetch, onBooked: told(onBooked) });
  const [seats, setSeats] = useState<string[]>([]);
  const [form, setForm] = useState<Filled>(empty);
  const [waitFor, setWaitFor] = useState<string | null>(null);
  const [many, setMany] = useState(2);
  const [managing, setManaging] = useState<string | null>(null);
  const f = formats(locale, b.timeZone);
  if (b.status !== 'ready' || !b.type) return <div className="mt-6 h-[420px] animate-pulse rounded-xl bg-[#16161d]" />;
  const t = b.type;
  const priceOf = (seat: string) => t.resources.find((r) => r.id === seat)?.price ?? t.price?.amount ?? 0;
  const off = b.slot ? b.discountFor(seats.map(priceOf), b.slot.start) : 0;
  const total = seats.reduce((n, s) => n + priceOf(s), 0) - off;
  // The shows of the next days: those with seats, and those sold out, to wait for one.
  const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: b.timeZone });
  const shows = [...[...b.days.values()].flat().map((s) => ({ start: s.start, slot: s as typeof s | null })), ...b.full.map((start) => ({ start, slot: null }))].sort((x, y) =>
    x.start.localeCompare(y.start),
  );
  const byDay = [...new Set(shows.map((x) => dayOf(x.start)))].slice(0, 4).map((day) => [day, shows.filter((x) => dayOf(x.start) === day)] as const);
  const premium = Object.keys(t.seating?.prices ?? {});
  const byId = new Map(t.resources.map((r) => [r.id, r]));
  const free = new Set(b.slot?.resources ?? []);
  const pick = (slot: NonNullable<typeof b.slot>) => {
    b.choose(slot);
    setSeats([]);
  };

  if (b.booked)
    return (
      <div className="mt-6 rounded-xl border border-dashed border-[#ef4444] p-6 text-center">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.3em] text-[#ef4444]">{es ? 'Tus boletos' : 'Your tickets'}</p>
        <p className="m-0 mt-2 text-2xl font-black">{(b.booked.booking.seats ?? []).join(' · ')}</p>
        {b.booked.ticket && (
          <div className="mx-auto mt-4 w-fit rounded-xl bg-white p-2">
            <Qr text={b.booked.ticket} size={132} />
          </div>
        )}
        <p className="m-0 mt-1 text-[#a9a39b] first-letter:uppercase">{f.when(b.booked.booking.start)}</p>
        {b.booked.booking.price && <p className="m-0 mt-1 font-bold">{formatMoney(b.booked.booking.price, locale)}</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              b.again();
              setSeats([]);
            }}
            className="cursor-pointer rounded-full bg-[#ef4444] px-5 py-2 text-sm font-bold text-white"
          >
            {es ? 'Comprar más' : 'Buy more'}
          </button>
          <button type="button" onClick={() => setManaging(b.booked?.manage ?? null)} className="cursor-pointer rounded-full border border-[#3f3f4a] px-5 py-2 text-sm font-bold">
            {es ? 'Cambiar o cancelar' : 'Change or cancel'}
          </button>
        </div>
        {managing && <ManageBooking address={managing} store={store} locale={locale} onClose={() => setManaging(null)} />}
      </div>
    );

  return (
    <div className="mt-6">
      <Checkout held={b.held} check={b.check} release={b.release} store={store} locale={locale} />
      <p className="m-0 text-sm text-[#a9a39b]">{t.description}</p>
      {premium.length > 0 && (
        <p className="m-0 mt-1 text-xs text-[#a9a39b]">
          {es ? 'Filas preferentes: ' : 'Premium rows: '}
          {premium.join(', ')} · {formatMoney({ amount: t.seating?.prices[premium[0]] ?? 0, currency: t.price?.currency ?? 'MXN' }, locale)}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        {byDay.map(([day, list]) => (
          <div key={day} className="flex flex-wrap items-center gap-2">
            <span className="w-28 text-sm font-semibold capitalize text-[#a9a39b]">
              {f.weekday(day)} {f.dayNumber(day)} {f.month(day)}
            </span>
            {list.map(({ start, slot: s }) =>
              s ? (
                <button
                  key={start}
                  type="button"
                  onClick={() => (pick(s), setWaitFor(null))}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm font-bold transition ${b.slot?.start === start ? 'border-[#ef4444] bg-[#ef4444] text-white' : 'border-[#2c2c36] hover:border-[#ef4444]'}`}
                >
                  {f.time(start)} <span className="font-normal opacity-60">· {s.free}</span>
                </button>
              ) : (
                <button
                  key={start}
                  type="button"
                  onClick={() => (b.choose(null), setWaitFor(start))}
                  className={`cursor-pointer rounded-md border border-dashed px-3 py-1.5 text-sm transition ${waitFor === start ? 'border-[#ef4444] text-[#fca5a5]' : 'border-[#3f3f4a] text-[#6b665f] hover:border-[#ef4444]'}`}
                >
                  <s>{f.time(start)}</s> {es ? 'agotada' : 'sold out'}
                </button>
              ),
            )}
          </div>
        ))}
      </div>

      {waitFor && (
        <div className="mt-6 max-w-[420px] rounded-xl bg-[#16161d] p-4">
          {b.waiting && Date.parse(b.waiting.start) === Date.parse(waitFor) ? (
            <p className="m-0 text-sm">
              {es ? '✓ Estás en la lista de espera. Si se libera un lugar para ' : '✓ You are on the waitlist. If a place frees up for '}
              <b className="capitalize">{f.when(waitFor)}</b>
              {es ? ', te avisamos por correo.' : ', we email you.'}
            </p>
          ) : (
            <form
              className="flex flex-col gap-2.5"
              onSubmit={async (e) => {
                e.preventDefault();
                await b.wait(form, waitFor, { places: many });
              }}
            >
              <p className="m-0 font-black first-letter:uppercase">
                {f.when(waitFor)} · {es ? 'agotada' : 'sold out'}
              </p>
              <p className="m-0 text-sm text-[#a9a39b]">
                {es ? 'Anótate: si alguien cancela o no paga a tiempo, te avisamos.' : 'Join the list: if someone cancels or does not pay in time, we tell you.'}
              </p>
              <label className="flex items-center gap-3 text-sm">
                {es ? 'Asientos' : 'Seats'}
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={many}
                  onChange={(e) => setMany(Math.min(6, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-16 rounded-md border border-[#2c2c36] bg-[#0b0b10] px-2 py-1"
                />
              </label>
              <Fields type={t} value={form} onChange={setForm} locale={locale} input="rounded-md border border-[#2c2c36] bg-[#0b0b10] px-3 py-2 text-sm outline-none focus:border-[#ef4444]" />
              <button type="submit" className="cursor-pointer rounded-full border border-[#ef4444] py-2.5 text-sm font-bold text-[#fca5a5]">
                {es ? 'Avisarme si se libera' : 'Tell me if one frees up'}
              </button>
            </form>
          )}
        </div>
      )}

      {b.slot && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 overflow-x-auto">
            <div className="mx-auto w-fit">
              <div className="mx-auto mb-5 h-2 w-4/5 rounded-[50%] bg-gradient-to-b from-[#ef4444]/70 to-transparent" />
              <p className="m-0 mb-4 text-center text-[10px] uppercase tracking-[0.4em] text-[#6b665f]">{es ? 'Pantalla' : 'Screen'}</p>
              {/* The room as it is laid out: each row in its blocks, an aisle between. */}
              {layoutOf(t).map(({ row, blocks }) => (
                <div key={row} className="mb-1.5 flex items-center gap-4">
                  <span className="-mr-2.5 w-4 text-center text-[11px] text-[#6b665f]">{row}</span>
                  {blocks.map((block) => (
                    <div key={block[0]} className="flex gap-1.5">
                      {block.map((id) => {
                        const r = byId.get(id)!;
                        const on = seats.includes(id);
                        const taken = !free.has(id);
                        const gold = r.price !== null;
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={taken}
                            aria-pressed={on}
                            title={`${id} · ${formatMoney({ amount: priceOf(id), currency: 'MXN' }, locale)}`}
                            onClick={() => setSeats(on ? seats.filter((x) => x !== id) : [...seats, id])}
                            className={`size-6 cursor-pointer rounded-t-[8px] rounded-b-[3px] text-[9px] font-bold transition disabled:cursor-not-allowed ${
                              on
                                ? 'bg-[#ef4444] text-white'
                                : taken
                                  ? 'bg-[#26262e] text-transparent'
                                  : gold
                                    ? 'bg-[#a16207] text-[#fde68a] hover:bg-[#ca8a04]'
                                    : 'bg-[#3f3f4a] text-[#a9a39b] hover:bg-[#5b5b68]'
                            }`}
                          >
                            {id.slice(row.length)}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
              <div className="mt-4 flex justify-center gap-4 text-[11px] text-[#a9a39b]">
                <span className="flex items-center gap-1.5">
                  <i className="size-3 rounded-sm bg-[#3f3f4a]" /> {formatMoney(t.price!, locale)}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-3 rounded-sm bg-[#a16207]" /> {es ? 'Preferente' : 'Premium'}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-3 rounded-sm bg-[#26262e]" /> {es ? 'Vendido' : 'Sold'}
                </span>
              </div>
            </div>
          </div>
          <aside className="self-start rounded-xl bg-[#16161d] p-4">
            {seats.length ? (
              <form
                className="flex flex-col gap-2.5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await b.book(form, { seats });
                }}
              >
                <p className="m-0 text-lg font-black first-letter:uppercase">{f.when(b.slot.start)}</p>
                <p className="m-0 text-sm text-[#a9a39b]">
                  {seats.length} {es ? (seats.length === 1 ? 'asiento' : 'asientos') : seats.length === 1 ? 'seat' : 'seats'}: {seats.join(', ')}
                </p>
                <p className="m-0 text-2xl font-black">
                  {off > 0 && <s className="mr-2 text-base font-bold text-[#6b665f]">{formatMoney({ amount: total + off, currency: t.price?.currency ?? 'MXN' }, locale)}</s>}
                  {formatMoney({ amount: total, currency: t.price?.currency ?? 'MXN' }, locale)}
                </p>
                <Fields type={t} value={form} onChange={setForm} locale={locale} input="rounded-md border border-[#2c2c36] bg-[#0b0b10] px-3 py-2 text-sm outline-none focus:border-[#ef4444]" />
                {b.coupons && (
                  <CouponField
                    value={b.coupon}
                    onChange={b.setCoupon}
                    applied={b.applied}
                    off={off}
                    locale={locale}
                    good="text-[#86efac]"
                    input="rounded-md border border-[#2c2c36] bg-[#0b0b10] px-3 py-2 text-sm outline-none focus:border-[#ef4444]"
                  />
                )}
                {b.problems.length > 0 && <p className="m-0 text-sm text-[#fca5a5]">{said(b.problems, locale)}</p>}
                <button type="submit" disabled={b.sending} className="cursor-pointer rounded-full bg-[#ef4444] py-3 text-sm font-bold text-white">
                  {b.sending ? '…' : es ? 'Comprar' : 'Buy'}
                </button>
              </form>
            ) : (
              <p className="m-0 py-6 text-center text-sm text-[#a9a39b]">{es ? 'Toca los asientos que quieras.' : 'Tap the seats you want.'}</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

/** A night's zones, so many tickets of one. */
function Zones({ store, locale, onBooked, id }: DesignProps & { id: string }) {
  const es = locale === 'es';
  const b = useBooking({ endpoint: endpointOf(typeOf(store.data.types, id)), fetch: store.fetch, onBooked: told(onBooked) });
  const [form, setForm] = useState<Filled>(empty);
  const [managing, setManaging] = useState<string | null>(null);
  const [waitFor, setWaitFor] = useState<string | null>(null);
  const f = formats(locale, b.timeZone);
  // A zone is always chosen: its places are its own.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once the kind is known.
  useEffect(() => {
    if (b.type && !b.resource) b.setResource(b.type.resources[0].id);
  }, [b.type]);
  if (b.status !== 'ready' || !b.type) return <div className="mt-6 h-[360px] animate-pulse rounded-xl bg-[#16161d]" />;
  const t = b.type;
  const zone = t.resources.find((r) => r.id === b.resource) ?? t.resources[0];
  const each = zone.price ?? t.price?.amount ?? 0;
  const nights = [...b.days.entries()].flatMap(([day, slots]) => slots.map((s) => ({ day, s })));
  const off = b.slot ? b.discountFor(Array(b.places).fill(each), b.slot.start) : 0;

  if (b.booked)
    return (
      <div className="mt-6 rounded-xl border border-dashed border-[#a78bfa] p-6 text-center">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.3em] text-[#a78bfa]">{es ? 'Tus boletos' : 'Your tickets'}</p>
        <p className="m-0 mt-2 text-2xl font-black">
          {b.booked.booking.places ?? 1} × {t.resources.find((r) => r.id === b.booked?.booking.resource)?.name}
        </p>
        {b.booked.ticket && (
          <div className="mx-auto mt-4 w-fit rounded-xl bg-white p-2">
            <Qr text={b.booked.ticket} size={132} />
          </div>
        )}
        <p className="m-0 mt-1 text-[#a9a39b] first-letter:uppercase">{f.when(b.booked.booking.start)}</p>
        {b.booked.booking.price && <p className="m-0 mt-1 font-bold">{formatMoney(b.booked.booking.price, locale)}</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={b.again} className="cursor-pointer rounded-full bg-[#7c3aed] px-5 py-2 text-sm font-bold text-white">
            {es ? 'Comprar más' : 'Buy more'}
          </button>
          <button type="button" onClick={() => setManaging(b.booked?.manage ?? null)} className="cursor-pointer rounded-full border border-[#3f3f4a] px-5 py-2 text-sm font-bold">
            {es ? 'Cambiar o cancelar' : 'Change or cancel'}
          </button>
        </div>
        {managing && <ManageBooking address={managing} store={store} locale={locale} onClose={() => setManaging(null)} />}
      </div>
    );

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
      <Checkout held={b.held} check={b.check} release={b.release} store={store} locale={locale} />
      <div>
        <p className="m-0 text-sm text-[#a9a39b]">{t.description}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {t.resources.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={zone.id === r.id}
              onClick={() => b.setResource(r.id)}
              className="cursor-pointer rounded-xl border-2 border-[#2c2c36] p-4 text-left transition hover:border-[#7c3aed]/60 aria-pressed:border-[#7c3aed] aria-pressed:bg-[#7c3aed]/15"
            >
              <span className="block text-xl font-black">{r.name}</span>
              <span className="block text-sm text-[#a9a39b]">
                {formatMoney({ amount: r.price ?? t.price?.amount ?? 0, currency: 'MXN' }, locale)} · {r.capacity} {es ? 'lugares' : 'places'}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-semibold text-[#a9a39b]">{es ? 'Boletos' : 'Tickets'}</span>
          <div className="flex items-center rounded-full border border-[#2c2c36]">
            <button type="button" onClick={() => b.setPlaces(Math.max(1, b.places - 1))} className="cursor-pointer px-3.5 py-1.5 text-lg" aria-label="−">
              −
            </button>
            <b className="w-8 text-center">{b.places}</b>
            <button type="button" onClick={() => b.setPlaces(Math.min(10, b.places + 1))} className="cursor-pointer px-3.5 py-1.5 text-lg" aria-label="+">
              +
            </button>
          </div>
        </div>
        <p className="m-0 mt-5 mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#a78bfa]">{es ? 'Sábados con lugar' : 'Saturdays with room'}</p>
        <div className="flex flex-wrap gap-2">
          {nights.map(({ day, s }) => (
            <button
              key={s.start}
              type="button"
              onClick={() => (b.choose(s), setWaitFor(null))}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-left text-sm transition ${b.slot?.start === s.start ? 'border-[#7c3aed] bg-[#7c3aed] text-white' : 'border-[#2c2c36] hover:border-[#7c3aed]'}`}
            >
              <b className="block capitalize">
                {f.weekday(day)} {f.dayNumber(day)} {f.month(day)}
              </b>
              <span className="opacity-70">{f.time(s.start)}</span>
            </button>
          ))}
          {nights.length === 0 && <p className="m-0 text-sm text-[#a9a39b]">{es ? `No quedan ${b.places} lugares juntos en ${zone.name}.` : `No ${b.places} places left together in ${zone.name}.`}</p>}
          {/* The Saturdays with no room for so many in this zone: to wait for one. */}
          {b.full.slice(0, 4).map((start) =>
            b.waiting && Date.parse(b.waiting.start) === Date.parse(start) ? (
              <span key={start} className="rounded-lg border border-dashed border-[#7c3aed] px-3 py-2 text-sm text-[#c4b5fd]">
                ✓ {es ? 'En lista de espera' : 'On the waitlist'} · {f.dayNumber(new Date(start).toLocaleDateString('en-CA', { timeZone: b.timeZone }))}
              </span>
            ) : (
              <button
                key={start}
                type="button"
                onClick={() => (b.choose(null), setWaitFor(start))}
                className={`cursor-pointer rounded-lg border border-dashed px-3 py-2 text-left text-sm transition hover:border-[#7c3aed] ${waitFor === start ? 'border-[#7c3aed] text-[#c4b5fd]' : 'border-[#3f3f4a] text-[#a9a39b]'}`}
              >
                <s className="capitalize">{f.when(start)}</s> · {es ? `avísame si se liberan ${b.places}` : `tell me if ${b.places} free up`}
              </button>
            ),
          )}
        </div>
      </div>
      <aside className="self-start rounded-xl bg-[#16161d] p-4">
        {waitFor && !b.slot ? (
          <form
            className="flex flex-col gap-2.5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await b.wait(form, waitFor)) setWaitFor(null);
            }}
          >
            <p className="m-0 text-lg font-black first-letter:uppercase">{f.when(waitFor)}</p>
            <p className="m-0 text-sm text-[#a9a39b]">
              {es
                ? `No quedan ${b.places} en ${zone.name}. Anótate: si alguien cancela o no paga a tiempo, te avisamos.`
                : `No ${b.places} left in ${zone.name}. Join the list: if someone cancels or does not pay in time, we tell you.`}
            </p>
            <Fields type={t} value={form} onChange={setForm} locale={locale} input="rounded-md border border-[#2c2c36] bg-[#0b0b10] px-3 py-2 text-sm outline-none focus:border-[#7c3aed]" />
            <button type="submit" className="cursor-pointer rounded-full border border-[#7c3aed] py-3 text-sm font-bold text-[#c4b5fd]">
              {es ? 'Avisarme si se liberan' : 'Tell me if they free up'}
            </button>
          </form>
        ) : b.slot ? (
          <form
            className="flex flex-col gap-2.5"
            onSubmit={async (e) => {
              e.preventDefault();
              await b.book(form);
            }}
          >
            <p className="m-0 text-lg font-black first-letter:uppercase">{f.when(b.slot.start)}</p>
            <p className="m-0 text-sm text-[#a9a39b]">
              {b.places} × {zone.name} · {formatMoney({ amount: each, currency: 'MXN' }, locale)}
            </p>
            <p className="m-0 text-2xl font-black">
              {off > 0 && <s className="mr-2 text-base font-bold text-[#6b665f]">{formatMoney({ amount: each * b.places, currency: 'MXN' }, locale)}</s>}
              {formatMoney({ amount: each * b.places - off, currency: 'MXN' }, locale)}
            </p>
            <Fields type={t} value={form} onChange={setForm} locale={locale} input="rounded-md border border-[#2c2c36] bg-[#0b0b10] px-3 py-2 text-sm outline-none focus:border-[#7c3aed]" />
            {b.coupons && (
              <CouponField
                value={b.coupon}
                onChange={b.setCoupon}
                applied={b.applied}
                off={off}
                locale={locale}
                good="text-[#86efac]"
                input="rounded-md border border-[#2c2c36] bg-[#0b0b10] px-3 py-2 text-sm outline-none focus:border-[#7c3aed]"
              />
            )}
            {b.problems.length > 0 && <p className="m-0 text-sm text-[#fca5a5]">{said(b.problems, locale)}</p>}
            <button type="submit" disabled={b.sending} className="cursor-pointer rounded-full bg-[#7c3aed] py-3 text-sm font-bold text-white">
              {b.sending ? '…' : es ? 'Comprar' : 'Buy'}
            </button>
          </form>
        ) : (
          <p className="m-0 py-6 text-center text-sm text-[#a9a39b]">{es ? 'Elige la zona, cuántos, y el sábado.' : 'Choose the zone, how many, and the Saturday.'}</p>
        )}
      </aside>
    </div>
  );
}
