'use client';

// The room laid out by whoever runs it: how many rows, the blocks of each
// row (how many seats to the left, in the middle, to the right, an aisle
// between), and the rows that cost otherwise; drawn as it is written, and
// saved as the kind's seating, its seats made again of it. A seat sold for a
// show to come is never taken away: the room is kept as it was, and said why.

import { type EventType, formatMoney, rowName, type Seating, seatsOf, takes } from '@reboschedule/core';
import { useState } from 'react';
import type { DemoStore } from '@/lib/demo';
import { type Locale, translator } from '@/lib/i18n';

export function SeatingEditor({ type, store, locale, onDone }: { type: EventType; store: DemoStore; locale: Locale; onDone: () => void }) {
  const t = translator(locale);
  const given = type.seating!;
  const [rows, setRows] = useState(given.rows);
  const [blocks, setBlocks] = useState(given.blocks);
  const [dear, setDear] = useState(() => new Set(Object.keys(given.prices)));
  const [price, setPrice] = useState(Object.values(given.prices)[0] ?? Math.round((type.price?.amount ?? 100) * 1.3));
  const [problem, setProblem] = useState('');
  const names = Array.from({ length: rows }, (_, i) => rowName(i));
  const seating: Seating = { rows, blocks, prices: Object.fromEntries(names.filter((r) => dear.has(r)).map((r) => [r, price])) };
  const each = blocks.reduce((n, b) => n + b, 0);
  const money = (amount: number) => formatMoney({ amount, currency: type.price?.currency ?? 'MXN' }, locale);

  const save = () => {
    // The seats sold for a show to come, that this room would not have.
    const kept = new Set(seatsOf(seating).map((s) => s.id));
    const lost = store.bookings.filter((b) => b.type === type.id && takes(b) && Date.parse(b.end) > Date.now()).flatMap((b) => (b.seats ?? []).filter((s) => !kept.has(s)));
    if (lost.length) {
      const some = [...new Set(lost)].sort().slice(0, 6).join(', ');
      return setProblem(
        t({
          en: `Seats sold for shows to come would be gone: ${some}… Refund them first, or keep them.`,
          es: `Desaparecerían asientos vendidos para funciones por venir: ${some}… Reembólsalos antes, o consérvalos.`,
        }),
      );
    }
    store.setType({ ...type, seating, resources: seatsOf(seating) });
    onDone();
  };

  const stepper = (value: number, set: (n: number) => void, least: number, most: number, label: string) => (
    <span className="inline-flex items-center rounded-lg border border-line bg-white">
      <button type="button" aria-label={`${label} −`} onClick={() => set(Math.max(least, value - 1))} className="px-2.5 py-1 text-lg leading-none hover:bg-hover">
        −
      </button>
      <b className="w-8 text-center font-code text-sm">{value}</b>
      <button type="button" aria-label={`${label} +`} onClick={() => set(Math.min(most, value + 1))} className="px-2.5 py-1 text-lg leading-none hover:bg-hover">
        +
      </button>
    </span>
  );

  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <b className="font-display text-lg">{t({ en: 'The room', es: 'La sala' })}</b>
        <span className="text-sm text-muted">{t({ en: `${rows * each} seats · ${rows} rows of ${each}`, es: `${rows * each} asientos · ${rows} filas de ${each}` })}</span>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{t({ en: 'Rows', es: 'Filas' })}</span>
            {stepper(rows, setRows, 1, 26, 'rows')}
          </div>

          <div>
            <span className="font-semibold">{t({ en: 'Seats of each row, block by block', es: 'Asientos por fila, bloque por bloque' })}</span>
            <p className="m-0 mt-0.5 text-xs text-muted">{t({ en: 'From the left; an aisle between each block.', es: 'De izquierda a derecha; un pasillo entre cada bloque.' })}</p>
            <div className="mt-2 flex flex-col gap-2">
              {blocks.map((n, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: a block is where it is, left to right.
                <div key={i} className="flex items-center gap-2">
                  <span className="w-24 text-muted">
                    {blocks.length === 1
                      ? t({ en: 'One block', es: 'Un bloque' })
                      : i === 0
                        ? t({ en: 'Left', es: 'Izquierda' })
                        : i === blocks.length - 1
                          ? t({ en: 'Right', es: 'Derecha' })
                          : blocks.length === 3
                            ? t({ en: 'Middle', es: 'Centro' })
                            : t({ en: `Block ${i + 1}`, es: `Bloque ${i + 1}` })}
                  </span>
                  {stepper(n, (v) => setBlocks(blocks.map((x, k) => (k === i ? v : x))), 1, 40, `block ${i + 1}`)}
                  {blocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBlocks(blocks.filter((_, k) => k !== i))}
                      className="rounded px-2 py-1 text-muted hover:bg-hover"
                      aria-label={t({ en: 'Remove block', es: 'Quitar bloque' })}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {blocks.length < 6 && (
                <button
                  type="button"
                  onClick={() => setBlocks([...blocks, 4])}
                  className="self-start rounded-lg border border-dashed border-line px-3 py-1.5 text-muted hover:border-ink/30 hover:text-ink"
                >
                  + {t({ en: 'Another block', es: 'Otro bloque' })}
                </button>
              )}
            </div>
          </div>

          <div>
            <span className="font-semibold">{t({ en: 'Premium rows', es: 'Filas preferentes' })}</span>
            <div className="mt-2 flex flex-wrap gap-1">
              {names.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={dear.has(r)}
                  onClick={() => {
                    const next = new Set(dear);
                    if (next.has(r)) next.delete(r);
                    else next.add(r);
                    setDear(next);
                  }}
                  className="size-7 rounded-md border border-line font-code text-xs font-bold hover:border-ink/30 aria-pressed:border-transparent aria-pressed:bg-[#a16207] aria-pressed:text-white"
                >
                  {r}
                </button>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2">
              <span className="text-muted">{t({ en: 'Each seat of them', es: 'Cada asiento de ellas' })}</span>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                className="w-24 rounded-lg border border-line px-2 py-1 font-code text-sm"
              />
              <span className="text-xs text-muted">
                {t({ en: 'the rest', es: 'el resto' })} {money(type.price?.amount ?? 0)}
              </span>
            </label>
          </div>
        </div>

        {/* The room as it is written. */}
        <div className="min-w-0 overflow-x-auto rounded-xl bg-surface p-3">
          <div className="mx-auto w-fit">
            <p className="m-0 mb-3 rounded bg-hover py-1 text-center text-[10px] uppercase tracking-[0.3em] text-muted">{t({ en: 'Screen', es: 'Pantalla' })}</p>
            {names.map((r) => (
              <div key={r} className="mb-1 flex items-center gap-3">
                <span className="-mr-1.5 w-4 text-center text-[10px] text-muted">{r}</span>
                {blocks.map((n, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a block is where it is.
                  <div key={i} className="flex gap-[3px]">
                    {Array.from({ length: n }, (_, k) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: a seat of the sketch, where it is.
                      <span key={k} className={`size-3.5 rounded-t-[4px] rounded-b-[2px] ${dear.has(r) ? 'bg-[#a16207]' : 'bg-[#cbd5e1]'}`} />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {problem && <p className="m-0 mt-4 rounded-lg bg-pastel-pink px-3 py-2 text-sm text-[#b42a2a]">{problem}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-hover">
          {t({ en: 'Cancel', es: 'Cancelar' })}
        </button>
        <button type="button" onClick={save} className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
          {t({ en: 'Save the room', es: 'Guardar la sala' })}
        </button>
      </div>
    </section>
  );
}
