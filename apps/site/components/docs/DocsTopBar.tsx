'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { LocalLink, useLocale, useT } from '@/components/i18n';
import { LANGUAGES, LOCALES, delocalize, localize } from '@/lib/i18n';
import { REPO, VERSION } from '@/lib/site';
import { SidebarNav } from './DocsSidebar';
import { SearchCommand } from './SearchCommand';
import type { SearchEntry } from './searchIndex';

const ghost = 'rounded-lg px-2.75 py-1.75 text-ink transition-colors hover:bg-hover';

/** The bar above every page of the documentation; on a phone, its menu button opens the pages as a sheet. */
export function DocsTopBar({ index }: { index: SearchEntry[] }) {
  const sheet = useRef<HTMLDialogElement>(null);
  const close = () => sheet.current?.close();
  const locale = useLocale();
  const { path } = delocalize(usePathname() ?? '/');
  const other = LOCALES.find((one) => one !== locale) ?? 'en';
  const t = useT();
  const pages = t({ en: 'Pages of the documentation', es: 'Páginas de la documentación' });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/92 backdrop-blur-[8px]">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-3 px-6 py-3">
        <button
          type="button"
          aria-label={pages}
          onClick={() => sheet.current?.showModal()}
          className="-ml-2 flex size-9 cursor-pointer items-center justify-center rounded-lg text-ink transition-colors hover:bg-hover lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
        <LocalLink href="/" className="flex items-center gap-2.5 text-ink">
          {/* biome-ignore lint/performance/noImgElement: the logo, a small file of the site. */}
          <img src="/logo.svg" alt="" width={28} height={28} />
          <span className="font-display text-lg font-extrabold tracking-[-0.03em]">ReboSchedule</span>
          <span className="rounded-md bg-hover px-2 py-0.75 text-[13px] font-semibold text-muted">Docs</span>
        </LocalLink>
        <SearchCommand index={index} />
        <nav aria-label={t({ en: 'Top', es: 'Arriba' })} className="ml-auto flex flex-wrap items-center gap-0.5 text-sm font-medium">
          <LocalLink href="/" className={ghost}>
            {t({ en: 'Home', es: 'Inicio' })}
          </LocalLink>
          <LocalLink href="/demos/" className={ghost}>
            Demos
          </LocalLink>
          <LocalLink href="/docs/api/" className={ghost}>
            API
          </LocalLink>
          <a href={REPO} className={ghost}>
            GitHub
          </a>
          <Link href={localize(path, other)} hrefLang={other} lang={other} title={LANGUAGES[other].name} className={ghost}>
            {LANGUAGES[other].short}
          </Link>
          <span className="ml-1 rounded-full bg-pastel-green px-2.5 py-1.25 text-xs font-medium text-pastel-green-fg">v{VERSION}</span>
        </nav>
      </div>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: a click on the backdrop closes it; Escape does from the keyboard. */}
      <dialog ref={sheet} aria-label={pages} className="sheet m-0 h-dvh w-[min(320px,86vw)]" onClick={(event) => event.target === sheet.current && close()}>
        <div className="flex h-full flex-col overflow-y-auto bg-white px-4 py-5 shadow-menu">
          <div className="mb-5 flex items-center justify-between px-2.5">
            <span className="font-display text-lg font-extrabold tracking-[-0.03em]">{t({ en: 'Docs', es: 'Documentación' })}</span>
            <button type="button" onClick={close} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-hover">
              {t({ en: 'Close', es: 'Cerrar' })}
            </button>
          </div>
          <SidebarNav onGo={close} />
        </div>
      </dialog>
    </header>
  );
}
