## Cursor Cloud specific instructions

### Product overview

BookMe AI is an AI-powered receptionist SaaS that handles appointment scheduling via WhatsApp, powered by Google Gemini. See `README.md` for full details on setup, tech stack, and project structure.

### Running the dev server

```bash
source /home/ubuntu/.nvm/nvm.sh && nvm use 22
npm run dev          # starts Next.js 16 on http://localhost:3000
```

### Required services

| Service | Notes |
|---------|-------|
| **PostgreSQL** | Remote Supabase-hosted DB via `DATABASE_URL`/`DIRECT_URL` env vars (no local Postgres needed). |
| **Next.js dev server** | `npm run dev` — uses Turbopack by default in Next.js 16. |

### Environment variables

All secrets are injected as environment variables. The `.env` file must be created from these env vars before running the app. Key required vars: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY`.

### Lint & build

- **Lint:** `npm run lint` — uses ESLint 9 flat config. Pre-existing lint errors exist in the codebase (setState-in-effect, unescaped entities, unused vars, require import); these are not regressions.
- **Build:** `npm run build` — runs `prisma generate && next build`.

### Database

- Prisma schema at `prisma/schema.prisma` targets a Supabase PostgreSQL instance.
- `npx prisma db push` syncs the schema. Use `--accept-data-loss` if there are column drops with existing data.
- `prisma generate` runs automatically via the `postinstall` script.

### Key gotchas

- Node.js must be activated via nvm before any npm command: `source /home/ubuntu/.nvm/nvm.sh && nvm use 22`.
- The app uses `package-lock.json` (npm), not pnpm/yarn.
- The `.env` file must exist before running the app. Secrets are injected as shell env vars; write them to `.env` using the var names from `.env.example`.
- Auth requires Google OAuth (sign in redirects to Google). Dashboard and chat-simulator routes return 307 redirects when unauthenticated.
- The WhatsApp webhook verify endpoint (`GET /api/webhooks/whatsapp`) requires `hub.verify_token` matching the `WHATSAPP_VERIFY_TOKEN` env var.
- Next.js 16 uses Turbopack by default in dev mode; no extra flag needed.
