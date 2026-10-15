/** Add an illustrative learning history to an existing local account. */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { AdminService } = require('../dist/admin/admin.service');
const ProgressService = require('../dist/progress/progress.service').default;

const db = new PrismaClient();
const username = process.argv[2] || 'lyxodyhaxi';
const courses = [
  {
    slug: 'web-development', title: 'Modern Web Development', completed: 2,
    description: 'Build a responsive website from the first semantic HTML element to a polished, accessible interface. Practice layout, interaction, and deployment in a small portfolio project.',
    lessons: [
      ['Structure a meaningful page', 'Start with the content, then choose HTML elements that explain its purpose. Use one main heading, descriptive link text, and landmarks for navigation and main content. Practice: outline a portfolio homepage using header, main, section, and footer.'],
      ['Build responsive layouts', 'Use CSS Grid for page structure and Flexbox for smaller groups of controls. Begin with a single column, add space with a consistent scale, and introduce columns only when the content has room. Practice: build a card grid that adapts from one to three columns.'],
      ['Add accessible interactions', 'Use real buttons for actions and links for navigation. Give form inputs visible labels and keep keyboard focus visible. Practice: build a contact form and navigate every control using only the keyboard.'],
      ['Ship your portfolio', 'Review the page at narrow and wide screen sizes. Compress images, check heading order, and write a short project README explaining your decisions. Practice: prepare your portfolio for deployment and document one improvement you would make next.'],
    ],
  },
  {
    slug: 'data-analysis', title: 'Data Analysis Essentials', completed: 4,
    description: 'Turn a messy spreadsheet into a clear business story. Learn to clean data, ask useful questions, choose the right chart, and explain a recommendation with evidence.',
    lessons: [
      ['Ask a question the data can answer', 'Define the decision before opening a spreadsheet. Identify the audience, the metric, the time window, and the unit of analysis. Practice: write a question about weekly customer retention and list the columns needed to answer it.'],
      ['Clean and validate your dataset', 'Check missing values, duplicate rows, inconsistent categories, and unexpected date formats. Keep an untouched copy of the source. Practice: create a cleaning log with each transformation and its reason.'],
      ['Explore patterns with simple charts', 'Use a line chart for change over time and a bar chart for category comparisons. Label axes clearly and report the sample size. Practice: compare weekly retention by signup cohort and identify a question that needs more evidence.'],
      ['Present a defensible recommendation', 'Separate observation from interpretation. Explain what the data supports, what remains uncertain, and which action you recommend. Practice: write a five-sentence briefing with one chart and a measurable next step.'],
    ],
  },
  {
    slug: 'product-design', title: 'Product Design Foundations', completed: 1,
    description: 'Design useful digital experiences through research, clear information architecture, and thoughtful prototyping. Finish with a tested concept and a concise design case study.',
    lessons: [
      ['Understand the user and the task', 'Focus interviews on recent behavior rather than hypothetical preferences. Ask what the person tried to do, where they struggled, and how they worked around the problem. Practice: draft five questions for a learner choosing an online course.'],
      ['Map a simple user journey', 'List the steps from discovery to a successful outcome. Highlight uncertainty, waiting, and repeated effort. Practice: map a course enrollment journey and identify the most useful improvement.'],
      ['Prototype the critical path', 'Start with low-fidelity screens that show hierarchy and navigation. Keep the primary action clear and include empty and error states. Practice: sketch a catalog, a course detail page, and an enrollment confirmation.'],
      ['Test and explain your decisions', 'Give participants a realistic task without telling them where to click. Observe hesitation and ask neutral follow-up questions. Practice: summarize three findings, revise the prototype, and write a short case study.'],
    ],
  },
  {
    slug: 'team-leadership', title: 'Leading Collaborative Teams', completed: 3,
    description: 'Create clarity, build trust, and help a team make progress together. Practice active listening, useful feedback, effective meetings, and sustainable delivery habits.',
    lessons: [
      ['Create clarity around outcomes', 'A useful team goal describes the result, the owner, and how progress will be checked. Discuss constraints early and write down decisions. Practice: turn a vague project brief into one outcome and three observable milestones.'],
      ['Listen before solving', 'Ask open questions and reflect back what you heard before offering advice. Check assumptions and make space for quieter voices. Practice: prepare a one-to-one conversation with questions about goals, blockers, and support.'],
      ['Give feedback that helps', 'Describe a specific behavior and its effect, then ask for the other person’s perspective. Agree on a small next step. Practice: rewrite a vague criticism as an observation, an impact, and an invitation to discuss.'],
      ['Run a useful retrospective', 'Review what happened without assigning blame. Identify one practice to keep and one experiment to try. Practice: design a 25-minute retrospective that ends with an owner and a review date.'],
    ],
  },
  {
    slug: 'creative-photography', title: 'Visual Storytelling & Photography', completed: 0,
    description: 'Tell a stronger story with composition, natural light, and a consistent visual sequence. Create a four-image photo essay with a clear subject and thoughtful editing.',
    lessons: [
      ['Find the story in a scene', 'Choose a subject and decide what you want the viewer to notice. Remove distracting elements from the frame. Practice: photograph the same subject from three viewpoints and explain which image communicates most clearly.'],
      ['Work with natural light', 'Observe the direction and softness of light before changing settings. Window light and open shade are useful starting points. Practice: photograph an object in three lighting conditions and compare texture and contrast.'],
      ['Compose with intention', 'Use leading lines, negative space, and foreground elements to guide attention. Treat composition rules as tools rather than requirements. Practice: make a pair of images that use different compositions to express different moods.'],
      ['Edit a cohesive photo essay', 'Select images that establish context, show detail, and provide a closing moment. Keep editing consistent and preserve the meaning of the scene. Practice: assemble four photographs with short captions into a single story.'],
    ],
  },
  {
    slug: 'python-foundations', title: 'Python for Everyday Automation', completed: 2,
    description: 'Save time with small, readable Python programs. Learn core language concepts, work with files, validate input, and build a practical automation script you can maintain.',
    lessons: [
      ['Think in small, testable steps', 'Write down the input, the transformation, and the expected output before coding. Use descriptive variable names and keep each function focused. Practice: describe an expense-summary script in plain language.'],
      ['Use collections and functions', 'Lists hold ordered items and dictionaries connect keys to values. Functions give a repeated operation a clear name. Practice: group a list of expenses by category and calculate totals with a reusable function.'],
      ['Read and validate files', 'Use the csv and pathlib modules to read structured files. Check required columns and report malformed rows clearly. Practice: load a small expense file and produce a helpful message when a value is missing.'],
      ['Build a reliable automation', 'Keep configuration separate from logic, handle expected errors, and avoid overwriting source files. Practice: generate a monthly summary into a new file and write instructions for running the script again.'],
    ],
  },
];

