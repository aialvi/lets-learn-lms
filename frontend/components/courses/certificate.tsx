'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';
import { Download, Award, ArrowLeft, CheckCircle2, FileQuestion } from 'lucide-react';

// Fixed, print-safe palette for the certificate artwork (independent of theme).
const cert = {
  bgFrom: '#f4faf7',
  bgTo: '#e3f1ea',
  border: '#a8d5c2',
  accent: '#1b6b57',
  heading: '#0f3d31',
  body: '#1f4f42',
};
import { 
  fetchCourseById,
  fetchCompletionCertificate,
  getCourseVideosProgress
} from '@/lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    username: string;
  };
}

interface CertificateProps {
  courseId: string;
}

export default function Certificate({ courseId }: CertificateProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const certificateRef = useRef<HTMLDivElement>(null);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [completedAt, setCompletedAt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadCertificateData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(false);

      const courseData = await fetchCourseById(courseId);
      setCourse(courseData);
      
      // Get video progress data
      const progressData = await getCourseVideosProgress(courseId, session!.accessToken);
      
      // Calculate overall progress
      let overallProgress = 0;
      if (Array.isArray(progressData) && progressData.length > 0) {
        const completedLessons = progressData.filter(p => p.completed).length;
        overallProgress = (completedLessons / progressData.length) * 100;
      } else if (progressData && typeof progressData === 'object' && 'overallProgress' in progressData) {
        overallProgress = progressData.overallProgress;
      }
      
      setProgress(overallProgress);
      
      if (overallProgress >= 100) {
        const record = await fetchCompletionCertificate(courseId, session!.accessToken);
        setCompletedAt(record.issuedAt ? new Date(record.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Historical issue date unavailable');
      } else {
        toast.error('You need to complete all lessons to get a certificate');
        router.push(`/courses/${courseId}`);
      }
      
    } catch (error) {
      console.error('Error loading certificate data:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, session, router]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadCertificateData();
  }, [status, session, courseId, router, loadCertificateData]);

  const generateCertificate = async () => {
    if (!certificateRef.current) return;

    setIsGenerating(true);
    
    try {
      // Use html2canvas to convert the certificate to image
      const html2canvas = (await import('html2canvas')).default;
      
      // Create a style element to override problematic CSS
      const style = document.createElement('style');
      // html2canvas can't parse modern color functions (oklab/color-mix) that the
      // global theme applies to outlines and shadows, so neutralize them here.
      // Artwork colors are inline hex values and render as-is.
      style.textContent = `
        .certificate-override,
        .certificate-override * {
          outline-color: transparent !important;
          box-shadow: none !important;
          text-decoration-color: currentColor !important;
        }
      `;
      document.head.appendChild(style);
      
      // Add the override class to the certificate element
      certificateRef.current.classList.add('certificate-override');
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        logging: false,
        ignoreElements: (element) => {
          // Ignore elements that might cause issues
          return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
        }
      });
      
      // Clean up
      certificateRef.current.classList.remove('certificate-override');
      document.head.removeChild(style);
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `certificate-${course?.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('Certificate downloaded.');
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      
      // Fallback: Show a message with instructions to screenshot
      toast.error("We couldn't create the image, so we've opened a printable version instead. Choose “Save as PDF” to keep a copy.");
      
      // Alternative: Try to print the certificate
      try {
        const printWindow = window.open('', '_blank');
        if (printWindow && certificateRef.current) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Certificate - ${course?.title}</title>
                <style>
                  body { font-family: system-ui, -apple-system, Segoe UI, Arial, sans-serif; margin: 0; padding: 20px; }
                  .certificate { 
                    background: linear-gradient(135deg, #f4faf7, #e3f1ea);
                    border: 4px solid #a8d5c2;
                    border-radius: 8px;
                    padding: 48px;
                    text-align: center;
                    min-height: 500px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                  }
                  .icon { 
                    background: #1b6b57;
                    color: white;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    font-size: 24px;
                  }
                  .title { font-size: 32px; font-weight: bold; color: #0f3d31; margin-bottom: 24px; }
                  .text { font-size: 18px; color: #1f4f42; margin-bottom: 12px; }
                  .name { font-size: 24px; font-weight: bold; color: #0f3d31; margin: 16px 0; }
                  .course { font-size: 24px; font-weight: bold; color: #0f3d31; margin: 16px 0 24px; }
                  .details { display: flex; justify-content: center; gap: 32px; color: #1f4f42; margin-top: 24px; }
                  .detail { text-align: center; }
                  .detail-label { font-weight: bold; margin-bottom: 4px; }
                  .footer { margin-top: 32px; padding-top: 24px; border-top: 2px solid #a8d5c2; font-size: 14px; color: #1b6b57; }
                </style>
              </head>
              <body>
                <div class="certificate">
                  <div class="icon">🏆</div>
                  <h1 class="title">Certificate of Completion</h1>
                  <p class="text">This certifies that</p>
                  <p class="name">${session?.user?.name || 'Student'}</p>
                  <p class="text">has successfully completed</p>
                  <p class="course">${course?.title}</p>
                  <div class="details">
                    <div class="detail">
                      <div class="detail-label">Instructor</div>
                      <div>${course?.author.username}</div>
                    </div>
                    <div class="detail">
                      <div class="detail-label">Date</div>
                      <div>${completedAt}</div>
                    </div>
                    <div class="detail">
                      <div class="detail-label">Progress</div>
                      <div>${Math.round(progress)}%</div>
                    </div>
                  </div>
                  <div class="footer">
                    Let's Learn - Online Learning Platform
                  </div>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      } catch (printError) {
        console.error('Print fallback also failed:', printError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingRegion label='Loading certificate' className='mx-auto max-w-4xl space-y-6'>
        <div className='flex justify-between'>
          <Skeleton className='h-8 w-36' />
          <Skeleton className='h-6 w-32' />
        </div>
        <Skeleton className='h-10 w-72' />
        <Skeleton className='h-[500px] w-full rounded-xl' />
      </LoadingRegion>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        title="Couldn't load your certificate"
        message='We had trouble checking your course progress. Check your connection and try again.'
        onRetry={loadCertificateData}
        action={
          <Button variant='ghost' asChild>
            <Link href={`/courses/${courseId}`}>Back to course</Link>
          </Button>
        }
      />
    );
  }

  if (!course) {
    return (
      <EmptyState
        icon={FileQuestion}
        title='Course not found'
        description='This course may have been removed, so we can’t show a certificate for it.'
        action={
          <Button asChild>
            <Link href='/courses'>Browse courses</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className='mx-auto max-w-4xl space-y-8'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Button variant='ghost' size='sm' asChild className='-ml-2 text-muted-foreground'>
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft aria-hidden='true' />
            Back to course
          </Link>
        </Button>
        <Badge variant='success'>
          <CheckCircle2 aria-hidden='true' />
          Course completed
        </Badge>
      </div>

      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='page-title'>Your certificate</h1>
          <p className='page-description mt-2'>
            Congratulations on completing <span className='font-medium text-foreground'>{course.title}</span>.
          </p>
        </div>
        <Button onClick={generateCertificate} disabled={isGenerating} aria-busy={isGenerating} size='lg'>
          {isGenerating ? <Spinner /> : <Download aria-hidden='true' />}
          {isGenerating ? 'Preparing download…' : 'Download certificate'}
        </Button>
      </div>

      {/* Certificate artwork: fixed colors so it looks the same in any theme and when exported. */}
      <div className='overflow-x-auto rounded-xl'>
        <div
          ref={certificateRef}
          role='img'
          aria-label={`Certificate of completion: ${session?.user?.name || 'Student'} completed ${course.title}, ${completedAt}.`}
          className='min-w-[36rem] rounded-xl border-4 p-8 text-center sm:p-12'
          style={{
            minHeight: '500px',
            background: `linear-gradient(135deg, ${cert.bgFrom}, ${cert.bgTo})`,
            borderColor: cert.border,
          }}
        >
          <div className='space-y-6' aria-hidden='true'>
            <div className='mb-6 flex justify-center'>
              <div className='rounded-full p-4' style={{ backgroundColor: cert.accent, color: '#ffffff' }}>
                <Award className='size-12' />
              </div>
            </div>

            <p className='mb-4 text-4xl font-bold' style={{ color: cert.heading }}>
              Certificate of Completion
            </p>

            <div className='text-lg' style={{ color: cert.body }}>
              <p className='mb-2'>This certifies that</p>
              <p className='mb-4 text-2xl font-bold' style={{ color: cert.heading }}>
                {session?.user?.name || 'Student'}
              </p>
              <p className='mb-2'>has successfully completed</p>
              <p className='mb-6 text-2xl font-bold' style={{ color: cert.heading }}>
                {course.title}
              </p>
            </div>

            <div className='flex items-center justify-center gap-8' style={{ color: cert.body }}>
              <div className='text-center'>
                <p className='font-semibold'>Instructor</p>
                <p>{course.author.username}</p>
              </div>
              <div className='text-center'>
                <p className='font-semibold'>Date</p>
                <p>{completedAt}</p>
              </div>
              <div className='text-center'>
                <p className='font-semibold'>Progress</p>
                <p>{Math.round(progress)}%</p>
              </div>
            </div>

            <div className='mt-8 border-t-2 pt-6' style={{ borderColor: cert.border }}>
              <p className='text-sm' style={{ color: cert.accent }}>
                Let&apos;s Learn — Online Learning Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
