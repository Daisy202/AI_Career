# CareerGuide ZW — AI Career Guidance System

## Overview

An AI-driven web application providing personalized career and academic guidance for pre-university students in Zimbabwe. Students complete a career assessment questionnaire and receive tailored career recommendations, job market insights, and can chat with a Gemini AI career advisor.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TypeScript (artifacts/career-guidance)
- **Backend**: Express 5 + Node.js (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Charts**: Recharts
- **State management**: Zustand
- **AI Chatbot**: Google Gemini 2.0 Flash
- **Forms**: React Hook Form + Zod resolvers
- **Animations**: Framer Motion

## Structure

```text
artifacts/
├── api-server/              # Express 5 backend
│   └── src/
│       ├── lib/
│       │   ├── careerData.ts   # Career dataset + recommendation engine
│       │   └── gemini.ts       # Gemini AI chatbot integration
│       └── routes/
│           ├── careers.ts      # Career CRUD + recommendations
│           ├── jobs.ts         # Job market data + insights
│           └── chat.ts         # Gemini AI chat endpoint
└── career-guidance/         # React + Vite frontend
    └── src/
        ├── pages/
        │   ├── landing.tsx        # Home/landing page
        │   ├── assessment.tsx     # Multi-step career questionnaire
        │   ├── recommendations.tsx # AI career recommendations
        │   ├── career-detail.tsx  # Individual career details
        │   ├── dashboard.tsx      # Charts and analytics
        │   ├── chat.tsx           # Gemini AI chatbot page
        │   └── feedback.tsx       # User feedback form
        ├── components/
        │   ├── layout.tsx         # Navbar + layout wrapper
        │   └── ui-elements.tsx    # Reusable UI components
        └── store/
            └── use-career-store.ts # Zustand store for student profile

lib/
├── api-spec/openapi.yaml    # OpenAPI 3.1 spec (source of truth)
├── api-client-react/        # Generated React Query hooks
├── api-zod/                 # Generated Zod validation schemas
└── db/
    └── src/schema/
        └── careers.ts       # careers + feedback DB tables
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/careers | List all 12 careers |
| GET | /api/careers/:id | Get career by ID |
| POST | /api/recommend | Get AI career recommendations |
| GET | /api/insights?career= | Job market insights |
| GET | /api/jobs?query= | Job listings (mock data) |
| POST | /api/chat | Gemini AI career advisor |
| POST | /api/feedback | Submit user feedback |
| GET | /api/healthz | Health check |

## Career Dataset

12 careers covering: Technology, Business & Finance, Engineering, Education, Healthcare, Law, Agriculture, Media & Communication, Social Sciences.

## Environment Variables / Secrets

- `DATABASE_URL` — PostgreSQL connection (auto-provisioned)
- `GEMINI_API_KEY` — Google Gemini API key for AI chatbot

## TypeScript & Composite Projects

- `lib/*` packages are composite and emit declarations via `tsc --build`
- `artifacts/*` are leaf workspace packages checked with `tsc --noEmit`
- Root `tsconfig.json` is a solution file for libs only

## Running Codegen

After changes to `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```
