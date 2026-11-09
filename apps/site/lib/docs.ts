// The pages of the documentation: Markdown files in `content/docs`, English
// there and Spanish in `content/docs/es`, turned into HTML when the site is
// built. Nothing of this runs in the browser.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { type Highlighter, createHighlighter } from 'shiki';
import { DEFAULT_LOCALE, type Locale } from './i18n';

const THEME = 'github-dark-dimmed';
/** The landing page shows its code on white. */
export const LIGHT_THEME = 'github-light';
const LANGS = ['ts', 'tsx', 'js', 'json', 'bash', 'sh', 'html', 'css'];

let highlighter: Promise<Highlighter> | undefined;
const shiki = () => (highlighter ??= createHighlighter({ themes: [THEME, LIGHT_THEME], langs: LANGS }));

/** The grey of the dark theme's comments, too pale on its background, with one that reads at 4.5:1. */
const readable = (html: string) => html.replace(/#768390\b/gi, '#909DAA');

/** Code as HTML, coloured; as plain text when its language is not one of the few the site writes in. */
export async function highlight(code: string, lang: string, theme = THEME): Promise<string> {
  const lit = await shiki();
  return readable(lit.codeToHtml(code.replace(/\n$/, ''), { lang: LANGS.includes(lang) ? lang : 'text', theme }));
}

export interface Heading {
  id: string;
  text: string;
  /** 2 for a section, 3 for what is inside one. */
  level: 2 | 3;
}

/** A piece of a page: HTML, or the name of a demo to put there. */
export type Part = { html: string } | { demo: string };

export interface DocPage {
  title: string;
  description: string;
  parts: Part[];
  headings: Heading[];
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[`@()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function sourceOf(slug: string, locale: Locale): string {
  const folder = locale === DEFAULT_LOCALE ? 'content/docs' : `content/docs/${locale}`;
  return readFileSync(path.join(process.cwd(), folder, `${slug}.md`), 'utf8');
}

/**
 * The ids a translation gives its headings, written `## Título {#title}`, and
 * the text without them: a link to a section works in every language.
 */
function fixedIds(source: string): { body: string; ids: Map<string, string> } {
  const ids = new Map<string, string>();
  const body = source.replace(/^(#{2,3} )(.+?) \{#([\w-]+)\}$/gm, (_, hashes: string, text: string, id: string) => {
    ids.set(text.replace(/`/g, ''), id);
    return hashes + text;
  });
  return { body, ids };
}

const headingsOf = (body: string, ids: Map<string, string>): Heading[] =>
  [...body.replace(/```[\s\S]*?```/g, '').matchAll(/^(##|###) (.+)$/gm)].map((match) => {
    const text = match[2].replace(/`/g, '');
    return { id: ids.get(text) ?? slugify(text), text, level: match[1].length as 2 | 3 };
  });

/** The sections of a page, without making its HTML: what the search box finds. */
export function outlineOf(slug: string, locale: Locale = DEFAULT_LOCALE): Heading[] {
  const { body, ids } = fixedIds(sourceOf(slug, locale));
  return headingsOf(body, ids);
}

async function renderer(ids: Map<string, string>, link: (href: string) => string): Promise<InstanceType<typeof MarkdownIt>> {
  const lit = await shiki();
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (code, lang) => readable(lit.codeToHtml(code.replace(/\n$/, ''), { lang: LANGS.includes(lang) ? lang : 'text', theme: THEME })),
  }).use(anchor, { slugify: (text) => ids.get(text) ?? slugify(text), level: [2, 3], permalink: anchor.permalink.headerLink() });
  // A table wider than a phone scrolls by itself, and not the page with it.
  md.renderer.rules.table_open = () => '<div class="table"><table>';
  md.renderer.rules.table_close = () => '</table></div>';
  // Links to other pages of the site, in the page's language.
  const open = md.renderer.rules.link_open ?? ((tokens, i, options, _env, self) => self.renderToken(tokens, i, options));
  md.renderer.rules.link_open = (tokens, i, options, env, self) => {
    const href = tokens[i].attrGet('href');
    if (href) tokens[i].attrSet('href', link(String(href)));
    return open(tokens, i, options, env, self);
  };
  return md;
}

/** A page of the documentation in a language: its title, its first paragraph, its HTML and its sections. */
export async function loadDoc(slug: string, locale: Locale, link: (href: string) => string): Promise<DocPage> {
  const { body: source, ids } = fixedIds(sourceOf(slug, locale));
  const md = await renderer(ids, link);
  const title = /^# (.+)$/m.exec(source)?.[1] ?? slug;
  const body = source.replace(/^# .+\n+/, '');
  // What the page is about: its first paragraph, as plain text.
  const description = (body.split(/\n\s*\n/)[0] ?? '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const html = md.render(body);
  // Where a demo goes: a line of its own, `<demo name="editor" />`.
  const parts: Part[] = [];
  let at = 0;
  for (const match of html.matchAll(/(?:<p>)?<demo name="([\w-]+)" ?\/>(?:<\/p>)?\n?/g)) {
    parts.push({ html: html.slice(at, match.index) });
    parts.push({ demo: match[1] });
    at = match.index + match[0].length;
  }
  parts.push({ html: html.slice(at) });
  return { title, description, parts, headings: headingsOf(body, ids) };
}
