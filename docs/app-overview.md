# BookMe AI — App Overview

> **One-liner:** An AI receptionist for service businesses (dentists, mechanics, …) that books appointments via WhatsApp, syncs them to Google Calendar, and is operated as a recurring SaaS subscription.

This document defines what the app **is**, the **terms** used to talk about it, what counts as **revenue**, what counts as **cost**, what counts as **profit**, what is **already built**, and what "**developing on it**" actually means day-to-day. The Revenue, Costs, and Profit sections are written so they can be lifted into a contract appendix or a financial model — they describe **categories and sources**, not specific amounts. Live amounts (subscription tier prices, token allowances, overage markup, promo discounts, vendor unit prices) are intentionally excluded here because they change; they live in the codebase, in vendor pricing pages, and in the commercial agreement.

The categories listed in §3 (Revenue) and §4 (Costs) are **non-exhaustive**. Both revenue sources and cost categories are expected to expand over time as the product, the commercial model, and the tenant base evolve. Any revenue or cost category not listed here is not thereby excluded — it is simply not present at the time of writing.

For implementation details see [`README.md`](../README.md). For the messaging strategy rationale see [`docs/messaging-channels-strategy.md`](./messaging-channels-strategy.md). For the billing integration see [`REVOLUT_INTEGRATION.md`](../REVOLUT_INTEGRATION.md).

---

## 1. What the app does

BookMe AI lets a small service business (currently dentists and mechanics) hand off the entire "answer the phone, check the calendar, book the customer" loop to an AI receptionist that lives inside their WhatsApp Business number.

End-to-end flow from the **Customer's** perspective:

1. Customer messages the Tenant's WhatsApp number ("Hi, can I get a cleaning Friday afternoon?").
2. The Meta or Twilio webhook hits [`src/app/api/webhooks/whatsapp/route.ts`](../src/app/api/webhooks/whatsapp/route.ts).
3. The LangChain agent in [`src/lib/ai-agent.ts`](../src/lib/ai-agent.ts) (Gemini by default, OpenAI optional) runs with five tools: `get_services`, `get_availability`, `book_appointment`, `cancel_appointment`, `get_business_hours`.
4. Availability is checked against the Tenant's Google Calendar via [`src/lib/google-calendar.ts`](../src/lib/google-calendar.ts), so no double-booking is possible.
5. On confirmation, an event is written to the Tenant's calendar and an `Appointment` row is persisted (see [`prisma/schema.prisma`](../prisma/schema.prisma)).
6. The Tenant sees the booking in their dashboard, conversations log, and Google Calendar.

End-to-end flow from the **Tenant's** perspective:

1. Sign in with Google (grants Calendar scopes via Auth.js v5 — see [`src/lib/auth.ts`](../src/lib/auth.ts)).
2. Onboarding picks a **Profession** which seeds default services & prices from [`src/lib/defaults.ts`](../src/lib/defaults.ts).
3. Connect WhatsApp via either **Meta Cloud API** or **Twilio** ([`src/lib/whatsapp/`](../src/lib/whatsapp/)).
4. Use the **Chat Simulator** ([`src/app/(dashboard)/chat-simulator/page.tsx`](../src/app/(dashboard)/chat-simulator/page.tsx)) to test the AI without spending WhatsApp credits.
5. Subscribe via Revolut Hosted Checkout after the free Trial (see [`REVOLUT_INTEGRATION.md`](../REVOLUT_INTEGRATION.md)).

**Channel scope:** WhatsApp-only for conversations today. Outbound transactional email (confirmations / reminders) is the next planned channel addition; SMS, Instagram DMs, and Messenger are explicitly out of scope for the short–medium term — see [`docs/messaging-channels-strategy.md`](./messaging-channels-strategy.md).

---

## 2. Glossary (defined terms)

The following terms are used with the meanings below throughout this document and may be referenced verbatim from a commercial agreement.

