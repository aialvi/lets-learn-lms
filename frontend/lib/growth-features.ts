import {
  Award,
  BarChart3,
  Brain,
  MessageSquareText,
  Route,
  Timer,
  Users,
} from 'lucide-react';

export const competitiveLmsFeatures = [
  {
    title: 'AI study coach',
    description:
      'Learners get lesson-aware prompts, recap questions, and next-step guidance without leaving the course flow.',
    icon: Brain,
  },
  {
    title: 'Skills-based paths',
    description:
      'Courses map to practical capabilities so learners can follow role goals instead of browsing disconnected content.',
    icon: Route,
  },
  {
    title: 'Microlearning drills',
    description:
      'Short practice loops help learners retain concepts through quick challenges and retrieval practice.',
    icon: Timer,
  },
  {
    title: 'Predictive learner health',
    description:
      'Progress, watch time, and lesson completion are turned into simple risk signals and interventions.',
    icon: BarChart3,
  },
  {
    title: 'Credential moments',
    description:
      'Completion paths highlight portfolio outcomes, certificates, and proof learners can share.',
    icon: Award,
  },
  {
    title: 'Mentor and cohort loops',
    description:
      'Social learning prompts create peer accountability and reduce course abandonment.',
    icon: Users,
  },
];

export const skillTracks = [
  {
    name: 'AI-ready builder',
    fit: 'Best for technical learners',
    skills: ['Prompt workflows', 'Automation', 'Applied projects'],
    nextAction: 'Complete one project lesson and write a recap.',
  },
  {
    name: 'Product operator',
    fit: 'Best for managers and founders',
    skills: ['Discovery', 'Analytics', 'Launch planning'],
    nextAction: 'Pick one course and define a measurable outcome.',
  },
  {
    name: 'Creative specialist',
    fit: 'Best for design and marketing learners',
    skills: ['Storytelling', 'Visual systems', 'Campaign thinking'],
    nextAction: 'Save a course and create a portfolio artifact.',
  },
];

export const microChallenges = [
  {
    title: '3-minute recall',
    prompt: 'Write the three most important ideas from your last lesson without checking notes.',
  },
  {
    title: 'One-screen summary',
    prompt: 'Turn the lesson into five bullets a teammate could act on today.',
  },
  {
    title: 'Apply it once',
    prompt: 'Use one concept in a real task, then mark the lesson complete.',
  },
];

export const coachPrompts = [
  'Explain the next lesson like I am new to the topic.',
  'Quiz me on the last lesson with five short questions.',
  'Build a 7-day study plan from my current courses.',
  'Show what skill this course improves and how to prove it.',
];

export const growthSignals = [
  {
    label: 'Personalized paths',
    value: 'Skills-first',
  },
  {
    label: 'Retention loop',
    value: 'Microdrills',
  },
  {
    label: 'Admin value',
    value: 'Risk signals',
  },
  {
    label: 'Sales proof',
    value: 'Credentials',
  },
];

export const socialLearningPrompts = [
  {
    title: 'Peer accountability',
    description: 'Pair learners around the same skill track and prompt weekly check-ins.',
    icon: MessageSquareText,
  },
  {
    title: 'Outcome sharing',
    description: 'Ask learners to publish project takeaways when they complete a course.',
    icon: Award,
  },
];
