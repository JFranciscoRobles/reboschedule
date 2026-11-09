import { DocPage, docMetadata, docParams, slugOf } from '@/components/docs/DocPage';
import type { Locale } from '@/lib/i18n';

export const dynamicParams = false;
export const generateStaticParams = docParams;

export async function generateMetadata({ params }: PageProps<'/[lang]/docs/[[...slug]]'>) {
  const { lang, slug } = await params;
  return docMetadata(slugOf(slug), lang as Locale);
}

export default async function Doc({ params }: PageProps<'/[lang]/docs/[[...slug]]'>) {
  const { lang, slug } = await params;
  return <DocPage slug={slugOf(slug)} locale={lang as Locale} />;
}
