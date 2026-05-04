# AGENTS.md

## Cursor Cloud specific instructions

### Overview

BookMe AI is an AI-powered appointment scheduling SaaS built with **Next.js 16** (App Router), **TypeScript**, **Prisma** (PostgreSQL), and **Tailwind CSS 4**. It integrates Google Calendar, WhatsApp (Meta/Twilio), Google Gemini/OpenAI for AI, and Revolut for billing.

### Services

| Service | How to run | Notes |
|---|---|---|
| **Next.js dev server** | `npm run dev` | Runs on port 3000 |
| **PostgreSQL** | `sudo pg_ctlcluster 16 main start` | Must be running before dev server or Prisma commands |

### Key commands

See `package.json` scripts. Summary:

- **Dev server**: `npm run dev`
- **Lint**: `npm run lint` (ESLint — the codebase has pre-existing lint errors)
- **Build**: `npm run build` (runs `prisma generate` then `next build`)
- **Prisma schema push**: `npx prisma db push`

### Non-obvious caveats

- PostgreSQL must be started before running the dev server or any Prisma commands. The local dev database is `bookme` with user `bookme` / password `bookme` on `localhost:5432`.
- `npm install` automatically runs `prisma generate` via the `postinstall` script.
- The `.env` file uses placeholder values for Google OAuth, Gemini API key, and other external services. The app starts and renders pages fine with placeholders, but Google Sign-In and AI features require real credentials.
- The app has a built-in **Chat Simulator** at `/chat-simulator` for testing the AI agent without a real WhatsApp connection.
- ESLint (`npm run lint`) has pre-existing errors in the codebase (React hooks setState-in-effect warnings, unescaped entities, no-require-imports). These are not blocking for development.