| Term | Definition |
|---|---|
| **BookMe AI** | The platform described in this document. Also used as a shorthand for the legal entity operating the platform. |
| **Tenant** | A business that has signed up for BookMe AI and uses it as its appointment-booking layer. The Tenant is the paying party. Modelled in code as a [`User`](../prisma/schema.prisma) row with an associated [`BusinessProfile`](../prisma/schema.prisma). |
| **Customer** | A natural person who messages a Tenant's WhatsApp number to book, reschedule, or cancel an appointment. The Customer is **not** a paying party of BookMe AI. Identified in code by the `(userId, customerPhone)` pair. |
| **Subscription** | The recurring agreement under which a Tenant pays BookMe AI a periodic fee for use of the platform. Modelled in code as the [`Subscription`](../prisma/schema.prisma) entity with lifecycle states `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED`. |
| **Tier** | A named level of Subscription (e.g. Starter, Pro, …) defining the Subscription Fee and the Token Allowance for a Period. Tier definitions live in the commercial agreement, not in this document. |
| **Subscription Fee** | The fixed periodic amount a Tenant pays for a Tier, irrespective of usage up to the Token Allowance. |
| **Period** | The billing period of the Subscription. Currently calendar-monthly. |
| **Trial** | The initial period during which a Tenant has full platform access at zero Subscription Fee and is not required to provide a payment method. Currently 30 days, auto-created on first sign-in by [`ensureSubscription`](../src/lib/subscription.ts). |
| **Token** | A unit of LLM input or output as defined and billed by the underlying LLM provider (Google AI for Gemini, OpenAI for GPT). |
| **Token Allowance** | The volume of Tokens included in a Tier per Period. Defined per Tier in the commercial agreement. |
| **Token Overage** | Token consumption by a Tenant in a Period in excess of that Tenant's Token Allowance for that Period. |
| **Markup** | The percentage or formula applied on top of the underlying LLM provider's per-Token unit price when invoicing a Tenant for Token Overage. The Markup is defined in the commercial agreement, not in this document. |
| **Pass-through Cost** | A cost paid by the Tenant directly to a third party using the Tenant's own credentials (e.g. Meta or Twilio for WhatsApp messaging). Pass-through Costs do not appear on BookMe AI's books. |
| **Webhook** | An inbound HTTP callback from a third party (Meta, Twilio, Revolut) that triggers a state change in BookMe AI. |
| **Profession** | The vertical chosen by a Tenant during onboarding, which seeds default services. Currently `DENTIST` or `MECHANIC` (extensible). |

---

## 3. Revenue

### 3.1 Definition

**Revenue** is any amount that a third party (a Tenant or, in the future, a partner) pays BookMe AI in exchange for use of, or access to, the platform. It is **recognised** when the corresponding payment is **successfully captured** by the payment processor (currently Revolut), reflected by a `Payment` row transitioning to `COMPLETED` and the linked `Subscription` becoming or remaining `ACTIVE` ([`src/lib/subscription.ts`](../src/lib/subscription.ts), [`prisma/schema.prisma`](../prisma/schema.prisma)).

Refunds, chargebacks, and cancellations within a refund window are **negative revenue** in the Period in which they are processed.

The list in §3.2 is **non-exhaustive** and is expected to expand over time. Any new revenue source recognised by BookMe AI is recognised on the same basis described above unless explicitly stated otherwise in a commercial agreement.

### 3.2 Active and committed revenue sources

| # | Source | Trigger | Cadence | Currency | System of record |
|---|---|---|---|---|---|
| **R1** | **Subscription Fee for the Tenant's Tier** (includes the Tier's Token Allowance for the Period) | Successful Revolut Hosted Checkout charge for the Period, after Trial end or any time during the Trial | Per Period, per Tenant | Tenant chooses USD or RON at checkout | `Subscription` + `Payment` tables; activated by [`activateSubscription`](../src/lib/subscription.ts) |
| **R2** | **Token Overage charges** — billed at the underlying LLM provider's per-Token unit price for the Tokens consumed in excess of the Tier's Token Allowance, **plus the Markup** | Tenant's cumulative Token consumption in a Period exceeds the Token Allowance for that Period | Within or at the close of the Period in which the overage occurred | Same as R1 for that Tenant | Per-Tenant Token consumption, persisted alongside `Subscription` and `Payment` *(metering is **not yet implemented** — see §7.8)* |
| **R3** | **Promotional discount adjustments** (negative revenue) | Tenant applies a valid discount code at checkout | Per applicable invoice | Same as the discounted invoice | `Payment.discountCode`; codes defined in [`src/app/(dashboard)/billing/page.tsx`](../src/app/(dashboard)/billing/page.tsx) |

Notes for the contract:

