import type { ReactNode } from 'react';
import '../globals.css';
import { RootDocument, rootMetadata } from '@/components/Chrome';
import { DEFAULT_LOCALE, type Locale, LOCALES } from '@/lib/i18n';

type Props = { children: ReactNode; params: Promise<{ lang: string }> };

// The other languages, each under its code: /es/.
export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props) {
  return rootMetadata((await params).lang as Locale);
}
export { viewport } from '@/components/Chrome';

export default async function LanguageLayout({ children, params }: Props) {
  return <RootDocument locale={(await params).lang as Locale}>{children}</RootDocument>;
}