async function main() {
  const learner = await db.user.findUnique({ where: { username } });
  if (!learner) throw new Error(`Account ${username} does not exist. Register it before seeding.`);
  const admin = await db.user.findFirst({ where: { role: 'admin' }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('Create a platform administrator before seeding.');
  const adminService = new AdminService(db);
  const progressService = new ProgressService(db);
  const now = new Date();
  await db.membership.upsert({ where: { organizationId_userId: { organizationId: 'default-academic', userId: learner.id } }, update: {}, create: { organizationId: 'default-academic', userId: learner.id, role: 'learner' } });
  const summary = [];
  for (const [index, definition] of courses.entries()) {
    const imageUrl = `/images/courses/${definition.slug}.jpg`;
    let course = await db.course.findFirst({ where: { title: definition.title, authorId: admin.id, organizationId: 'default-academic' } });
    if (!course) course = await adminService.createCourse({ title: definition.title, description: definition.description, price: 0, instructorId: admin.id, imageUrl });
    else await db.course.update({ where: { id: course.id }, data: { imageUrl } });
    const existing = await db.enrollment.findUnique({ where: { userId_courseId: { userId: learner.id, courseId: course.id } } });
    if (!existing) await db.enrollment.create({ data: { userId: learner.id, courseId: course.id, createdAt: new Date(now.getTime() - (12 - index * 2) * 86400000) } });
    for (const [lessonIndex, [title, content]] of definition.lessons.entries()) {
      const id = `sample-${definition.slug}-${lessonIndex + 1}`;
      await db.lesson.upsert({ where: { id }, update: {}, create: { id, courseId: course.id, title, content, order: lessonIndex + 1 } });
    }
    for (const [lessonIndex] of definition.lessons.entries()) {
      const id = `sample-${definition.slug}-${lessonIndex + 1}`;
      // Re-running the seed never rewinds the learner's subsequent progress.
      const recorded = await db.videoProgress.findUnique({ where: { userId_lessonId: { userId: learner.id, lessonId: id } } });
      if (!recorded && lessonIndex < definition.completed) await progressService.updateVideoProgress(learner.id, { courseId: course.id, lessonId: id, completed: true, watchTime: 720 + index * 60 + lessonIndex * 90 });
    }
    summary.push({ title: course.title, courseId: course.id, sampleCompletedLessons: definition.completed, lessons: 4 });
  }
  console.log(JSON.stringify({ username, authoredBy: admin.username, courses: summary }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
