import { HomePage, homeMetadata } from '@/components/HomePage';
import type { Locale } from '@/lib/i18n';

export async function generateMetadata({ params }: PageProps<'/[lang]'>) {
  return homeMetadata((await params).lang as Locale);
}

export default async function Home({ params }: PageProps<'/[lang]'>) {
  return <HomePage locale={(await params).lang as Locale} />;
}
