'use client';

// The language of the page, for the components that run in the browser: the
// frame of the documentation gives it, and they ask for it with `useT()`.

import Link from 'next/link';
import { type ComponentProps, type ReactNode, createContext, useContext } from 'react';
import { DEFAULT_LOCALE, type Locale, localize, translator } from '@/lib/i18n';

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);

/** The texts of the page: `t({ en, es })` gives the one in its language. */
export const useT = () => translator(useLocale());

/** A link to a page of the site, in the language of the page it is on. */
export function LocalLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  return <Link href={localize(href, useLocale())} {...props} />;
}
