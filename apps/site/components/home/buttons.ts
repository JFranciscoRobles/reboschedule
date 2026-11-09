// The look of the main button of the site, for the pages drawn on the server
// and the pieces drawn in the browser alike: a module with no 'use client', so
// that a server component gets the string and not a reference to it.

export const primary = 'bg-brand font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(15,118,110,0.25)]';
export const secondary = 'rounded-xl border border-border-strong bg-white font-semibold text-ink transition-colors hover:bg-hover';
