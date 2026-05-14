# Phase 0 — App dev-readiness audit & gating

> **Today's date: 2026-05-14.** Phase 0 starts now. Nothing in [`02-track-a-…`](./02-track-a-whatsapp-signup-pilots.md), [`03-track-b-…`](./03-track-b-billing-taxes.md), [`05-track-d-…`](./05-track-d-gtm-launch.md) or [`06-pilot-playbook.md`](./06-pilot-playbook.md) begins until Phase 0 is signed off. Track C (vertical defaults) overlaps because it is a precondition of Phase 0's dogfood flow.

This document exists because the previous draft of this roadmap assumed the product works. It does not — or, more honestly, **we do not know that it works**. We have shipped code; we have not proven that an end-to-end run completes from "tenant signs up" through "customer books" through "calendar event lands" through "subscription charges" without manual intervention.

Phase 0 is how we find out. It is a comprehensive pre-pilot audit, fix list, and dogfood plan that ends with a written "yes, we believe a stranger can use this and not break" sign-off. Only then do pilots start.

---

## 1. Audit — what is built today

Done by reading the repo on **2026-05-14**. File pointers are to the version of code at that date.

### 1.1 What appears built and probably works

| Capability | Where | Evidence |
|---|---|---|
| Auth + Google OAuth with Calendar scopes | [`src/lib/auth.ts`](../../src/lib/auth.ts) | Auth.js v5; tokens stored on `User` |
| Schema for tenants, services, appointments, conversations, WA config, subscription, payments, payment methods, webhooks | [`prisma/schema.prisma`](../../prisma/schema.prisma) | Comprehensive |
| AI agent (LangChain) with `get_services`, `get_availability`, `book_appointment`, `cancel_appointment`, `get_business_hours` tools | [`src/lib/ai-agent.ts`](../../src/lib/ai-agent.ts) | 481 LOC; switchable Gemini / OpenAI |
| WhatsApp webhook (Meta + Twilio) | [`src/app/api/webhooks/whatsapp/route.ts`](../../src/app/api/webhooks/whatsapp/route.ts) | Detects provider by content-type |
| Google Calendar freebusy + event create/delete with timezone math | [`src/lib/google-calendar.ts`](../../src/lib/google-calendar.ts) | Uses `freebusy.query`, business-hours config |
| Revolut Hosted Checkout (sandbox + live) | [`src/lib/revolut.ts`](../../src/lib/revolut.ts), [`REVOLUT_INTEGRATION.md`](../../REVOLUT_INTEGRATION.md) | Working order create + retrieve |
| Autopay cron @ 11:00 UTC daily | [`src/app/api/cron/billing-renew/route.ts`](../../src/app/api/cron/billing-renew/route.ts), [`vercel.json`](../../vercel.json) | Bounded to 100/run, with `CRON_SECRET` |
| Saved payment method handling | [`src/lib/revolut-autopay.ts`](../../src/lib/revolut-autopay.ts) | Merchant-scope methods only |
| Embedded signup token exchange | [`src/app/api/whatsapp/embedded-signup/route.ts`](../../src/app/api/whatsapp/embedded-signup/route.ts), [`src/components/whatsapp-embedded-signup.tsx`](../../src/components/whatsapp-embedded-signup.tsx) | Code-for-token via Graph API v21.0 |
| Chat simulator (offline tenant testing without WhatsApp) | [`src/app/(dashboard)/chat-simulator/page.tsx`](../../src/app/(dashboard)/chat-simulator/page.tsx) | Available |
| Subscription gating + trial banner | [`src/components/dashboard/subscription-banner.tsx`](../../src/components/dashboard/subscription-banner.tsx), [`subscription-gate.tsx`](../../src/components/dashboard/subscription-gate.tsx) | Wired in dashboard layout |

### 1.2 What is built but unproven

These exist in the code but we have **no evidence** they work end-to-end. Phase 0 either proves them or fixes them.