- The **Tier definitions** (names, Subscription Fees, Token Allowances) are not in this document and are to be specified in the commercial agreement.
- The **Markup** applied to R2 is not in this document and is to be specified in the commercial agreement (e.g. as a percentage on top of the underlying provider's published per-Token unit price for the relevant model and direction — input vs. output).
- The **Trial** is not Revenue. It is a customer-acquisition mechanism, modelled in §4 as foregone Subscription Fee plus the platform usage incurred during the Trial window.
- The codebase currently implements a single Tier and the live billing flow for R1 and R3. R2 (Token Overage metering and overage billing) is committed in this commercial direction but is **not yet implemented**.

### 3.3 Future / contractually plausible revenue sources

These are listed so a contract can already enumerate them as future revenue categories without committing to amounts. The list is non-exhaustive and may expand.

- **Per-channel add-ons** once additional channels exist (e.g. outbound email reminders, SMS reminders).
- **Annual prepay** (single charge in exchange for a year of access).
- **Paid setup / managed onboarding** for non-technical Tenants.
- **White-label / agency reseller** revenue from partners managing multiple Tenants.
- **Profession packs** as the `Profession` enum expands beyond `DENTIST` and `MECHANIC`.
- **Referral or revenue-share** arrangements with industry partners (suppliers, distributors, accountants who serve clinics).
- **Usage-priced features** other than Tokens (e.g. per booking, per active Customer, per integration call), if introduced.

---

## 4. Costs

### 4.1 Definition

**Cost** is any monetary expense that BookMe AI incurs in order to make the platform available, operate it, support it, or grow it. Costs are **recognised** in the Period in which the obligation is incurred (typically the vendor invoice date, or the moment of consumption for usage-billed vendors). Where a cost is billed in a foreign currency it is converted using the rate at the time of payment.

Costs that are **passed through** to the Tenant — i.e. paid directly by the Tenant to a third party using the Tenant's own credentials — are **not** BookMe AI costs. They are listed in §4.7 only for completeness, because they are part of the Tenant's total cost of using the product and may matter commercially even though they never hit our books.

Time spent by founders or other unpaid contributors is **out of scope** of this document. Only monetary outflows and binding monetary obligations are treated as Costs here. Where labour is paid (salary, contractor invoice, agency fee), it appears in §4.6.

The list in §§4.2–4.6 is **non-exhaustive** and is expected to expand over time.

### 4.2 Variable software costs (proportional to usage)

Automated, vendor-billed costs that scale with the number of Tenants and / or the volume of conversations and payments.

| # | Cost | Source / vendor | Trigger | Bearer |
|---|---|---|---|---|
| **C1** | **LLM inference cost (input + output Tokens)** | Google AI (Gemini) and / or OpenAI, depending on each Tenant's `User.llmProvider` setting | Each model invocation in [`processWhatsAppMessage`](../src/lib/ai-agent.ts), including tool-call round-trips | BookMe AI (Tokens above Token Allowance are reimbursed by R2) |
| **C2** | **Automated outbound email cost** *(future, not yet billed)* | Resend (the `resend` package is already a dependency) | Each transactional email sent automatically by the platform (confirmation, reminder, receipt) | BookMe AI |
| **C3** | **Payment processing fees** | Revolut Merchant API | Each successful charge captured through Hosted Checkout | BookMe AI (deducted from the gross charge) |
| **C4** | **Refund / chargeback fees** | Revolut Merchant API | Each refund issued or chargeback received | BookMe AI |

### 4.3 Fixed software & infrastructure costs (incurred regardless of Tenant count)

These are paid even if zero Tenants are active and form the operating floor of the platform.

| # | Cost | Source / vendor | Trigger |
|---|---|---|---|
| **C5** | **Application hosting & function execution** | Vercel | Per-Period plan + usage above plan limits |
| **C6** | **Managed Postgres database** | Supabase | Per-Period plan + usage above plan limits |
| **C7** | **Domain registration & DNS** | Domain registrar | Annual renewal |
| **C8** | **Sender domain reputation / deliverability** *(once email ships)* | Domain registrar + Resend | Annual + per-Period |
| **C9** | **Third-party developer accounts** (Google Cloud, Meta for Developers, OpenAI, Twilio, Revolut, Supabase, Vercel) | Each respective platform | Free tier today; paid tiers when usage thresholds are crossed |

### 4.4 Acquisition costs (growth)

Spend incurred to acquire new paying Tenants. None of these are active today.

| # | Cost | Source / vendor | Trigger |
|---|---|---|---|
| **C10** | **Paid social ads** | Meta Ads (Facebook + Instagram), incl. Click-to-WhatsApp campaigns | Each impression / click / conversion charged by the platform |
| **C11** | **Paid search ads** | Google Ads | Each click / conversion charged by the platform |
| **C12** | **Content & SEO production** *(monetary spend only)* | External contractors / agencies | Per piece commissioned |
| **C13** | **Sales, partnerships & affiliate commissions** | Partner agreements, referral payouts | Per signed deal or per qualifying converted Tenant |
| **C14** | **Local listings / directories** | Google Business Profile (free), industry directories (paid) | Per listing or per renewal |

### 4.5 One-off costs

Spend that does not recur on a per-Tenant or per-Period basis but is required to operate.

| # | Cost | Source / vendor | Trigger |
|---|---|---|---|
| **C15** | **Meta Business Verification fees**, where applicable | Meta | Per submission cycle that incurs a fee |
| **C16** | **Google OAuth app verification fees**, where applicable | Google | Per submission cycle that incurs a fee |
| **C17** | **WhatsApp Business display-name approval fees**, where applicable | Meta / Twilio | Per submission |
| **C18** | **Legal review** of privacy policy, ToS, data deletion (already shipped at [`/privacy-policy`](../src/app/privacy-policy/page.tsx), [`/terms-of-service`](../src/app/terms-of-service/page.tsx), [`/data-deletion`](../src/app/data-deletion/page.tsx)) | External counsel | Per material change |
| **C19** | **Branding / design assets** | Contractors / agencies | Per asset commissioned |

### 4.6 Labour costs (monetary)

Paid labour engaged to build, run, support, or grow the platform. Recognised as the corresponding monetary outflow (salary, contractor invoice, agency fee, payroll on-cost). Unpaid time is not a Cost (see §4.1).

| # | Cost | Source | Trigger |
|---|---|---|---|
| **C20** | **Engineering, product & design labour** | Hires, contractors, agencies | Per Period (salary / retainer) or per engagement |
| **C21** | **Manual outbound email composition and sending** | Hires, contractors, agencies | Per email or per Period (any email sent by a person, as opposed to automated email under C2) |
| **C22** | **Customer support, success & operations labour** | Hires, contractors, agencies | Per Period or per ticket |

### 4.7 Pass-through costs (NOT BookMe AI costs)

Listed for completeness only. These are paid by the Tenant directly to the third party using the Tenant's own credentials, and never appear on BookMe AI's books.

| # | Cost | Source / vendor | Trigger | Bearer |
|---|---|---|---|---|
| **P1** | **WhatsApp conversation / message fees** | Meta WhatsApp Cloud API (when the Tenant chose Meta) **or** Twilio (when the Tenant chose Twilio) | Per conversation window or per message, per Meta's pricing categories (`service`, `utility`, `marketing`, `authentication`) | The Tenant |
| **P2** | **The Tenant's own Google Workspace / Calendar costs** | Google | Per Tenant's Workspace plan | The Tenant |

If the commercial model ever changes such that BookMe AI provides the WhatsApp number on the Tenant's behalf, P1 would migrate from §4.7 to §4.2 and become a true variable Cost of the platform.

---

## 5. Profit

### 5.1 Definition

**Profit** is what is left of recognised Revenue after all Costs in §4 have been deducted, in the same Period. Three views are useful and should be tracked separately so a contract or financial model can refer to whichever is appropriate:

1. **Per-Tenant gross margin** = (R1 + R2 − R3) for that Tenant **−** the variable Costs that Tenant directly caused (their share of C1, C2, C3, C4).
2. **Platform contribution margin** = total Revenue across all Tenants − all variable Costs (C1–C4) − all fixed software & infrastructure Costs (C5–C9).
3. **Net profit** = Platform contribution margin − Acquisition Costs (C10–C14) − the Period's share of one-off Costs (C15–C19) − Labour Costs (C20–C22).

### 5.2 Properties worth knowing for a contract

- **R2 is structurally cost-plus.** Token Overage is invoiced at the LLM provider's unit price plus the Markup, so for any Token consumed above the Token Allowance, the gross-margin contribution is exactly the Markup. The Subscription Fee (R1) absorbs the C1 portion that falls within the Token Allowance.
- **Fixed Costs are incurred at zero Tenants**, so per-Tenant gross margin can be positive while net profit is still negative.
- **Acquisition Cost is bounded by decision, not by usage**: ad spend (C10–C11) is set by us, not triggered by Tenants, so net profit can be steered by pausing acquisition without changing the product.
- **Pass-through Costs (P1, P2) do not affect BookMe AI's profit** but they affect the Tenant's willingness to pay R1, so they are commercially relevant even though they are not on our P&L.
- **Trials** depress profit in the Period in which they are running (they consume C1 and a share of C5–C9 with zero matching R1) and lift profit in the Period in which they convert. This timing mismatch should be modelled, not netted away.

---

## 6. What "developing on it" means

This is a **single Next.js 16 (App Router) + TypeScript** monolith deployed on Vercel, with Postgres (Supabase) as the only stateful dependency. Day-to-day development work falls into a small number of recurring buckets:

1. **AI agent work** — adding/tuning tools and the system prompt in [`src/lib/ai-agent.ts`](../src/lib/ai-agent.ts). This is where most product behaviour lives. Adding a new tool means: define a Zod schema, wire it through `createTools`, update the system prompt guidance, and ideally add a regression check via the Chat Simulator.
2. **Schema work** — Prisma migrations in [`prisma/schema.prisma`](../prisma/schema.prisma). Run `npx prisma db push` against a Supabase URL; the `postinstall` script regenerates the client.
3. **API route work** — App Router route handlers under [`src/app/api/`](../src/app/api/). Anything user-facing also lives in App Router pages under `(dashboard)`, `login/`, `onboarding/`.
4. **Webhook integration work** — the Meta + Twilio fan-in at [`src/app/api/webhooks/whatsapp/route.ts`](../src/app/api/webhooks/whatsapp/route.ts) and the Revolut webhooks under [`src/app/api/webhooks/revolut/`](../src/app/api/webhooks/revolut/). External webhooks require either a deployed preview URL or a tunnel (ngrok) for local iteration.
5. **Billing work** — anything touching `Subscription` / `Payment` / Revolut. Sandbox vs. live is routed by the **card number entered at checkout** (test card → sandbox key, real card → live key); that branching is configured via `REVOLUT_TEST_CARD_NUMBER` in [`.env.example`](../.env.example).
6. **UI work** — Tailwind v4 + shadcn/ui + Radix primitives. Components in [`src/components/`](../src/components/), pages co-located with routes.

**What you generally do *not* need to do:**

- No microservices, no message queues, no separate worker processes (everything is synchronous request → LLM → response, persisted in Postgres). Future cron-based reminders will be Vercel Cron Jobs hitting an internal API route, not a separate service.
- No mobile app — it's WhatsApp + web dashboard.
- No managing of Customer phone numbers as identities — the `userId + customerPhone` pair on `Conversation` is the implicit identity model. This matters when reasoning about new channels (see the messaging strategy doc).

**Local dev loop:**

```bash
npm install        # also runs prisma generate
npm run dev        # Next dev server
# webhooks need a public URL -> use ngrok or a Vercel preview deploy
```

Tests do not exist yet — see "What is *not yet* developed" below.

**Branching / deploy:** the `staging` branch tracks production-candidate work; production deploys go through Vercel.

---

## 7. What is already developed

The core "answer WhatsApp → check calendar → book → log it → bill the Tenant monthly" loop is functional end-to-end. Concretely:

### 7.1 Auth & onboarding

- Google sign-in with Calendar scopes via Auth.js v5 ([`src/lib/auth.ts`](../src/lib/auth.ts), [`src/lib/auth.config.ts`](../src/lib/auth.config.ts)).
- Trial Subscription auto-created on first sign-in ([`ensureSubscription`](../src/lib/subscription.ts)).
- Profession-based onboarding with default services seeded for `DENTIST` and `MECHANIC` ([`src/lib/defaults.ts`](../src/lib/defaults.ts), [`src/app/onboarding/page.tsx`](../src/app/onboarding/page.tsx)).
- Business profile, timezone, and per-day business hours ([`BusinessProfile`](../prisma/schema.prisma)).

### 7.2 AI agent

- LangChain agent supporting both **Gemini** (default) and **OpenAI** (optional, switchable per Tenant via `User.llmProvider`).
- Five tools: `get_services`, `get_availability`, `book_appointment`, `cancel_appointment`, `get_business_hours`.
- Conversation persistence with last-10-message context window ([`Conversation`](../prisma/schema.prisma)).
- Chat Simulator page that exercises the same `processWhatsAppMessage` code path with `simulate: true`, so AI iteration does not require WhatsApp at all.

### 7.3 Messaging

- Unified WhatsApp interface ([`src/lib/whatsapp/index.ts`](../src/lib/whatsapp/index.ts)) with two providers:
  - **Meta Cloud API** ([`meta-provider.ts`](../src/lib/whatsapp/meta-provider.ts))
  - **Twilio** ([`twilio-provider.ts`](../src/lib/whatsapp/twilio-provider.ts))
- Single webhook endpoint that handles both providers' payload shapes.

### 7.4 Calendar

- Per-Tenant Google Calendar OAuth (access + refresh tokens stored on `User`).
- Availability calculation, event creation, event deletion in [`src/lib/google-calendar.ts`](../src/lib/google-calendar.ts).

### 7.5 Dashboard

- Stats overview (upcoming, total appointments, conversations, active services) at [`/dashboard`](../src/app/(dashboard)/dashboard/page.tsx).
- Services CRUD, appointments list, conversations list, settings (profile, hours, WhatsApp config, AI provider, account, timezone).
- Subscription banner (warns when Trial is ending or Subscription expired) and a client-side `SubscriptionGate` that blocks dashboard access on expiry while still allowing `/billing`, `/settings`, and `/onboarding`.

### 7.6 Billing (Revolut)

- Hosted Checkout integration with both **sandbox** and **live** keys, routed by the **card number** entered at checkout.
- `Subscription` lifecycle: `TRIALING → ACTIVE → CANCELLED / EXPIRED / PAST_DUE`.
- `Payment` records with status (`PENDING / AUTHORISED / COMPLETED / FAILED / CANCELLED / REFUNDED`).
- Webhook handlers for `ORDER_COMPLETED` and `ORDER_PAYMENT_FAILED`, both sandbox ([`/api/webhooks/revolut/sandbox`](../src/app/api/webhooks/revolut/sandbox/route.ts)) and live ([`/api/webhooks/revolut`](../src/app/api/webhooks/revolut/route.ts)), with signature verification ([`src/lib/revolut-webhook.ts`](../src/lib/revolut-webhook.ts)).
- A `WebhookEvent` audit table records every received webhook payload.
- Polling fallback at `/api/billing/status` for cases where the webhook is delayed.
- Cancellation flow that sets `CANCELLED` and `cancelledAt`.
- Discount-code mechanism (the codebase ships with one promo code) applied client- and server-side and persisted on `Payment.discountCode`.
- Helper scripts in [`scripts/revolut/`](../scripts/) for managing webhooks via the Revolut API (`webhook:create`, `webhook:list`, `webhook:get`, `webhook:delete`).

### 7.7 Legal / production hygiene

- Privacy policy, terms of service, data deletion pages.
- `sitemap.xml` route, site footer.
- `proxy.ts` middleware enforcing auth on dashboard paths.

### 7.8 What is *not yet* developed (known gaps, tracked in `.cursor/plans/`)

These are referenced for completeness so the Revenue, Cost, and Profit discussion above is grounded in reality, not the README.

- **Tiered subscription plans** with per-Tier Token Allowances (current code has a single Tier; the tiered model is committed but not yet implemented).
- **Per-Tenant Token consumption metering** per Period (required for the R2 overage charge).
- **Token Overage billing flow** (charge calculation, invoicing, payment capture, application of the Markup).
- **WhatsApp Embedded Signup** — currently Tenants paste credentials by hand; embedded signup is planned and partially scaffolded (FB SDK already loaded in [`layout.tsx`](../src/app/layout.tsx)).
- **Meta webhook signature verification** — `verifyWebhookSignature` exists but is not wired into the POST handler.
- **`reschedule_appointment` tool** — system prompt mentions rescheduling, the tool itself does not exist.
- **Cron-based appointment reminders** (WhatsApp + automated email under C2) — the schema has `reminderEmailSentAt` but no cron job runs yet.
- **Outbound transactional email** — `resend` is installed, no sender code exists yet.
- **Customer model** — Customers only exist as `(customerName, customerPhone)` on each appointment; no first-class `Customer` entity.
- **More Professions** — enum currently has only `DENTIST` and `MECHANIC`.
- **Multilingual responses** — agent is English-only by prompt.
- **Per-Tenant rate limiting** on the WhatsApp webhook and AI calls (a margin-protection feature — see §5.2).
- **Tests** — there are zero unit / integration / E2E tests.
- **Richer dashboard analytics** (conversion rate, revenue, busiest hours, no-show rate).
- **Tenant-side appointment editing** (mark complete / no-show, manual create, drag-to-reschedule).

---

## 8. Quick mental model

If you remember nothing else:

- **Product:** AI receptionist on WhatsApp for service businesses, with Google Calendar as the source of truth and Revolut as the cash register.
- **Revenue:** a recurring Subscription Fee per Tenant per Tier (R1) which includes a Token Allowance, plus Token Overage charges at provider cost + Markup once a Tenant exceeds their Allowance (R2), less any discount adjustments (R3). The list is non-exhaustive and may expand.
- **Costs we pay (variable):** LLM Tokens, automated email, payment processing, refund/chargeback fees.
- **Costs we pay (fixed):** hosting, database, domain, deliverability, third-party developer accounts.
- **Costs we pay (other):** acquisition spend (when we choose to), one-off platform / legal fees, and paid labour — including manual outbound email under C21 as the labour-side counterpart of automated email under C2.
- **Costs we do not pay:** WhatsApp messaging (Tenant brings their own credentials and is billed directly by Meta or Twilio).
- **Profit:** Revenue − Costs, viewed at three levels (per-Tenant gross margin, platform contribution margin, net profit). R2 is structurally cost-plus, so above-Allowance usage is margin-positive by construction.
- **Built today:** the entire booking loop, the entire Subscription/billing loop for a single Tier, the dashboard, and the Trial/Subscription gate. Production blockers are external (Meta Business Verification) more than internal.
- **Next:** Tiering + Token metering + overage billing, then Embedded Signup, then reminders / outbound email — without adding a second conversational channel.

---

## 9. Pass-through Costs revisited (addendum to §4.7)

§4.7 classifies P1 (WhatsApp messaging) and P2 (Google Workspace / Calendar) as Pass-through Costs that never appear on BookMe AI's books. That classification is **correct as of today's manual-credentials onboarding** — Tenants paste their own Meta or Twilio credentials, and Meta or Twilio bill the Tenant directly under those credentials. The classification is, however, **time- and onboarding-model dependent**. As the product moves toward its stated principle of "the Tenant does as little as possible," the classification of P1 in particular is expected to change.

This section documents that dependence so the Revenue / Cost / Profit framework in §§3–5 can be lifted into a contract appendix or a financial model with the right caveats. The §4.7 entries are not wrong; they are conditional.

### 9.1 P1 (WhatsApp via Meta) — pass-through depends on the role BookMe AI takes with Meta

Meta defines three onboarding roles for businesses that integrate the WhatsApp Business Platform on behalf of others — Solution Partner, Tech Provider, and Tech Partner — described in [Meta's Solution Providers overview](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/overview). Two of them are relevant here.

| Role | Who Meta bills for messaging | Tenant onboarding friction | Effect on BookMe AI's books |
|---|---|---|---|
| **Tech Provider** | The Tenant, directly | Tenant must add a payment method in WhatsApp Manager *after* Embedded Signup completes | **P1 stays a Pass-through Cost.** Does not appear on BookMe AI's books. |
| **Solution Partner** | BookMe AI, via a line of credit shared with the Tenant; BookMe AI then invoices the Tenant for messaging | Zero — Tenant skips the payment-method step entirely | **P1 ceases to be Pass-through.** Meta invoices BookMe AI for the aggregated Tenant messaging spend. P1 migrates from §4.7 to §4.2 and becomes a true variable Cost. |

The Solution Partner case is governed by Meta's [credit-line sharing documentation](https://developers.facebook.com/docs/whatsapp/embedded-signup/manage-accounts/share-and-revoke-credit-lines/), which states (verbatim):

> Business customers that you onboard through Embedded Signup must be granted access to your line of credit with Meta to pay for WhatsApp Business Platform access. This means that businesses pay you, and you receive an aggregated invoice to pay Meta. You are the "Bill To Party" for all businesses sharing your credit line. You are liable for and will pay Meta for all WhatsApp Business Platform spend made by these businesses.

Two consequences worth flagging in the commercial agreement:

1. **The current Embedded Signup plan ([`.cursor/plans/whatsapp_embedded_signup_abb1ff6b.plan.md`](../.cursor/plans/whatsapp_embedded_signup_abb1ff6b.plan.md)) targets the Tech Provider role**, not the Solution Partner role. Embedded Signup as a Tech Provider removes the credential-pasting step but does *not* remove the Tenant's obligation to add a payment method in WhatsApp Manager before messages can flow. P1 stays Pass-through under this plan, but the "Tenant does nothing" principle is only **partially** achieved.
2. **Becoming a Solution Partner is the only way to fully eliminate Tenant-side setup for WhatsApp**, and doing so converts P1 into a real BookMe AI cost. It also introduces **Tenant credit risk**: BookMe AI is liable to Meta for the aggregated invoice whether or not each Tenant pays the corresponding charge to BookMe AI. Eligibility is non-trivial — Meta's own copy describes the application as "a lengthy process."

### 9.2 P1 (WhatsApp via Twilio) — Sub-accounts shift billing to BookMe AI

Today, Tenants paste their own Twilio Account SID, auth token, and WhatsApp-enabled phone number into [`src/app/(dashboard)/settings/page.tsx`](../src/app/(dashboard)/settings/page.tsx), so Twilio bills the Tenant directly under their own credentials. This is genuine pass-through.

If onboarding is ever simplified by provisioning Twilio Sub-accounts (one Sub-account per Tenant under a single BookMe AI parent account), [Twilio's Sub-accounts documentation](https://www.twilio.com/docs/iam/api/subaccounts) states (verbatim):

> Twilio bills all subaccount usage directly to your main account. You'll have one Twilio balance for all subaccounts.

There is no Twilio mechanism to invoice a Sub-account holder directly. Adopting Sub-accounts therefore migrates the Twilio side of P1 from §4.7 to §4.2 in the same way the Solution Partner role does for the Meta side.

### 9.3 P2 (Google Workspace / Google Calendar) — overstated in §4.7

The Google Calendar API is, per Google's own [quota documentation](https://developers.google.com/workspace/calendar/api/guides/quota):

> All use of the Google Calendar API is available at no additional cost. Exceeding the quota request limits doesn't incur extra charges and your account is not billed.

A Tenant can sign in with a free `@gmail.com` account, grant the Calendar OAuth scopes BookMe AI requests in [`src/lib/auth.ts`](../src/lib/auth.ts), and use the platform end-to-end without any Google Workspace subscription. Tenants who *are* on Google Workspace are paying Google for email, storage, and admin features that are unrelated to their use of BookMe AI.

P2 is therefore not really a *cost of using BookMe AI* — it is a fact about a subset of Tenants' pre-existing infrastructure. For contract purposes it is more accurately treated as **out of scope** than as a Pass-through Cost. It is retained in §4.7 only because it has historically been listed there.

### 9.4 Restatement of the §4.7 migration trigger

The footnote at the end of §4.7 currently reads:

> If the commercial model ever changes such that BookMe AI provides the WhatsApp number on the Tenant's behalf, P1 would migrate from §4.7 to §4.2 and become a true variable Cost of the platform.

Based on §§9.1–9.2 the trigger condition is too narrow. A more accurate statement is:

> P1 migrates from §4.7 to §4.2 the moment BookMe AI assumes financial liability for Tenant messaging — specifically when BookMe AI either (a) becomes a Meta Solution Partner and shares its line of credit with onboarded Tenants, or (b) provisions Twilio Sub-accounts under a single BookMe AI parent account. In either case the Tenant may still own the WhatsApp Business Account and phone number; what migrates is **billing liability**, not ownership.

Both triggers are commercially attractive because they advance the "Tenant does nothing" principle. Both also convert P1 into a structurally **cost-plus** revenue line equivalent to R2 (Token Overage): underlying provider rate + Markup, with gross-margin contribution equal to the Markup. The §3.2 and §5.2 language for R2 therefore already covers how a migrated P1 would be invoiced and recognised, and the commercial agreement can reference R2's Markup mechanism by analogy when the migration occurs.

### 9.5 Summary

| Item | §4.7 today (manual credential paste) | After Embedded Signup as Tech Provider | After upgrade to Solution Partner / move to Twilio Sub-accounts |
|---|---|---|---|
| **P1 (WhatsApp messaging)** | Pass-through | Pass-through (Tenant still adds payment method in WhatsApp Manager) | **BookMe AI cost** (variable, cost-plus like R2); Tenant credit risk on BookMe AI |
| **P2 (Google Workspace)** | Listed as Pass-through; in practice unrelated to BookMe AI usage | Same | Same |
| **"Tenant does nothing" principle** | Not satisfied (manual credential paste) | Partially satisfied (Tenant still adds a payment method) | Fully satisfied for messaging setup |
