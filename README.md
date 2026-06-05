# Let's Learn LMS

A full-stack learning management system built with Next.js, NestJS, Prisma, and SQLite. The product includes course delivery, video progress tracking, admin management, learner dashboards, and AI-powered study coach.

## Features

### Learners
- Browse courses and view course details.
- Enroll in courses and continue lessons from the dashboard.
- Track video watch time, completed lessons, and course progress.
- Use the learner cockpit for skill readiness, microlearning drills, and recent activity.
- Ask the AI study coach for lesson-aware guidance, quizzes, study plans, and proof-of-learning prompts.

### Growth LMS Features
- Skills-based learning paths and recommended next actions.
- AI coach workflow backed by OpenRouter.
- Microlearning drills for recall and retention.
- Learner health signals based on progress and completion activity.
- Credential and social-learning positioning on the homepage.

### Admin
- Manage users, courses, and lessons.
- View platform-level dashboard stats.
- Role-based access for students, instructors, and admins.

## Tech Stack

### Frontend
- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Radix UI primitives
- NextAuth.js
- Axios

### Backend
- NestJS
- TypeScript
- Prisma ORM
- SQLite for local development
- Passport JWT authentication
- Swagger/OpenAPI docs
- OpenRouter chat completions API

## Project Structure

```text
lets-learn/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── admin/
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── enrollments/
│   │   ├── lessons/
│   │   ├── progress/
│   │   ├── prisma/
│   │   └── users/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── .env.example
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- npm for the backend
- pnpm or npm for the frontend
- OpenRouter API key for live AI coach responses

## Environment Setup

Create local env files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Backend `.env`

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=change-me-in-production
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/auto
```

Set `OPENROUTER_API_KEY` to a real key from https://openrouter.ai/keys to enable the AI study coach. Keep real keys out of git.

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-in-production
```

## Install

```bash
cd backend
npm install

cd ../frontend
pnpm install
```

If you prefer npm in the frontend, use `npm install`; the repo currently includes a pnpm lockfile.

## Database

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

For local schema changes during development:

```bash
npx prisma migrate dev
```

## Run Locally

Start the backend:

```bash
cd backend
npm run start:dev
```

Start the frontend:

```bash
cd frontend
pnpm dev
```

Local URLs:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger docs: http://localhost:3001/api

## AI Study Coach

The dashboard AI Coach tab calls:

```text
POST /ai/study-coach
```

The endpoint:
- Requires JWT authentication.
- Reads `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` from backend env.
- Enriches the learner prompt with enrolled courses, lessons, video progress, and watch time.
- Sends a bounded chat completion request to OpenRouter.
- Returns the coach response, model, generation id, and token usage when provided.

The default model is:

```env
OPENROUTER_MODEL=openrouter/auto
```

You can replace it with a specific OpenRouter model id.

## Main API Areas

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Courses
- `GET /courses`
- `GET /courses/:id`
- `POST /courses`
- `PATCH /courses/:id`
- `DELETE /courses/:id`

### Lessons
- `GET /lessons`
- `POST /lessons`
- `PATCH /lessons/:id`
- `DELETE /lessons/:id`

### Enrollments
- `POST /enrollments`
- `GET /enrollments/my-courses`
- `PUT /enrollments/progress`
- `GET /enrollments/:courseId/status`

### Progress
- `GET /progress/video/:courseId`
- `GET /progress/video/lesson/:lessonId`
- `PUT /progress/video`

### AI
- `POST /ai/study-coach`

### Admin
- `GET /admin/dashboard`
- `GET /admin/users`
- `POST /admin/users`
- `GET /admin/courses`
- `POST /admin/courses`
- `GET /admin/lessons`
- `POST /admin/lessons`

## Scripts

### Backend

```bash
npm run start:dev
npm run build
npm run start:prod
npm run test
npm run lint
```

### Frontend

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Verification

Run both builds before shipping:

```bash
cd backend
npm run build

cd ../frontend
pnpm build
```

## Deployment Notes

- Set production `JWT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `FRONTEND_URL`, and `OPENROUTER_API_KEY`.
- Run `npx prisma migrate deploy` during backend deployment.
- Restart the backend after changing OpenRouter env values.
- Do not expose `OPENROUTER_API_KEY` to the frontend. The frontend should call the protected backend AI endpoint.