| Capability | Concern |
|---|---|
| Meta embedded signup end-to-end (production) | Requires `whatsapp_business_management` Meta App Review approval. Status: **unknown to this document**. The fact that we have [`whatsapp-error-131031-troubleshooting.md`](../../whatsapp-error-131031-troubleshooting.md) suggests we have already hit Meta-side issues. |
| Autopay renewal in production | Cron is wired; we have not observed a real renewal complete end-to-end with the live keys + webhook + invoice. |
| Webhook signature verification | `verifyWebhookSignature` exists in [`src/lib/whatsapp/meta-provider.ts`](../../src/lib/whatsapp/meta-provider.ts) but is **not called** anywhere in [`src/app/api/webhooks/whatsapp/route.ts`](../../src/app/api/webhooks/whatsapp/route.ts). Any HTTP client can POST a forged message. |
| AI agent quality on real tenant data | We have not measured booking accuracy, hallucinated-slot rate, or how it handles edge cases (no slots, ambiguous date, "the cheapest one"). |
| Two-way Google Calendar sync | The agent writes events to the tenant's calendar, but **if the tenant manually creates, edits, or deletes an event in Google Calendar, the app does not know**. There is no webhook subscription on the tenant's calendar. The schema's `googleCalendarEventId` is only used outbound. |
| Concurrency on booking | If two customers ask for the same slot at the same second, both calls hit `getAvailableSlots` and both succeed because there is no lock between the freebusy read and the calendar write. |
| Revolut webhook signature verification | Wired in [`src/lib/revolut-webhook.ts`](../../src/lib/revolut-webhook.ts) via `signingSecret`. Need to confirm secrets are actually set in prod env and verify a forged webhook is rejected. |
| Conversation persistence under load | Conversations are stored as a JSON array on the `Conversation` row. A long conversation does many `update` calls that rewrite the entire JSON; race conditions are possible when the customer sends two messages quickly. |

### 1.3 What is documented but not built

| Capability | Source |
|---|---|
| **Token Allowance / Token Overage metering (R2 revenue)** | `docs/app-overview.md` §3.2; explicitly "not yet implemented" |
| **Per-vertical defaults beyond DENTIST/MECHANIC** | xlsx lists 55 verticals, code has 2 |
| **Tax / VAT / invoice generation / e-Factura** | No code path; charges are flat $25 USD |
| **Outbound transactional email** | [`docs/messaging-channels-strategy.md`](../messaging-channels-strategy.md) calls it "worth it"; not built |
| **Refund / credit-note flow** | No code path |
| **Dunning emails** | `failedAttempts` increments but no email is sent |
| **Customer-side cancellation acknowledgement** | AI tool exists; flow with the tenant's calendar on cancel is unconfirmed |
| **Pilot tagging** | `User.isPilot` flag does not exist |

### 1.4 Risk / quality gaps in code

| Gap | File |
|---|---|
| **Zero automated tests** in repo (`find` for `*.test.*` / `*.spec.*` returned nothing) | n/a |
| **Webhook signature not verified** on inbound Meta WhatsApp | [`src/app/api/webhooks/whatsapp/route.ts`](../../src/app/api/webhooks/whatsapp/route.ts) |
| **LLM model IDs look like previews**: `gemini-3.1-flash-lite-preview`, `gpt-5-mini` | [`src/lib/ai-agent.ts`](../../src/lib/ai-agent.ts) |
| **`NEXTAUTH_URL` used in code but only `AUTH_URL` shipped via Auth.js v5** | [`src/lib/google-calendar.ts`](../../src/lib/google-calendar.ts) line ~10 |
| **`OPENAI_API_KEY` referenced in code but missing from [`.env.example`](../../.env.example)** | [`src/lib/ai-agent.ts`](../../src/lib/ai-agent.ts) |
| **Default timezone `America/New_York`** for an RO-targeted product | [`prisma/schema.prisma`](../../prisma/schema.prisma) `BusinessProfile.timezone` |
| **Always-200 webhook responses** mask real failures from Meta's retry behaviour | [`src/app/api/webhooks/whatsapp/route.ts`](../../src/app/api/webhooks/whatsapp/route.ts) |
| **Token + customer name PII in `Conversation.messages` JSON** with no retention policy | [`prisma/schema.prisma`](../../prisma/schema.prisma) |
| **No "panic switch"** to disable AI for a single tenant if it misbehaves | n/a — we should ship one |
| **No structured `ApiLog` retention or rotation**; just `console.log` | [`src/lib/api-log.ts`](../../src/lib/api-log.ts) |
| **No idempotency** on the Revolut webhook beyond DB unique constraints | [`src/lib/revolut-webhook.ts`](../../src/lib/revolut-webhook.ts) |

