// Code coloured when the site is built, as the light theme of GitHub colours
// it: HTML that brings its own colours, with nothing to run in the browser.

import { createHighlighter, type Highlighter } from 'shiki';

const THEME = 'github-light';
const LANGS = ['ts', 'tsx'];
let highlighter: Promise<Highlighter> | undefined;

export async function highlight(code: string, lang: string) {
  const lit = await (highlighter ??= createHighlighter({ themes: [THEME], langs: LANGS }));
  return lit.codeToHtml(code.replace(/\n$/, ''), { lang: LANGS.includes(lang) ? lang : 'text', theme: THEME });
}
