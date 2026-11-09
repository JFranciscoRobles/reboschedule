// The languages of the site. English is at the root (/docs/react/); Spanish
// under its code (/es/docs/react/). Every text is written once in each, side
// by side where it is used: `t({ en: 'Try it', es: 'Pruébalo' })`.

export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** A text, or anything else that changes with the language, in each language of the site. */
export type L<T = string> = Record<Locale, T>;

/** The address of a page of the site in a language: `/docs/` is `/es/docs/` in Spanish. */
export function localize(href: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || !href.startsWith('/') || href.startsWith('//')) return href;
  return `/${locale}${href}`;
}

/** The texts of a language: `t({ en, es })` gives the one in it. */
export const translator =
  (locale: Locale) =>
  <T>(text: L<T>): T =>
    text[locale];

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/** What each language is called, in itself. */
export const LANGUAGES: Record<Locale, { name: string; short: string }> = {
  en: { name: 'English', short: 'EN' },
  es: { name: 'Español', short: 'ES' },
};

/** The language of an address of the site, and the address without it. */
export function delocalize(path: string): { locale: Locale; path: string } {
  const first = path.split('/')[1];
  if (isLocale(first) && first !== DEFAULT_LOCALE) return { locale: first, path: path.slice(first.length + 1) || '/' };
  return { locale: DEFAULT_LOCALE, path };
}