These are the issues we can find from reading. Dogfooding (§4) will surface more.

---

## 2. The 12 critical user flows — every one must demonstrably work

A "user flow" here is a single sentence describing a thing a real person does. We list them, mark current confidence, and define acceptance criteria. Phase 0 ends when every flow has a green check on its acceptance row.

### F1 — Tenant signs up, lands on onboarding
- Steps: Visit `/login` → "Sign in with Google" → consent to Calendar scopes → `/onboarding`.
- Confidence today: **High** (standard Auth.js v5 with Google).
- Acceptance: a fresh Google account completes this in <30s. `User` row created. `Subscription` row created with `TRIALING` and 30-day `trialEndsAt`.

### F2 — Tenant picks vertical + business profile
- Steps: `/onboarding` → choose vertical → fill business name + phone + address + timezone → submit.
- Confidence today: **Medium.** Only DENTIST / MECHANIC exist. Default timezone is `America/New_York`. Vertical taxonomy refactor pending.
- Acceptance: tenant picks from at least the 3 pilot verticals (barber, nails, auto repair). Default services seeded. Timezone defaults to browser TZ on first load. `BusinessProfile` row populated.

### F3 — Tenant connects WhatsApp via embedded signup
- Steps: `/onboarding` → "Connect WhatsApp" → Meta JS SDK FB.login → consent screens → callback delivers `code`, `wabaId`, `phoneNumberId` → POST `/api/whatsapp/embedded-signup` → token exchange → `WhatsAppConfig` row created → webhook subscription on the WABA.
- Confidence today: **Low.** Meta App Review status unknown; we have a 131031 troubleshooting doc on file.
- Acceptance: a non-pilot, non-test Meta account that we control completes embedded signup end-to-end, can receive a test message via `/api/whatsapp/test-send`, and the webhook fires on inbound.

### F4 — Tenant connects WhatsApp via Twilio fallback
- Steps: `/settings` → Twilio path → paste Account SID + Auth Token + WhatsApp number → save.
- Confidence today: **Medium.** Simple paste; no validation that the creds are actually valid for messaging.
- Acceptance: invalid creds are rejected at save (Twilio test call). Valid creds successfully send a test message.

### F5 — Customer messages tenant; AI replies
- Steps: customer sends "hi" to tenant's WA number → Meta hits `/api/webhooks/whatsapp` → AI agent runs → reply sent → `Conversation.messages` updated.
- Confidence today: **Medium.** The code exists; we have not measured under realistic conditions (Romanian language? mixed RO/EN? voice notes? media?).
- Acceptance: 20 scripted conversations across 3 verticals, in EN and RO, complete without an error. Voice notes and media messages are gracefully refused, not crashed on. Group chat messages are ignored.

### F6 — Customer books an appointment via the AI
- Steps: customer asks for an appointment → AI calls `get_services` → asks date → calls `get_availability` → presents slots → customer picks one → AI calls `book_appointment` → Calendar event created → `Appointment` row created → confirmation sent.
- Confidence today: **Medium.** Existing code path; not measured on accuracy.
- Acceptance: in 20 scripted conversations, ≥18 produce a correct `Appointment` row with matching `googleCalendarEventId`, no double-booking, no hallucinated slot, no wrong service.

