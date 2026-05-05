# AGENTS.md

## Cursor Cloud specific instructions

### Overview

BookMe AI is an AI-powered receptionist / appointment-scheduling SaaS. Tech stack: Next.js 16 (App Router), Prisma ORM, PostgreSQL, Auth.js v5 (Google OAuth), LangChain (Gemini/OpenAI), shadcn/ui. See `README.md` for full architecture and project structure.

### Quick reference

| Task | Command |
|------|---------|
| Install deps | `npm install` (runs `prisma generate` via `postinstall`) |
| Dev server | `npm run dev` → http://localhost:3000 |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Push schema | `npx prisma db push` |

### Local PostgreSQL

The VM uses a local PostgreSQL 16 instance. The database and user are pre-configured:

- DB: `bookme_dev`, User: `bookme`, Password: `bookme_dev_pass`
- Connection: `postgresql://bookme:bookme_dev_pass@localhost:5432/bookme_dev`

Before running `npm run dev` or `npx prisma db push`, ensure PostgreSQL is running:

```bash
pg_ctlcluster 16 main start
```

### Environment variables

A `.env` file is needed in the project root. Copy `.env.example` and fill in values. For local dev, placeholder values work for most fields — the app starts and renders pages without real Google OAuth or Gemini keys. Real keys are needed for:

- **Google OAuth login** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- **AI agent / chat simulator** (`GEMINI_API_KEY` or `OPENAI_API_KEY`)
- **Billing** (`REVOLUT_SANDBOX_API_SECRET_KEY`, `REVOLUT_SANDBOX_API_PUBLIC_KEY`)

### Gotchas

- `npm run lint` has pre-existing errors (React hooks `set-state-in-effect`, unescaped entities, `no-require-imports`). These are in the existing codebase, not regressions.
- `npm run build` succeeds despite lint errors (Next.js build does not fail on ESLint errors by default).
- The `postinstall` script runs `prisma generate`, so `npm install` is sufficient to regenerate the Prisma client after schema changes.
- There are no automated test suites (no `test` script in `package.json`). Validation is done via lint, build, and manual testing.
- The Chat Simulator at `/chat-simulator` can test the AI agent end-to-end without real WhatsApp credentials, but requires a valid `GEMINI_API_KEY`.
- If `DATABASE_URL` / `DIRECT_URL` / `AUTH_SECRET` are set as environment variables (e.g. via Cursor secrets), they **override** values in `.env`. The dev server uses the environment variable values. Keep this in mind when generating session tokens or running `prisma db push`.
- The subscription gate blocks access to most dashboard pages. When seeding test data, create a `Subscription` with `status: 'TRIALING'` and a future `trialEndsAt` to bypass the paywall.
- To create a valid session token for testing authenticated API routes without real Google OAuth, use `@auth/core/jwt`'s `encode()` with the correct `AUTH_SECRET` value and salt `authjs.session-token`.
