import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  Target, 
  Award, 
  Heart, 
  Lightbulb,
  Globe,
  Shield
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: "About us",
  description: "Learn about Let's Learn and our mission.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main id="main-content" className="container-page w-full flex-1 max-w-4xl py-12 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            About Let&apos;s Learn
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Empowering learners worldwide with high-quality, accessible education 
            that transforms lives and builds the future.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
              <Target aria-hidden="true" className="h-5 w-5 text-primary" />
              Our Mission
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              At Let&apos;s Learn, we believe that education is the key to unlocking human potential. 
              Our mission is to make high-quality learning accessible to everyone, regardless of 
              their background, location, or circumstances. We strive to create an inclusive 
              platform where learners can grow their skills, pursue their passions, and 
              achieve their goals.
            </p>
          </CardContent>
        </Card>

        {/* Values Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold leading-tight tracking-tight flex items-center gap-2">
                  <Heart aria-hidden="true" className="h-5 w-5 text-primary" />
                  Accessibility
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We&apos;re committed to making learning accessible to everyone, 
                  breaking down barriers and creating opportunities for all.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold leading-tight tracking-tight flex items-center gap-2">
                  <Award aria-hidden="true" className="h-5 w-5 text-primary" />
                  Excellence
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We maintain the highest standards in course content, 
                  platform design, and user experience.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold leading-tight tracking-tight flex items-center gap-2">
                  <Lightbulb aria-hidden="true" className="h-5 w-5 text-primary" />
                  Innovation
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We continuously evolve our platform with cutting-edge 
                  technology to enhance the learning experience.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold leading-tight tracking-tight flex items-center gap-2">
                  <Users aria-hidden="true" className="h-5 w-5 text-primary" />
                  Community
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We foster a supportive community where learners and 
                  instructors can connect, collaborate, and grow together.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight text-center">Our Impact</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-semibold text-primary mb-2">10,000+</div>
                <p className="text-muted-foreground">Active Learners</p>
              </div>
              <div>
                <div className="text-3xl font-semibold text-primary mb-2">500+</div>
                <p className="text-muted-foreground">Courses Available</p>
              </div>
              <div>
                <div className="text-3xl font-semibold text-primary mb-2">50+</div>
                <p className="text-muted-foreground">Expert Instructors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Story Section */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
              <BookOpen aria-hidden="true" className="h-5 w-5 text-primary" />
              Our Story
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Founded in 2024, Let&apos;s Learn began as a simple idea: to create a platform 
              where anyone could access high-quality education. What started as a small 
              project has grown into a comprehensive learning ecosystem that serves 
              thousands of students worldwide.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our team of dedicated educators, developers, and designers work tirelessly 
              to ensure that every course meets our high standards of quality and engagement. 
              We partner with industry experts and thought leaders to bring you the most 
              relevant and up-to-date content.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, Let&apos;s Learn continues to evolve, driven by our community&apos;s feedback 
              and the ever-changing landscape of education technology. We&apos;re proud to be 
              part of your learning journey and committed to helping you achieve your goals.
            </p>
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight">Why Choose Let&apos;s Learn?</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Globe aria-hidden="true" className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Global Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn from anywhere, anytime, with our responsive platform.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield aria-hidden="true" className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Secure Platform</h3>
                  <p className="text-sm text-muted-foreground">
                    Your data and progress are protected with industry-standard security.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users aria-hidden="true" className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Expert Instructors</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn from industry professionals and academic experts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award aria-hidden="true" className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Certificates</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn recognized certificates to showcase your achievements.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of learners and start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/courses">Browse Courses</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