### F7 — Tenant edits/cancels appointment from Google Calendar
- Steps: tenant opens Google Calendar → drags an AI-booked event to a different time → app reflects the change.
- Confidence today: **Likely broken.** No calendar-watch / webhook subscription exists in the codebase.
- Acceptance: when tenant edits/deletes in Google Calendar, the `Appointment` row updates (or the next customer query reads correct state). Either via Calendar `watch` + push webhook, or via a "lazy reconciliation on read" pattern (acceptable for v1).

### F8 — Customer cancels via the AI
- Steps: customer messages "cancel my appointment for tomorrow" → AI confirms → `cancel_appointment` tool runs → calendar event deleted → `Appointment.status = CANCELLED`.
- Confidence today: **Low.** Code path exists; no test data.
- Acceptance: 5 scripted cancellation conversations succeed; tenant calendar reflects within 30s; tenant receives a notification.

### F9 — Trial expires, tenant is gated to /billing
- Steps: `trialEndsAt` passes → tenant logs in → `SubscriptionGate` redirects to `/billing` for non-billing routes.
- Confidence today: **High.** Code path exists in [`subscription-gate.tsx`](../../src/components/dashboard/subscription-gate.tsx).
- Acceptance: with `trialEndsAt = now - 1d` set in DB, all dashboard routes except `/billing`, `/settings`, `/onboarding` redirect. WhatsApp webhooks still receive (do not silently drop messages just because tenant is past-due — see open question §9 below).

### F10 — Tenant pays via Revolut Hosted Checkout
- Steps: `/billing` → "Subscribe" → Revolut order created → checkout URL opened → card entered → success → webhook `ORDER_COMPLETED` → `Subscription.status = ACTIVE` → next charge scheduled.
- Confidence today: **Medium.** Sandbox path likely works (we have docs). Live path unobserved.
- Acceptance: a live charge of $1 (using a real founder card, then refunded) end-to-end: order, payment, webhook, status update, payment method saved, `nextChargeAt` set 1 month out.

### F11 — Autopay renews tenant on the cron
- Steps: `nextChargeAt < now` → cron at 11:00 UTC picks the sub → creates order with saved payment method → charges → `Subscription.currentPeriodEnd` extended.
- Confidence today: **Medium.** Code is comprehensive; not observed live.
- Acceptance: with `nextChargeAt` manually set to a past timestamp on a test tenant with a saved live payment method, the next cron run charges $1 successfully and extends the period.

### F12 — Failed charge enters dunning, then PAST_DUE, then EXPIRED
- Steps: cron tries to charge → payment fails → `failedAttempts++` → retry scheduled → after 3 fails → `PAST_DUE` → after grace → `EXPIRED`.
- Confidence today: **Low.** Code increments attempts and flips to `PAST_DUE`, but there is **no grace-period → EXPIRED transition**, **no notification email**, and the retry delays are hard-coded.
- Acceptance: with a test tenant whose saved card is a Revolut-sandbox decline card, the dunning sequence runs to completion, lands in `EXPIRED`, AI is disabled, dashboard gated. Plus: an email is sent at each step (requires Track 3 § email work, but can be a logged `[email]` stub for Phase 0).

---

## 3. The 12 fixes Phase 0 ships

For each gap above, the minimum work that makes the flow demonstrable. Sequenced for speed.

