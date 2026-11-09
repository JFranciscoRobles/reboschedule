// What every page has: the document in its language, the header (the name,
// the demos, the code, the other language) and the footer.

import type { Metadata, Viewport } from 'next';
import { Caveat, Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { type L, type Locale, localize, translator } from '@/lib/i18n';
import { primary } from '@/components/home/buttons';
import { NPM_ORG } from '@/lib/home';
import { REPO, SITE, VERSION } from '@/lib/site';

// The fonts of the suite, as CSS variables: `globals.css` makes them
// `font-display`, `font-text`, `font-code` and `font-hand`.
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-jakarta' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains' });
const caveat = Caveat({ subsets: ['latin'], weight: '600', variable: '--font-caveat' });

export const viewport: Viewport = { themeColor: '#0f766e', width: 'device-width', initialScale: 1 };

const DESCRIPTION: L = {
  en: 'Booking in your app: appointments, courts, rooms and shifts; the times still free in any time zone, booked by whoever needs one and looked after from a calendar.',
  es: 'Reservas en tu aplicación: citas, canchas, salas y guardias; los horarios libres en cualquier zona horaria, reservados por quien los necesita y atendidos desde un calendario.',
};

export function rootMetadata(locale: Locale): Metadata {
  const t = translator(locale);
  return {
    metadataBase: new URL(SITE),
    title: { default: 'ReboSchedule', template: '%s · ReboSchedule' },
    description: t(DESCRIPTION),
    alternates: { languages: { en: '/', es: '/es/' } },
    openGraph: { siteName: 'ReboSchedule', locale: locale === 'es' ? 'es_ES' : 'en_US', type: 'website' },
  };
}

export function RootDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={locale} className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}

const ghost = 'rounded-lg px-3 py-2 text-ink transition-colors hover:bg-hover';

/** The header, its links in the page's language; `path`, the page's address without its language, for the other one. Its links go down to a second line on a narrow screen. */
export function SiteHeader({ locale, path }: { locale: Locale; path: string }) {
  const t = translator(locale);
  const other: Locale = locale === 'en' ? 'es' : 'en';
  return (
    <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4.5">
      <Link href={localize('/', locale)} className="flex items-center gap-2.5 text-ink">
        {/* biome-ignore lint/performance/noImgElement: the logo, a small file of the site. */}
        <img src="/logo.svg" alt="" width={32} height={32} />
        <span className="font-display text-xl font-extrabold tracking-[-0.03em]">ReboSchedule</span>
      </Link>
      <span className="rounded-full bg-pastel-green px-2.5 py-1 text-xs font-medium text-pastel-green-fg">
        {t({ en: 'Open source', es: 'Código abierto' })} · MIT · v{VERSION}
      </span>
      <nav aria-label={t({ en: 'Main', es: 'Principal' })} className="ml-auto flex flex-wrap items-center gap-0.5 text-[15px] font-medium">
        <Link href={localize('/demos/', locale)} className={ghost}>
          Demos
        </Link>
        <Link href={localize('/docs/', locale)} className={ghost}>
          {t({ en: 'Docs', es: 'Documentación' })}
        </Link>
        <a href={NPM_ORG} className={ghost}>
          npm
        </a>
        <a href={REPO} className={ghost}>
          GitHub
        </a>
        <Link href={localize(path, other)} className={ghost} hrefLang={other} title={other === 'es' ? 'Español' : 'English'}>
          {other.toUpperCase()}
        </Link>
        <Link href={localize('/docs/getting-started/', locale)} className={`ml-2 rounded-[10px] px-4 py-2.5 ${primary}`}>
          {t({ en: 'Get started', es: 'Empezar' })}
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = translator(locale);
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-6 pb-10 pt-8 text-sm text-muted">
        <span className="font-display text-base font-extrabold tracking-[-0.03em] text-ink">ReboSchedule</span>
        <Link href={localize('/demos/', locale)} className="hover:text-ink">
          Demos
        </Link>
        <Link href={localize('/docs/', locale)} className="hover:text-ink">
          {t({ en: 'Docs', es: 'Documentación' })}
        </Link>
        <Link href={localize('/docs/status/', locale)} className="hover:text-ink">
          {t({ en: 'Status & roadmap', es: 'Estado y hoja de ruta' })}
        </Link>
        <a href={NPM_ORG} className="hover:text-ink">
          npm
        </a>
        <a href={REPO} className="hover:text-ink">
          GitHub
        </a>
        <span className="sm:ml-auto">{t({ en: 'The bookings of the Rebo suite. Open source under the MIT license.', es: 'Las reservas de la suite Rebo. Código abierto con licencia MIT.' })}</span>
      </div>
    </footer>
  );
}
