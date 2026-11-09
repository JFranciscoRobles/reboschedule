import type { ReactNode } from 'react';
import { LocaleProvider } from '@/components/i18n';
import type { Locale } from '@/lib/i18n';
import { DocsSidebar } from './DocsSidebar';
import { DocsTopBar } from './DocsTopBar';
import { searchIndex } from './searchIndex';

// The frame of every page of the documentation: the bar, the pages beside it,
// and the page itself, which brings its own "On this page".
export function DocsFrame({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <LocaleProvider locale={locale}>
      <div className="min-h-screen bg-white text-ink">
        <DocsTopBar index={searchIndex(locale)} />
        <div className="mx-auto flex max-w-[1400px] gap-x-12 px-4 sm:px-6">
          <DocsSidebar />
          <div className="min-w-0 flex-[999_1_600px]">{children}</div>
        </div>
      </div>
    </LocaleProvider>
  );
}