| ID | Fix | Effort | Blocker for flow |
|---|---|---|---|
| **P0-1** | Verify Meta App Review status; submit if not approved; document the App ID, configuration ID, and approved permissions in `docs/operations/meta-app-review.md`. | S (eng) + external review queue 1–3 wks | F3 |
| **P0-2** | Wire Meta webhook signature verification on `POST /api/webhooks/whatsapp` using `X-Hub-Signature-256` header. Reject unsigned/forged payloads in prod (allow bypass behind `WHATSAPP_VERIFY_SIGNATURES=0` for local). | S | F5, security |
| **P0-3** | Refactor `Profession` enum into `Vertical` taxonomy seeded for all 8 priority verticals (Track C §4). This is **moved into Phase 0** because we cannot dogfood as "a barber" if the only options are DENTIST and MECHANIC. | M | F2, dogfood |
| **P0-4** | Add `User.isPilot: Boolean` and `Appointment.isTest` + `Conversation.isTest` are already there. Add a "panic switch": `User.aiEnabled: Boolean @default(true)`. When `false`, webhook stores the message but does not call the LLM, instead sends a configurable fallback ("we'll reply soon"). | S | F5, R5 |
| **P0-5** | Fix model identifiers in `ai-agent.ts`. Pick a stable, documented model from the chosen provider (Gemini Flash 1.5 or whatever latest stable is at the time) and pin it. Add a `LLM_MODEL_GEMINI` and `LLM_MODEL_OPENAI` env var override. | S | F5/F6 reliability |
| **P0-6** | Calendar two-way sync (or lazy reconciliation): before any `get_availability` call, reconcile the next 7 days of `Appointment` rows against `events.list`. Mark deleted/moved events and update local state. (Watch webhooks can come post-launch.) | M | F7 |
| **P0-7** | Booking concurrency guard: serialise `book_appointment` per `(userId, startTime)` via an advisory PG lock, or a check-and-insert pattern that fails on a unique constraint `(userId, startTime, status IN SCHEDULED/CONFIRMED)`. | S | F6, double-booking |
| **P0-8** | End-to-end smoke test script (`scripts/smoke/e2e.ts`) that, given a clean test DB, walks F1→F6 against staging using Twilio sandbox + a test customer number + a real test tenant Google account. Runnable locally and on Vercel preview. | M | gate everything |
| **P0-9** | Minimal unit tests for billing math: `activateSubscription` period boundaries, dunning state transitions, `computeTaxScheme` once that lands. Use Vitest. **No mocking of the whole app** — pure-function tests only. | S | F10/F11/F12 |
| **P0-10** | Observability minimum: ship structured logs with a `requestId` per webhook + cron run; surface errors to a single channel (Sentry or `console.error` to Vercel logs at minimum). Per-tenant log-search shortcut. | S | dogfood diagnosis |
| **P0-11** | Cleanups: align `NEXTAUTH_URL` / `AUTH_URL`, add `OPENAI_API_KEY` to `.env.example`, default timezone in `BusinessProfile` to `Europe/Bucharest` (or browser TZ) instead of `America/New_York`. | XS | small but real |
| **P0-12** | "AI panic" UI: a toggle in `/settings` that calls `User.aiEnabled = false` instantly. Show prominently when AI is off. | S | tenant safety |

`XS` = <½ day, `S` = ≤1 day, `M` = 2–4 days, `L` = 1 week+.

---

## 4. Dogfood plan — the founders run BookMe AI on a real number for ≥2 weeks

This is the **single most important Phase 0 activity**. Code changes happen; what dogfooding produces is **proof under realistic conditions**. Without it we are guessing.

### 4.1 Setup (Week 1 of Phase 0)

- Create a real Meta WhatsApp business number for a **fake but plausible** business — e.g. "BookMe Demo Barber Shop, Bucharest." Verify the business.
- Use a real Google account with a real (empty) Google Calendar for that business.
- Pick "Barber shop" as the vertical (Track C P0-3 ships this in advance).
- Connect via embedded signup — **using the real production path**, not the founder bypass we will undoubtedly be tempted to add.

### 4.2 Daily run (Weeks 1–2 of Phase 0)

Each weekday, founders + friends send 5–10 customer-style messages to the demo number and log:

- Did the AI book correctly?
- Did the calendar event match?
- Did the AI ever respond nonsensically?
- Did it ever miss a message?

