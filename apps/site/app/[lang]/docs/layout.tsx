import type { ReactNode } from 'react';
import { DocsFrame } from '@/components/docs/DocsFrame';
import type { Locale } from '@/lib/i18n';

export default async function DocsLayout({ children, params }: LayoutProps<'/[lang]/docs'>) {
  return <DocsFrame locale={(await params).lang as Locale}>{children as ReactNode}</DocsFrame>;
}
