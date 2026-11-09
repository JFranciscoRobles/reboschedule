'use client';

// Samples of code, one shown at a time. Each comes already coloured, as HTML.

import { useState } from 'react';
import { useT } from '@/components/i18n';

export function CodeTabs({ samples }: { samples: { name: string; html: string }[] }) {
  const [shown, setShown] = useState(0);
  const t = useT();
  return (
    <div className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-white shadow-[0_20px_40px_-20px_rgba(47,46,43,0.18)]">
      <div className="flex flex-wrap gap-1 border-b border-[#f0eee9] p-2.5" role="tablist" aria-label={t({ en: 'Examples', es: 'Ejemplos' })}>
        {samples.map((sample, i) => (
          <button
            key={sample.name}
            type="button"
            role="tab"
            aria-selected={shown === i}
            onClick={() => setShown(i)}
            className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.75 text-sm font-medium transition-colors ${shown === i ? 'bg-hover text-ink' : 'text-muted hover:bg-hover'}`}
          >
            {sample.name}
          </button>
        ))}
      </div>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: code the site coloured when it was built, from its own samples. */}
      <div role="tabpanel" className="code min-h-90" dangerouslySetInnerHTML={{ __html: samples[shown].html }} />
    </div>
  );
}
