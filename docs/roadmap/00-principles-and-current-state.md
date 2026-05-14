# 00 — Principles & current state

## 1. Operating principles (founder-stated, do not rewrite)

| # | Principle | Practical consequence |
|---|---|---|
| P1 | **Dev speed is the most important thing.** | Cut scope before adding scope. Three similar lines beats a premature abstraction. |
| P2 | **No unit / integration tests until after GTM.** | We will not write Vitest, Jest, Playwright, or Prisma test factories until we have a sizeable client base and proof of profitability. The chat simulator at `/chat-simulator` is the only regression harness we maintain. |
| P3 | **Pilot first, billing second.** | The pilot is **free**. No subscription gate touches a pilot account. Billing logic is built in parallel to the pilot, not before it. |
| P4 | **Edge case only counts as "pre-pilot" if a pilot customer is likely to hit it in week one.** | Double-sync calendar race — yes. Multilingual — depends on pilot mix. Token overage UX — no, deferred. |
| P5 | **Tenant does as little as possible.** | Every onboarding step is a place a non-technical owner gives up. Cut steps before adding features. |
| P6 | **Tech Provider for the pilot. Solution Partner only after paid revenue.** | Manual Meta payment-method add in WhatsApp Manager is OK for the pilot. Don't pay for / wait on Solution Partner application yet. |
| P7 | **Trust the spreadsheet for vertical priority.** | Default services + landing copy + pilot recruitment all target the eight **Priority 1** verticals. Existing `DENTIST` / `MECHANIC` seeds were the demo, not the GTM. |

## 2. Where we are today

### 2.1 Built and working (from [`docs/app-overview.md` §7](../app-overview.md))

- Google sign-in with Calendar scopes (Auth.js v5).
- Auto-trial subscription on first sign-in (30 days, no card).
- Profession-based onboarding for `DENTIST` and `MECHANIC` with seeded services.
- LangChain agent with five tools: `get_services`, `get_availability`, `book_appointment`, `cancel_appointment`, `get_business_hours`. Gemini default, OpenAI optional per tenant.
- WhatsApp via **Meta Cloud API** or **Twilio**, manual credential paste path.
- Google Calendar availability + event create/delete.
- Dashboard: services CRUD, appointments, conversations, settings.
- Revolut Hosted Checkout — single `$25/month` tier, `Subscription` lifecycle, `Payment` audit, signed webhooks, polling fallback, discount codes, cancellation.
- Revolut autopay scaffolded (`src/lib/revolut-autopay.ts`, `/api/cron/billing-renew`).
- Privacy policy, terms of service, data deletion, refund policy, sitemap, footer.

### 2.2 Built but **never validated by a real third party**

This is the single most important section of the document.

| Item | Why it's a risk |
|---|---|
| **WhatsApp Embedded Signup (Tech Provider)** | We are wired as Tech Provider in `.env.example` (`NEXT_PUBLIC_FACEBOOK_APP_ID`, `NEXT_PUBLIC_WHATSAPP_ES_CONFIG_ID`). [`whatsapp-embedded-signup.tsx`](../../src/components/whatsapp-embedded-signup.tsx) exists. **We do not know if a real business owner can complete it without a screen-share.** This is the #1 pre-pilot validation. |
| **Tenant Meta payment-method add in WhatsApp Manager** | Required as Tech Provider before messages flow. We've never timed a non-technical owner doing this. |
| **Revolut live checkout with a real card** | All testing has been sandbox. The branching by card number (`REVOLUT_TEST_CARD_NUMBER`) is novel. |
| **Revolut autopay end-to-end** | Coded, never exercised on a live customer. |
| **e-Factura (Romania)** | Not built. Mandatory for B2B RO since Jan 2024 → blocker for any paid RO tenant. |
| **VAT collection** | Not built. Required as Mythril-Tech SRL the moment we cross the registration threshold or take an EU-VAT-registered B2B customer (reverse charge). |

### 2.3 Known gaps that are **not** pre-pilot (deferred by design)

From `docs/app-overview.md §7.8`:
- Tiered plans + token allowance + overage metering and billing.
- Customer entity (today: `(userId, customerPhone)` pair).
- Multilingual responses (English-only prompt).
- `reschedule_appointment` tool — **this one moves into pre-pilot** (see [`01-pre-pilot.md`](./01-pre-pilot.md)).
- Cron-based reminders (WhatsApp + email).
- Outbound transactional email (resend already in deps).
- Tests of any kind.
- Customer/booking analytics.
- Tenant-side manual appointment editing UI.
- Meta webhook signature verification — **moves into pre-pilot** (small, security-relevant, 1-hour task).
- More professions in the enum — **moves into pre-pilot** for the Priority 1 verticals.

### 2.4 Stack at a glance

| Layer | Choice | Notes |
|---|---|---|
| Hosting | Vercel | Cron via Vercel Cron Jobs. |
| DB | Supabase Postgres + Prisma | Pooled `DATABASE_URL`, direct `DIRECT_URL`. |
| Auth | Auth.js v5 (Google) | Calendar scopes already requested. |
| AI | LangChain over Gemini / OpenAI | Per-tenant switch via `User.llmProvider`. |
| Messaging | Meta Cloud API + Twilio | Unified provider interface in `src/lib/whatsapp/`. |
| Payments | Revolut Merchant API | Hosted Checkout today; recurring via stored payment-method id. |
| Email (planned) | Resend (already a dep, no sender code yet) | Outbound only — confirmations / reminders / receipts. |

## 3. What "done with pre-pilot" looks like

A non-technical owner can:

1. Sign in with Google in <30s.
2. Pick their vertical from a **list that includes their actual business type**, and see services that look right for them with one click.
3. Click **one button** to connect WhatsApp via Embedded Signup; the only step that pulls them out of our flow is the WhatsApp Manager payment-method add, and we have documented copy that walks them through it.
4. Send a test message from their personal WhatsApp to their business number and see the AI book a real appointment that lands in their Google Calendar.
5. Hit "share with my customers" and get a copy-pasteable WhatsApp link / QR.

…all within **15 minutes**, without a screen-share with us. That's the gate to start the free pilot.

The pre-pilot stage doc ([`01-pre-pilot.md`](./01-pre-pilot.md)) is the specific work list to reach this.
