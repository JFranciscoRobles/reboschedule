import { notFound } from 'next/navigation';
import { DemoPage, demoMetadata } from '@/components/Pages';
import type { Locale } from '@/lib/i18n';
import { SCENARIOS, scenarioOf } from '@/lib/scenarios';

export const dynamicParams = false;
export const generateStaticParams = () => SCENARIOS.map((s) => ({ demo: s.id }));

export async function generateMetadata({ params }: PageProps<'/[lang]/demos/[demo]'>) {
  const { lang, demo } = await params;
  const s = scenarioOf(demo);
  return s ? demoMetadata(s, lang as Locale) : {};
}

export default async function Demo({ params }: PageProps<'/[lang]/demos/[demo]'>) {
  const { lang, demo } = await params;
  const s = scenarioOf(demo);
  if (!s) notFound();
  return <DemoPage s={s} locale={lang as Locale} />;
}
