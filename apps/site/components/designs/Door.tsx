'use client';

// The door of a show, as whoever lets people in works it: the code of each
// ticket read (by the camera, by a scanner that types it, or pasted), let in
// once and said so in green, or refused in red and why (used already, at what
// time; cancelled; not paid; not today); and, for the demo, the tickets of
// the next show as their messages carry them, to scan one by a click.

import { describeEntry, type Entry } from '@reboschedule/core';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { DemoStore } from '@/lib/demo';
import { type Locale, translator } from '@/lib/i18n';
import { Qr } from './Qr';
import { formats } from './shared';

/** What a browser's camera reads codes with, where it has it. */
type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };

export function Door({ store, locale, type }: { store: DemoStore; locale: Locale; type: string }) {
  const t = translator(locale);
  useSyncExternalStore(
    store.subscribe,
    () => store.version,
    () => 0,
  );
  const tz = store.data.schedule.timeZone;
  const f = formats(locale, tz);
  const [code, setCode] = useState('');
  const [said, setSaid] = useState<Entry | 'unknown' | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [camera, setCamera] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  // The tickets of the next show still to come, or going on: those whose day is today first.
  const now = Date.now();
  const tickets = store.bookings.filter((b) => b.type === type && b.status === 'confirmed' && Date.parse(b.end) > now).sort((a, b) => a.start.localeCompare(b.start));
  const next = tickets[0]?.start;
  const show = tickets.filter((b) => b.start === next).slice(0, 8);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the codes of the show shown, once each.
  useEffect(() => {
    void Promise.all(show.map(async (b) => [b.id, await store.ticketOf(b)] as const)).then((all) => setCodes(Object.fromEntries(all)));
  }, [next, store.version]);

  const scan = async (text: string) => {
    const entry = await store.checkIn(text.trim());
    setSaid(entry ?? 'unknown');
    setCode('');
  };

  // The camera, where the browser reads codes: each second, a look.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the camera, on or off.
  useEffect(() => {
    if (!camera) return;
    const Found = (globalThis as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!Found) return;
    const detector = new Found({ formats: ['qr_code'] });
    let stream: MediaStream | null = null;
    let timer = 0;
    void navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((s) => {
      stream = s;
      if (video.current) {
        video.current.srcObject = s;
        void video.current.play();
      }
      timer = window.setInterval(async () => {
        if (!video.current) return;
        const [hit] = await detector.detect(video.current).catch(() => []);
        if (hit) await scan(hit.rawValue);
      }, 1000);
    });
    return () => {
      clearInterval(timer);
      for (const track of stream?.getTracks() ?? []) track.stop();
    };
  }, [camera]);
  const canSee = typeof globalThis !== 'undefined' && 'BarcodeDetector' in globalThis;

  const booking = said && said !== 'unknown' ? said.booking : null;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <b className="font-display text-lg">{t({ en: 'The door', es: 'La entrada' })}</b>
        <p className="m-0 text-sm text-muted">
          {t({ en: 'Scan the QR of each ticket: a scanner types it here; or use the camera.', es: 'Escanea el QR de cada boleto: un lector lo escribe aquí; o usa la cámara.' })}
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) void scan(code);
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="RS1.…"
            aria-label={t({ en: 'Ticket code', es: 'Código del boleto' })}
            className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 font-code text-sm"
          />
          <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
            {t({ en: 'Let in', es: 'Dejar pasar' })}
          </button>
          {canSee && (
            <button type="button" onClick={() => setCamera(!camera)} aria-pressed={camera} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold aria-pressed:bg-hover">
              📷
            </button>
          )}
        </form>
        {camera && <video ref={video} className="mt-3 aspect-video w-full rounded-xl bg-black object-cover" muted playsInline />}
        {said && (
          <div role="status" className={`mt-4 rounded-2xl px-5 py-4 ${said !== 'unknown' && said.ok ? 'bg-[#dcfce7] text-[#14532d]' : 'bg-[#fee2e2] text-[#7f1d1d]'}`}>
            <p className="m-0 text-2xl font-black">
              {said === 'unknown'
                ? `✕ ${t({ en: 'Not a ticket of ours', es: 'No es un boleto nuestro' })}`
                : said.ok
                  ? `✓ ${t({ en: 'Come in', es: 'Adelante' })}`
                  : `✕ ${t({ en: 'Stop', es: 'Alto' })}`}
            </p>
            {booking && (
              <p className="m-0 mt-1 text-sm">
                <b>{booking.name}</b> · {booking.seats?.join(', ') || `${booking.places ?? 1} × ${store.typeOf(booking.type)?.resources.find((r) => r.id === booking.resource)?.name ?? ''}`} ·{' '}
                {f.when(booking.start)}
              </p>
            )}
            {said !== 'unknown' && !said.ok && <p className="m-0 mt-1 text-sm font-semibold">{describeEntry(said.reason, locale, said.booking.arrived, tz)}</p>}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <b className="text-sm">{t({ en: 'To try: the tickets of the next show', es: 'Para probar: los boletos de la próxima función' })}</b>
        <p className="m-0 text-xs text-muted">{next && f.when(next)}</p>
        <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-3 p-0">
          {show.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => codes[b.id] && void scan(codes[b.id])}
                className="flex w-full flex-col items-center gap-1 rounded-xl border border-line p-2 text-xs hover:border-ink/40"
                title={t({ en: 'Scan it', es: 'Escanearlo' })}
              >
                {codes[b.id] ? <Qr text={codes[b.id]} size={96} /> : <span className="size-24 animate-pulse rounded bg-hover" />}
                <span className="w-full truncate text-center font-semibold">{b.name}</span>
                <span className="text-muted">{b.seats?.join(' ') || `× ${b.places ?? 1}`}</span>
                {b.attended === 'arrived' && <span className="rounded-full bg-[#dcfce7] px-2 text-[#14532d]">{t({ en: 'in', es: 'adentro' })}</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
