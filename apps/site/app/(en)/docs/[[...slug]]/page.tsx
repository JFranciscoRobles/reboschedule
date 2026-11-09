import { DocPage, docMetadata, docParams, slugOf } from '@/components/docs/DocPage';

export const dynamicParams = false;
export const generateStaticParams = docParams;

export async function generateMetadata({ params }: PageProps<'/docs/[[...slug]]'>) {
  return docMetadata(slugOf((await params).slug), 'en');
}

export default async function Doc({ params }: PageProps<'/docs/[[...slug]]'>) {
  return <DocPage slug={slugOf((await params).slug)} locale="en" />;
}
