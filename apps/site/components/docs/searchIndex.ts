// What ⌘K finds: every page, its sections, and the functions, components and
// types of the API page. Made when the site is built; the browser only filters it.

import { outlineOf } from '@/lib/docs';
import { type Locale, localize, translator } from '@/lib/i18n';
import { PAGES, groupOf, hrefOf } from '@/lib/site';

export interface SearchEntry {
  kind: 'Page' | 'Section' | 'API';
  title: string;
  /** The page it is on, or, for a page, the group of the menu it is in. */
  detail: string;
  href: string;
}

export function searchIndex(locale: Locale): SearchEntry[] {
  const t = translator(locale);
  const entries: SearchEntry[] = [];
  for (const page of PAGES) {
    const href = hrefOf(page.slug);
    const group = groupOf(page.slug);
    entries.push({ kind: 'Page', title: t(page.title), detail: group ? t(group.title) : '', href });
    let section = '';
    for (const heading of outlineOf(page.slug, locale)) {
      if (heading.level === 2) section = heading.text;
      // What the API page names under each package is a function, a component or a type of it.
      const api = page.slug === 'api' && heading.level === 3;
      entries.push({ kind: api ? 'API' : 'Section', title: heading.text, detail: api ? section : t(page.title), href: `${href}#${heading.id}` });
    }
  }
  return entries.map((entry) => ({ ...entry, href: localize(entry.href, locale) }));
}
