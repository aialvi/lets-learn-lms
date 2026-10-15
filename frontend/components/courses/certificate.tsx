'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Award, ArrowLeft, CheckCircle } from 'lucide-react';
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

  const loadCertificateData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const courseData = await fetchCourseById(courseId);
      setCourse(courseData);
      
      // Get video progress data
      const progressData = await getCourseVideosProgress(courseId, session!.accessToken);
      console.log('Progress data:', progressData);
      
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
      toast.error('Failed to load certificate data');
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
      style.textContent = `
        .certificate-override * {
          color: rgb(30, 64, 175) !important; /* blue-800 */
          background-color: rgb(255, 255, 255) !important;
          border-color: rgb(96, 165, 250) !important; /* blue-300 */
        }
        .certificate-override .bg-gradient-to-br {
          background: linear-gradient(135deg, rgb(239, 246, 255), rgb(224, 231, 255)) !important;
        }
        .certificate-override .bg-blue-600 {
          background-color: rgb(37, 99, 235) !important;
        }
        .certificate-override .text-blue-900 {
          color: rgb(30, 58, 138) !important;
        }
        .certificate-override .text-blue-800 {
          color: rgb(30, 64, 175) !important;
        }
        .certificate-override .text-blue-700 {
          color: rgb(29, 78, 216) !important;
        }
        .certificate-override .text-blue-600 {
          color: rgb(37, 99, 235) !important;
        }
        .certificate-override .border-blue-200 {
          border-color: rgb(191, 219, 254) !important;
        }
        .certificate-override .border-blue-300 {
          border-color: rgb(147, 197, 253) !important;
        }
        .certificate-override .text-white {
          color: rgb(255, 255, 255) !important;
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
          toast.success('Certificate downloaded successfully!');
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      
      // Fallback: Show a message with instructions to screenshot
      toast.error('Certificate generation failed. Please take a screenshot of the certificate below to save it.');
      
      // Alternative: Try to print the certificate
      try {
        const printWindow = window.open('', '_blank');
        if (printWindow && certificateRef.current) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Certificate - ${course?.title}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                  .certificate { 
                    background: linear-gradient(135deg, #eff6ff, #e0e7ff);
                    border: 4px solid #bfdbfe;
                    border-radius: 8px;
                    padding: 48px;
                    text-align: center;
                    min-height: 500px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                  }
                  .icon { 
                    background: #2563eb;
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
                  .title { font-size: 32px; font-weight: bold; color: #1e3a8a; margin-bottom: 24px; }
                  .text { font-size: 18px; color: #1e40af; margin-bottom: 12px; }
                  .name { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 16px 0; }
                  .course { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 16px 0 24px; }
                  .details { display: flex; justify-content: center; gap: 32px; color: #1d4ed8; margin-top: 24px; }
                  .detail { text-align: center; }
                  .detail-label { font-weight: bold; margin-bottom: 4px; }
                  .footer { margin-top: 32px; padding-top: 24px; border-top: 2px solid #93c5fd; font-size: 14px; color: #2563eb; }
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button onClick={() => router.push('/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(`/courses/${courseId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            Course Completed
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Award className="h-6 w-6" />
            Certificate of Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">
                Congratulations! You have successfully completed the course.
              </p>
              <Button
                onClick={generateCertificate}
                disabled={isGenerating}
                size="lg"
                className="mb-6 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </>
                )}
              </Button>
            </div>

            {/* Certificate Preview */}
            <div
              ref={certificateRef}
              className="p-12 rounded-lg border-4 text-center shadow-lg"
              style={{ 
                minHeight: '500px',
                background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
                borderColor: '#bfdbfe'
              }}
            >
              <div className="space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full" style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
                    <Award className="h-12 w-12" />
                  </div>
                </div>
                
                <h1 className="text-4xl font-bold mb-4" style={{ color: '#1e3a8a' }}>
                  Certificate of Completion
                </h1>
                
                <div className="text-lg" style={{ color: '#1e40af' }}>
                  <p className="mb-2">This certifies that</p>
                  <p className="text-2xl font-bold mb-4" style={{ color: '#1e3a8a' }}>
                    {session?.user?.name || 'Student'}
                  </p>
                  <p className="mb-2">has successfully completed</p>
                  <p className="text-2xl font-bold mb-6" style={{ color: '#1e3a8a' }}>
                    {course.title}
                  </p>
                </div>
                
                <div className="flex justify-center items-center gap-8" style={{ color: '#1d4ed8' }}>
                  <div className="text-center">
                    <p className="font-semibold">Instructor</p>
                    <p>{course.author.username}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Date</p>
                    <p>{completedAt}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Progress</p>
                    <p>{Math.round(progress)}%</p>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t-2" style={{ borderColor: '#93c5fd' }}>
                  <p className="text-sm" style={{ color: '#2563eb' }}>
                    Let&apos;s Learn - Online Learning Platform
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
