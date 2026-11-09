import { DemosPage, demosMetadata } from '@/components/Pages';
import type { Locale } from '@/lib/i18n';

export async function generateMetadata({ params }: PageProps<'/[lang]/demos'>) {
  return demosMetadata((await params).lang as Locale);
}

export default async function Demos({ params }: PageProps<'/[lang]/demos'>) {
  return <DemosPage locale={(await params).lang as Locale} />;
}
