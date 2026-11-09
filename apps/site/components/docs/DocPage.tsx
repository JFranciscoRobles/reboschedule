import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type Locale, localize, translator } from '@/lib/i18n';
import { loadDoc } from '@/lib/docs';
import { PAGES, REPO, groupOf, hrefOf } from '@/lib/site';
import { Demo } from './Demos';
import { WIDE } from './wide';
import { OnThisPage } from './OnThisPage';
import { PageFooter } from './PageFooter';
import { PageIndex } from './PageIndex';

/** The slug of a page from the segments of its address: none is the first page. */
export const slugOf = (slug?: string[]) => (slug?.length ? slug.join('/') : 'index');

/** Every page of the documentation, for each language to make. */
export const docParams = () => PAGES.map((page) => ({ slug: page.slug === 'index' ? [] : [page.slug] }));

export async function docMetadata(slug: string, locale: Locale): Promise<Metadata> {
  if (!PAGES.some((page) => page.slug === slug)) return {};
  const { title, description } = await loadDoc(slug, locale, (href) => href);
  return { title, description, alternates: { languages: { en: hrefOf(slug), es: localize(hrefOf(slug), 'es') } } };
}

/** The HTML of a piece of a page, made from the Markdown of the repository when the site is built. */
const Html = ({ html }: { html: string }) =>
  // biome-ignore lint/security/noDangerouslySetInnerHtml: the Markdown of content/docs, made into HTML when the site is built.
  html.trim() ? <div className="doc max-w-[820px]" dangerouslySetInnerHTML={{ __html: html }} /> : null;

/** A page of the documentation, in a language: its title, its sections, and the pages before and after it. */
export async function DocPage({ slug, locale }: { slug: string; locale: Locale }) {
  const t = translator(locale);
  const at = PAGES.findIndex((page) => page.slug === slug);
  if (at < 0) notFound();
  const doc = await loadDoc(slug, locale, (href) => localize(href, locale));
  const sections = doc.headings.filter((heading) => heading.level === 2);
  const group = groupOf(slug);
  const edit = `${REPO}/edit/main/apps/site/content/docs/${locale === 'en' ? '' : `${locale}/`}${slug}.md`;

  // The index comes after the title and its lead, the first paragraph: the first piece is cut after it.
  const [first, ...rest] = doc.parts;
  const end = 'html' in first && first.html.startsWith('<p>') ? first.html.indexOf('</p>') + 4 : -1;
  const lead = end > 3 && 'html' in first ? first.html.slice(0, end) : '';
  const parts = lead && 'html' in first ? [{ html: first.html.slice(end) }, ...rest] : doc.parts;
  // A page with a case of use, the widget or the editor in it needs the room more than the list beside it.
  const wide = doc.parts.some((part) => 'demo' in part && WIDE.has(part.demo));

  return (
    <div className="flex gap-12">
      <main id="top" className="min-w-0 flex-1 pb-24 pt-9">
        <p className="m-0 text-[13px] text-muted">
          {group && t(group.title)} <span aria-hidden="true">/</span> <span className="text-ink">{t(PAGES[at].title)}</span>
        </p>
        <h1 className="mb-6 mt-3 font-display text-[clamp(36px,4vw,48px)] font-extrabold leading-[1.08] tracking-[-0.03em]">{doc.title}</h1>
        <div className={wide ? '' : 'max-w-[820px]'}>
          {lead && <Html html={lead} />}
          <PageIndex headings={sections} locale={locale} />
          {parts.map((part, i) =>
            'demo' in part ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: the pieces of a page are made once, in order.
              <Demo key={i} name={part.demo} />
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: the pieces of a page are made once, in order.
              <Html key={i} html={part.html} />
            ),
          )}
          <PageFooter previous={PAGES[at - 1]} next={PAGES[at + 1]} edit={edit} />
        </div>
      </main>
      {!wide && <OnThisPage headings={sections} />}
    </div>
  );
}
