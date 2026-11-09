import { notFound } from 'next/navigation';
import { DemoPage, demoMetadata } from '@/components/Pages';
import { SCENARIOS, scenarioOf } from '@/lib/scenarios';

// Each case of use, its own page: /demos/courts/.
export const dynamicParams = false;
export const generateStaticParams = () => SCENARIOS.map((s) => ({ demo: s.id }));

export async function generateMetadata({ params }: PageProps<'/demos/[demo]'>) {
  const s = scenarioOf((await params).demo);
  return s ? demoMetadata(s, 'en') : {};
}

export default async function Demo({ params }: PageProps<'/demos/[demo]'>) {
  const s = scenarioOf((await params).demo);
  if (!s) notFound();
  return <DemoPage s={s} locale="en" />;
}
