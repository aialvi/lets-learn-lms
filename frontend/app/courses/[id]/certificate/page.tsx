import { Metadata } from 'next';
import Certificate from '@/components/courses/certificate';
import { MainNav } from '@/components/layout/main-nav';

export const metadata: Metadata = {
  title: 'Certificate of completion',
  description: 'Download your certificate of completion',
};

interface CertificatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { id } = await params;

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <MainNav />
      <main id='main-content' className='container-page flex-1 py-8 md:py-12'>
        <Certificate courseId={id} />
      </main>
    </div>
  );
}
