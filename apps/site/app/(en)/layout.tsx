import type { ReactNode } from 'react';
import '../globals.css';
import { RootDocument, rootMetadata } from '@/components/Chrome';

// English, at the root of the site.
export const metadata = rootMetadata('en');
export { viewport } from '@/components/Chrome';

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