Founder also acts as the tenant: edits the calendar, cancels appointments, simulates a busy day with overlapping requests.

This produces a **dogfood diary** (`docs/operations/dogfood-2026-Q2.md`) with one line per event. The diary is the artifact. By the end of week 2 we expect ≥100 booking-flow events logged.

### 4.3 Friction list

Every event in the diary that produced an error, an awkward response, a wrong booking, or a manual fix becomes an entry in the **friction list**. Friction items are triaged P0 / P1 / P2:

- **P0**: blocks pilots. Must be fixed before Phase 0 sign-off.
- **P1**: ugly but workaround exists. Fix during pilots.
- **P2**: nice to have. Backlog.

We expect the dogfood diary to surface 5–15 P0s the audit did not catch. That is its job.

### 4.4 Billing dogfood

In parallel, the founder runs the billing flow against their own card:

- Activates the trial → lets it expire on a test account → pays $25 live → observes invoice (won't exist yet) and saved card.
- Triggers a manual `nextChargeAt = now` to force the cron to renew → observes the cron run.
- Triggers a failure (Revolut decline card) → observes dunning → confirms PAST_DUE / EXPIRED transitions (P0-9 unit tests cover the math; this confirms it on real Revolut).

---

## 5. The Phase 0 sign-off

Phase 0 is signed off (and the four tracks begin) when **all** of the following are true. Each row is a checkbox.

| # | Criterion | How verified |
|---|---|---|
| 1 | F1–F12 each have a green acceptance row | The flow has been demonstrated end-to-end in staging or prod, with a screenshot + log link in the dogfood diary |
| 2 | Meta App Review status is approved (or explicitly fallback to Twilio for v1 pilots) | App Review dashboard screenshot in `docs/operations/meta-app-review.md` |
| 3 | All P0-1 … P0-12 are shipped to main and deployed | Merged PRs linked in this doc |
| 4 | Smoke test (P0-8) passes against staging in CI for ≥3 consecutive days | GitHub Actions / Vercel build log |
| 5 | Dogfood diary has ≥100 booking-flow events logged across ≥10 days | `docs/operations/dogfood-2026-Q2.md` |
| 6 | Friction list has zero open P0s | Same doc |
| 7 | One real live $1 charge has been issued, refunded, and the full chain (order → webhook → status → payment method save → cron → invoice stub) has been observed | Operations log + Revolut dashboard screenshot |
| 8 | One scheduled autopay has charged and renewed in production on a test tenant | Same |
| 9 | One forced dunning cycle has run to `EXPIRED` on a test tenant | Same |
| 10 | "Panic switch" disables AI within 1 minute of being toggled | Tested live |
| 11 | All sensitive credentials are in env vars only, not in DB plaintext (re-audit `WhatsAppConfig.metaAccessToken`, `twilioAuthToken`) | Code grep + remediation plan (see §6) |
| 12 | A written go/no-go is signed by founder + lead eng | This doc, §7 |

If 11 of 12 are green and the 1 missing is non-critical, founder may waive with a written rationale. Anything else: Phase 0 continues.

---

## 6. Things Phase 0 does not fully solve

Documented so we are not surprised by them in Phase 1.

- **Token-overage metering (R2)** is not in Phase 0. It lands in Phase 1 Track 3 §B7.
- **Tax-correct invoicing** is not in Phase 0. Phase 0 produces a logged invoice stub; real invoices land in Phase 1 Track 3.
- **Romanian e-Factura** is not in Phase 0. Phase 1.
- **Outbound email** is not in Phase 0 beyond a `console.log` email stub. Phase 1.
- **Encryption-at-app-layer for tenant Meta tokens / Twilio auth tokens.** Today they are in DB plaintext, relying on Supabase at-rest encryption. We document this in `docs/operations/credential-storage.md` and plan an envelope-encryption pass in Phase 1 if the tax advisor or a customer raises it.
- **GDPR Article-30 record of processing / DPA** is not in Phase 0. Phase 1.

These are deliberate; Phase 0 is about **does the appointment booking actually work**, not about commercial compliance. Commercial compliance is Phase 1 Track 3's job.

---

## 7. Sign-off

When Phase 0 acceptance is green, fill this in:

```
Phase 0 sign-off — BookMe AI app readiness

Date: ____
Signed: ____ (founder), ____ (lead eng)

Notes / caveats / waived criteria:
  -
  -
  -

Approved tracks to begin:
  [ ] Track 1 — WhatsApp signup validation + pilots (was Track A)
  [ ] Track 2 — Billing hardening, taxes, invoicing  (was Track B)
  [ ] Track 3 — Remaining vertical defaults           (was Track C, partial in Phase 0)
  [ ] Track 4 — Pricing, GTM, public launch           (was Track D)
```

After sign-off, the four tracks in [`02-track-a-…`](./02-track-a-whatsapp-signup-pilots.md), [`03-track-b-…`](./03-track-b-billing-taxes.md), [`04-track-c-…`](./04-track-c-vertical-defaults.md), [`05-track-d-…`](./05-track-d-gtm-launch.md) begin in parallel as previously planned.

---

## 8. Time budget for Phase 0

Realistic estimate, full-time engineering equivalent:

| Sub-phase | Duration | Notes |
|---|---|---|
| Audit (this doc + concrete bug list) | **0.5 week** | Mostly done in writing this file. |
| P0-1 (Meta App Review submission) | **week 1**, then 1–3 weeks waiting | Submission is fast; queue is the slow part |
| P0-2 … P0-7, P0-11, P0-12 (engineering fixes) | **2 weeks** | Roughly 8–10 dev-days |
| P0-3 (vertical taxonomy refactor, lifted from Track C) | overlaps; **1 week** | The smallest correct version |
| P0-8 (smoke test) | **3 days** | After fixes are merged |
| P0-9 (billing unit tests) | **2 days** | Pure functions, fast |
| P0-10 (observability minimum) | **2 days** | Structured logs + alert wiring |
| Dogfood (Weeks 3–4 of Phase 0) | **2 weeks** | Calendar time, not eng time |
| Friction backlog burn-down | **1 week buffer** | Always needed |

Total wall-clock: **~5–6 weeks**, of which ~3 weeks are heads-down dev and ~2 weeks are dogfood that runs alongside that dev. Meta App Review queue is the wildcard; if it slips beyond 3 weeks we pivot Phase 0 dogfood to use Twilio-only and ship pilots on the Twilio path first.

If we move fast and Meta cooperates: Phase 0 ends end of June 2026. If Meta is slow: mid-July.

---

## 9. Open question to resolve during Phase 0

- **Q1.** When a tenant's subscription is `EXPIRED`, should incoming customer WhatsApp messages still receive an automated response ("this business's auto-receptionist is paused")? Today they get silence. **Recommendation:** yes, send a courtesy fallback for 14 days post-expiry. This protects the *customer's* experience and gives the tenant a soft prompt to renew (an inbound DM "we have a customer who tried to reach you and didn't get an answer" is a powerful re-engagement signal).
- **Q2.** Do we encrypt `WhatsAppConfig.metaAccessToken` at the app layer? **Recommendation:** not in Phase 0; document plain-storage and revisit in Phase 1 if any pilot's accountant raises it.
- **Q3.** Sentry vs Vercel logs vs Axiom? **Recommendation:** Sentry for errors + Vercel logs for everything else. Sentry has a free tier sufficient for our scale and reduces "we noticed something broke a week ago" to "we got paged."
- **Q4.** Do we keep two LLM providers (Gemini + OpenAI) during Phase 0? **Recommendation:** yes, but dogfood **only Gemini** to keep variables bounded. Switch to OpenAI happens via a flag we toggle once Gemini quality is characterised.
