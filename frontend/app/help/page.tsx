import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { HelpContent } from './help-content';
import { 
  BookOpen, 
  Users, 
  Settings, 
  CreditCard,
  HelpCircle,
  Mail,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: "Help center",
  description: "Answers to common questions and ways to get support.",
};

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I enroll in a course?",
      answer: "Browse our courses page, select a course that interests you, and click the 'Enroll Now' button. You'll need to create an account if you haven't already."
    },
    {
      question: "Can I access courses offline?",
      answer: "Currently, our courses require an internet connection to access. We're working on offline capabilities for future updates."
    },
    {
      question: "How do I track my progress?",
      answer: "Your progress is automatically tracked as you complete lessons. You can view your progress on your dashboard or course page."
    },
    {
      question: "Do I get a certificate upon completion?",
      answer: "Yes! Upon completing a course, you'll receive a digital certificate that you can share on your professional profiles."
    },
    {
      question: "How can I contact an instructor?",
      answer: "You can reach out to instructors through the course discussion forums or send them a direct message through the course page."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept major credit cards, PayPal, and other secure payment methods. All transactions are encrypted and secure."
    }
  ];

  const helpCategories = [
    {
      title: "Getting Started",
      icon: BookOpen,
      description: "Learn the basics of using our platform",
      articles: [
        "Creating your account",
        "Navigating the dashboard",
        "Finding the right courses",
        "Setting up your profile"
      ]
    },
    {
      title: "Courses & Learning",
      icon: Users,
      description: "Everything about taking courses",
      articles: [
        "How to enroll in courses",
        "Understanding course structure",
        "Submitting assignments",
        "Participating in discussions"
      ]
    },
    {
      title: "Account & Settings",
      icon: Settings,
      description: "Manage your account preferences",
      articles: [
        "Updating your profile",
        "Notification settings",
        "Privacy controls",
        "Password management"
      ]
    },
    {
      title: "Billing & Payments",
      icon: CreditCard,
      description: "Payment and subscription help",
      articles: [
        "Payment methods",
        "Billing cycles",
        "Refund policy",
        "Subscription management"
      ]
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main id="main-content" className="container-page w-full flex-1 max-w-6xl py-12 md:py-16">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Help center</h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Find answers to common questions and get the support you need.
          </p>
        </header>

        <section aria-label="Ways to get help" className="mb-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: Mail, title: 'Email support', text: 'Get a reply from our team within 24 hours.', href: '/contact', cta: 'Contact us' },
            { icon: HelpCircle, title: 'Browse the FAQ', text: 'Quick answers to the most common questions.', href: '#faq', cta: 'View FAQ' },
            { icon: MessageSquare, title: 'Community', text: 'Ask questions in your course discussions.', href: '/courses', cta: 'Go to courses' },
          ].map(({ icon: Icon, title, text, href, cta }) => (
            <div key={title} className="surface flex flex-col items-start p-6">
              <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h2 className="font-semibold text-foreground">{title}</h2>
              <p className="mb-5 mt-1 flex-1 text-sm leading-6 text-muted-foreground">{text}</p>
              <Button asChild size="sm" variant="outline">
                <Link href={href}>{cta}</Link>
              </Button>
            </div>
          ))}
        </section>

        <section aria-labelledby="topics-heading" className="mb-14">
          <h2 id="topics-heading" className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
            Help topics
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {helpCategories.map((category) => (
              <div key={category.title} className="surface p-6">
                <div className="mb-4 flex items-start gap-3">
                  <category.icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
                  {category.articles.map((article) => (
                    <li key={article} className="flex items-center gap-2">
                      <span aria-hidden="true" className="size-1 rounded-full bg-muted-foreground/60" />
                      {article}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <HelpContent faqs={faqs} />

        <section className="surface mt-14 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">Still need help?</h2>
          <p className="mb-6 text-muted-foreground">Our support team is here to help you succeed.</p>
          <Button asChild size="lg">
            <Link href="/contact">Get in touch</Link>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
