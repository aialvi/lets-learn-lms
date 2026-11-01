import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ContactForm } from './contact-form';
import { 
  Mail, 
  MapPin, 
  Phone, 
  Clock,
  Send,
  MessageSquare,
  HelpCircle,
  Users
} from 'lucide-react';

export const metadata = {
  title: "Contact us",
  description: "Get in touch with the Let's Learn team.",
};

export default function ContactPage() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email within 24 hours",
      contact: "support@letslearn.com",
      href: "mailto:support@letslearn.com",
      availability: "24/7"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our support team",
      contact: "+1 (555) 123-4567",
      href: "tel:+15551234567",
      availability: "Mon-Fri, 9AM-6PM EST"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      contact: "Available on website",
      href: undefined as string | undefined,
      availability: "Mon-Fri, 9AM-6PM EST"
    },
    {
      icon: MapPin,
      title: "Office Location",
      description: "Visit our headquarters",
      contact: "123 Learning Street, Education City, EC 12345",
      availability: "Mon-Fri, 9AM-5PM EST"
    }
  ];

  const departments = [
    {
      name: "General Support",
      description: "Account issues, course questions, and general inquiries"
    },
    {
      name: "Technical Support",
      description: "Platform issues, bugs, and technical difficulties"
    },
    {
      name: "Billing & Payments",
      description: "Payment issues, refunds, and subscription management"
    },
    {
      name: "Course Content",
      description: "Questions about course materials and curriculum"
    },
    {
      name: "Partnership",
      description: "Business partnerships and collaboration opportunities"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main id="main-content" className="container-page w-full flex-1 max-w-6xl py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Contact Us
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            We&apos;re here to help! Reach out to us with any questions, concerns, or feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
                <Send aria-hidden="true" className="h-5 w-5 text-primary" />
                Send us a Message
              </h2>
            </CardHeader>
            <CardContent>
              <ContactForm departments={departments} />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
                  <HelpCircle aria-hidden="true" className="h-5 w-5 text-primary" />
                  Get in Touch
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contactMethods.map((method, index) => (
                    <div key={index} className="flex items-start gap-3 rounded-lg p-3">
                      <method.icon aria-hidden="true" className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold">{method.title}</h3>
                        <p className="text-sm text-muted-foreground mb-1">
                          {method.description}
                        </p>
                        <p className="text-sm font-medium">
                          {method.href ? (
                            <a className="link" href={method.href}>
                              {method.contact}
                            </a>
                          ) : (
                            method.contact
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock aria-hidden="true" className="h-3 w-3" />
                          {method.availability}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
                  <Users aria-hidden="true" className="h-5 w-5 text-primary" />
                  Departments
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {departments.map((dept, index) => (
                    <div key={index} className="border-b pb-3 last:border-b-0">
                      <h3 className="font-semibold text-sm">{dept.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {dept.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Help */}
        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-lg font-semibold leading-tight tracking-tight">Need Quick Help?</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <HelpCircle aria-hidden="true" className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Check our FAQ</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Find answers to common questions
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/help#faq">View FAQ</Link>
                </Button>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <MessageSquare aria-hidden="true" className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Browse guides</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Step-by-step help for accounts, courses, and billing
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/help">Visit help center</Link>
                </Button>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <Mail aria-hidden="true" className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Email Us</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Send us an email for detailed help
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a href="mailto:support@letslearn.com">Send email</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <section className="mt-8 rounded-xl bg-muted p-6 text-center">
          <h2 className="mb-3 font-semibold">Response times</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Email:</strong> Within 24 hours
            </div>
            <div>
              <strong>Live Chat:</strong> Immediate during business hours
            </div>
            <div>
              <strong>Phone:</strong> Immediate during business hours
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
