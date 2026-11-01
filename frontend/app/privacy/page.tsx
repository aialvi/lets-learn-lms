import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, } from '@/components/ui/card';
import { 
  Shield, 
  Eye, 
  Database, 
  Cookie,
  Share2,
  Settings,
  Mail,
  Lock
} from 'lucide-react';

export const metadata = {
  title: "Privacy policy",
  description: "How Let's Learn collects and uses your data.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main id="main-content" className="container-page w-full flex-1 max-w-4xl py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: July 8, 2025
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
              <Shield aria-hidden="true" className="h-5 w-5 text-primary" />
              Introduction
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              At Let&apos;s Learn, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our website, mobile application, 
              and services. By using our Service, you consent to the data practices described in this policy.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
              <Database aria-hidden="true" className="h-5 w-5 text-primary" />
              Information We Collect
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Personal Information</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                We collect personal information that you voluntarily provide to us, including:
              </p>
              <ul className="text-muted-foreground text-sm space-y-1 ml-4">
                <li>• Name and email address</li>
                <li>• Account credentials and profile information</li>
                <li>• Payment information (processed securely by third-party providers)</li>
                <li>• Communication preferences and settings</li>
                <li>• Course reviews and feedback</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Usage Information</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                We automatically collect information about how you use our Service:
              </p>
              <ul className="text-muted-foreground text-sm space-y-1 ml-4">
                <li>• Course progress and completion data</li>
                <li>• Learning analytics and performance metrics</li>
                <li>• Device information and browser type</li>
                <li>• IP address and location data</li>
                <li>• Log files and usage patterns</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Cookies and Tracking</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, 
                analyze usage patterns, and provide personalized content. You can control 
                cookie preferences through your browser settings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Information */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
              <Eye aria-hidden="true" className="h-5 w-5 text-primary" />
              How We Use Your Information
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Service Provision</h3>
              <ul className="text-muted-foreground text-sm space-y-1 ml-4">
                <li>• Create and manage your account</li>
                <li>• Provide access to courses and learning materials</li>
                <li>• Track your progress and issue certificates</li>
                <li>• Process payments and manage subscriptions</li>
                <li>• Provide customer support and technical assistance</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Communication</h3>
              <ul className="text-muted-foreground text-sm space-y-1 ml-4">
                <li>• Send important service updates and notifications</li>
                <li>• Respond to your inquiries and support requests</li>
                <li>• Send marketing communications (with your consent)</li>
                <li>• Notify you of course updates and new offerings</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Improvement and Analytics</h3>
              <ul className="text-muted-foreground text-sm space-y-1 ml-4">
                <li>• Analyze usage patterns to improve our Service</li>
                <li>• Personalize your learning experience</li>
                <li>• Develop new features and course recommendations</li>
                <li>• Ensure security and prevent fraud</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Information Sharing */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Information Sharing and Disclosure
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">We Do Not Sell Your Data</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third 
                parties for their marketing purposes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Limited Sharing</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                We may share your information in the following circumstances:
              </p>
              <ul className="text-muted-foreground text-sm space-y-1 ml-4">
                <li>• With service providers who assist in operating our Service</li>
                <li>• When required by law or to protect our rights</li>
                <li>• In connection with a business transfer or merger</li>
                <li>• With your explicit consent</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Course Instructors</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Course instructors may see aggregate data about student progress and engagement 
                but do not have access to your personal information unless you choose to share it.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
              <Lock aria-hidden="true" className="h-5 w-5 text-primary" />
              Data Security
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Security Measures</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                We implement appropriate technical and organizational measures to protect your data:
              </p>
              <ul className="text-muted-foreground text-sm space-y-1 ml-4">
                <li>• Encryption of data in transit and at rest</li>
                <li>• Regular security assessments and updates</li>
                <li>• Access controls and authentication measures</li>
                <li>• Secure payment processing through certified providers</li>
                <li>• Regular data backups and disaster recovery procedures</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data Retention</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We retain your personal information only as long as necessary to provide our 
                services and fulfill the purposes outlined in this policy, or as required by law.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
              <Settings aria-hidden="true" className="h-5 w-5 text-primary" />
              Your Rights and Choices
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Access and Control</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                You have the right to:
              </p>
              <ul className="text-muted-foreground text-sm space-y-1 ml-4">
                <li>• Access and update your personal information</li>
                <li>• Delete your account and associated data</li>
                <li>• Opt out of marketing communications</li>
                <li>• Request a copy of your data</li>
                <li>• Correct inaccurate information</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Cookie Controls</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You can control cookies through your browser settings. Note that disabling certain 
                cookies may affect the functionality of our Service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data Portability</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You can request a copy of your data in a structured, commonly used format. 
                Contact us to exercise this right.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
              <Cookie aria-hidden="true" className="h-5 w-5 text-primary" />
              Cookies and Tracking Technologies
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Essential Cookies</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                These cookies are necessary for the Service to function and cannot be switched off. 
                They are usually set in response to actions you take, such as logging in or filling forms.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Performance Cookies</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                These cookies help us understand how you interact with our Service by collecting 
                anonymous information about page visits and user behavior.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Functionality Cookies</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                These cookies enable enhanced functionality and personalization, such as remembering 
                your preferences and providing customized content.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* International Users */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight">International Users</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Our Service is operated from the United States. If you are accessing our Service from 
              outside the United States, please be aware that your information may be transferred to, 
              stored, and processed in the United States.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We comply with applicable data protection laws and implement appropriate safeguards 
              to protect your information during international transfers.
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight">Children&apos;s Privacy</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Our Service is not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13. If you become aware that a child 
              has provided us with personal information, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Privacy Policy */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight">Changes to This Privacy Policy</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. 
              We encourage you to review this Privacy Policy periodically for any changes.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
              <Mail aria-hidden="true" className="h-5 w-5 text-primary" />
              Contact Us
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="text-sm space-y-1">
              <p><strong>Email:</strong> privacy@letslearn.com</p>
              <p><strong>Address:</strong> 123 Learning Street, Education City, EC 12345</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
