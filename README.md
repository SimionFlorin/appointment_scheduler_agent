# ScheduleAI - AI-Powered Appointment Scheduling

An AI receptionist that handles appointment booking via WhatsApp, powered by Google Gemini. Built for dentists, mechanics, and service professionals.

## How It Works

1. **Sign in with Google** — grants access to Google Calendar
2. **Choose your profession** — pre-loaded services for dentists and mechanics
3. **Connect WhatsApp** — Meta Cloud API or Twilio
4. **AI takes over** — customers book via WhatsApp, the AI checks your calendar and confirms appointments

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Auth**: Auth.js v5 (Google OAuth with Calendar scopes)
- **Database**: PostgreSQL via Prisma ORM (designed for Supabase)
- **WhatsApp**: Meta WhatsApp Cloud API + Twilio (user chooses)
- **AI**: Google Gemini with function calling
- **UI**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Google Cloud project with OAuth credentials
- WhatsApp Business API access (Meta) or Twilio account
- Google Gemini API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `GEMINI_API_KEY` — from Google AI Studio

### 3. Set up the database

```bash
npx prisma db push
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials (Web Application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Enable the **Google Calendar API**
5. Add scopes: `calendar.events`, `calendar.readonly`

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. WhatsApp Setup

#### Option A: Meta Cloud API
1. Create an app at [developers.facebook.com](https://developers.facebook.com)
2. Add WhatsApp product
3. Get your Phone Number ID, WABA ID, and generate a System User access token
4. Set your webhook URL to `https://your-domain.com/api/webhooks/whatsapp`
5. Set the verify token to match your `WHATSAPP_VERIFY_TOKEN` env var
6. Enter these in Settings > WhatsApp in the dashboard

#### Option B: Twilio
1. Create a [Twilio account](https://www.twilio.com)
2. Enable WhatsApp Sandbox or get an approved sender
3. Set webhook URL to `https://your-domain.com/api/webhooks/whatsapp`
4. Enter Account SID, Auth Token, and phone number in Settings > WhatsApp

## Deploy to Vercel

```bash
vercel
```

Set all environment variables in Vercel project settings. Update `NEXTAUTH_URL` to your production domain. Update Google OAuth redirect URIs and WhatsApp webhook URLs accordingly.

## Project Structure

```
src/
  app/
    (auth)/login/          — Sign in page
    (dashboard)/
      dashboard/           — Overview with stats
      services/            — CRUD for services
      appointments/        — Appointment management
      conversations/       — AI conversation logs
      settings/            — WhatsApp config, business profile, hours
    api/
      auth/[...nextauth]/  — Auth.js handlers
      webhooks/whatsapp/   — WhatsApp webhook (Meta + Twilio)
      services/            — Services API
      appointments/        — Appointments API
      settings/profile/    — Business profile API
      whatsapp/connect/    — WhatsApp connection API
      onboarding/          — Onboarding API
    page.tsx               — Landing page
  lib/
    auth.ts                — Auth.js config with Google Calendar scopes
    prisma.ts              — Prisma client singleton
    google-calendar.ts     — Calendar availability & event management
    gemini-agent.ts        — Gemini function-calling scheduling agent
    defaults.ts            — Default services per profession
    whatsapp/
      index.ts             — Unified WhatsApp interface
      meta-provider.ts     — Meta Cloud API implementation
      twilio-provider.ts   — Twilio implementation
  components/
    ui/                    — shadcn/ui components
    dashboard/             — Dashboard shell/nav
```
