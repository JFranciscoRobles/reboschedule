// The pages of the demos, each in the language it is given: all of them, and
// each one, a case of use with both of its sides. The home has a file of its
// own (`HomePage`).

import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/Chrome';
import { DemoRoom } from '@/components/DemoRoom';
import { type Locale, localize, translator } from '@/lib/i18n';
import { SCENARIOS, type Scenario } from '@/lib/scenarios';

const Icon = ({ s, size = 22 }: { s: Scenario; size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    // biome-ignore lint/security/noDangerouslySetInnerHtml: the icons are the site's own paths.
    dangerouslySetInnerHTML={{ __html: s.icon }}
  />
);

/** A demo's card: its icon in its colour, what it is, one line, and where it goes. */
function Card({ s, locale }: { s: Scenario; locale: Locale }) {
  const t = translator(locale);
  return (
    <Link href={localize(`/demos/${s.id}/`, locale)} className="lift group flex flex-col rounded-2xl border border-line bg-white p-6">
      <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: s.color }}>
        <Icon s={s} />
      </span>
      <b className="mt-4 font-display text-xl font-extrabold tracking-[-0.02em]">{t(s.title)}</b>
      <span className="mt-2 flex-1 leading-relaxed text-ink-soft">{t(s.lead)}</span>
      <span className="mt-5 text-sm font-semibold text-brand group-hover:underline">{t({ en: 'Try it', es: 'Probarlo' })} →</span>
    </Link>
  );
}

// ——— The demos ———

export const demosMetadata = (locale: Locale): Metadata => ({
  title: 'Demos',
  description: translator(locale)({ en: 'ReboSchedule working, in nine cases of use.', es: 'ReboSchedule funcionando, en nueve casos de uso.' }),
});

export function DemosPage({ locale }: { locale: Locale }) {
  const t = translator(locale);
  return (
    <>
      <SiteHeader locale={locale} path="/demos/" />
      <main className="mx-auto max-w-[1180px] px-6 pt-16">
        <h1 className="font-display text-[clamp(34px,5vw,52px)] font-extrabold tracking-[-0.035em]">Demos</h1>
        <p className="mt-3 max-w-[640px] text-lg text-ink-soft">
          {t({
            en: 'Nine cases of use, each with its people and both of its sides. What you book stays in this browser until you begin again.',
            es: 'Nueve casos de uso, cada uno con su gente y sus dos lados. Lo que reserves se queda en este navegador hasta que empieces de nuevo.',
          })}
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <Card key={s.id} s={s} locale={locale} />
          ))}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}

// ——— A demo ———

export const demoMetadata = (s: Scenario, locale: Locale): Metadata => ({ title: translator(locale)(s.title), description: translator(locale)(s.lead) });

export function DemoPage({ s, locale }: { s: Scenario; locale: Locale }) {
  const t = translator(locale);
  return (
    <>
      <SiteHeader locale={locale} path={`/demos/${s.id}/`} />
      <main className="mx-auto max-w-[1180px] px-4 pt-8 sm:px-6">
        <nav className="flex flex-wrap gap-2" aria-label="Demos">
          {SCENARIOS.map((o) => (
            <Link
              key={o.id}
              href={localize(`/demos/${o.id}/`, locale)}
              aria-current={o.id === s.id ? 'page' : undefined}
              className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-hover aria-[current=page]:bg-ink aria-[current=page]:text-white"
            >
              <span style={{ color: o.id === s.id ? '#fff' : o.color }}>
                <Icon s={o} size={16} />
              </span>
              {t(o.title)}
            </Link>
          ))}
        </nav>

        <header className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div>
            <h1 className="flex items-center gap-3 font-display text-[clamp(30px,4.5vw,46px)] font-extrabold tracking-[-0.035em]">
              <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl text-white" style={{ background: s.color }}>
                <Icon s={s} size={26} />
              </span>
              {t(s.title)}
            </h1>
            <p className="mt-4 max-w-[640px] text-lg leading-relaxed text-ink-soft">{t(s.story)}</p>
          </div>
          <div className="rounded-2xl bg-surface p-5">
            <b className="text-sm">{t({ en: 'Things to try', es: 'Para probar' })}</b>
            <ol className="mt-3 space-y-2.5">
              {s.tries.map((x, i) => (
                <li key={x.en} className="flex gap-3 text-[15px] leading-snug text-ink-soft">
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-white text-xs font-bold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.12)]">{i + 1}</span>
                  {t(x)}
                </li>
              ))}
            </ol>
          </div>
        </header>

        <section className="mt-8">
          <DemoRoom id={s.id} locale={locale} />
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
