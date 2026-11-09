'use client';

// The demos on the landing page, one case at a time: its tabs, a line of what
// it is, and the case itself with both of its sides.

import { useState } from 'react';
import { DemoRoom } from '@/components/DemoRoom';
import { type Locale, localize, translator } from '@/lib/i18n';
import { SCENARIOS, type ScenarioId } from '@/lib/scenarios';

export function LandingDemo({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const [id, setId] = useState<ScenarioId>('courts');
  const s = SCENARIOS.find((x) => x.id === id)!;
  return (
    <div>
      <div role="tablist" aria-label="Demos" className="flex flex-wrap justify-center gap-2">
        {SCENARIOS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={o.id === id}
            onClick={() => setId(o.id)}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition hover:-translate-y-0.5 aria-selected:border-transparent aria-selected:bg-ink aria-selected:text-white"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: o.color }} />
            {t(o.title)}
          </button>
        ))}
      </div>
      <p key={id} className="mx-auto mt-4 max-w-[640px] animate-pop-in text-center text-[15px] leading-relaxed text-muted opacity-0">
        {t(s.story)}{' '}
        <a href={localize(`/demos/${id}/`, locale)} className="font-medium text-brand hover:text-brand-hover">
          {t({ en: 'Open it alone →', es: 'Abrirlo solo →' })}
        </a>
      </p>
      <div className="mt-6 rounded-[22px] bg-white p-[clamp(10px,2vw,22px)]">
        <DemoRoom key={id} id={id} locale={locale} />
      </div>
    </div>
  );
}
