# 04 — Paid launch (1–2 weeks)

> **Goal:** flip pilots to paid, then open public signup behind a "request access" wall while the founder personally onboards the next 5–10 customers.
>
> **Pre-requisite:** [`02-pilot.md`](./02-pilot.md) Go decision **and** [`03-billing-and-tax.md`](./03-billing-and-tax.md) DoD.

---

## What "paid launch" is and isn't

**Is:** the moment we charge money. A small public landing page. Word-of-mouth from pilots. One channel of warm intros.

**Isn't:** the moment we start paid ads. Ads come in Stage 5 ([`05-gtm-and-scale.md`](./05-gtm-and-scale.md)).

Conflating these is the most common mistake. Paid launch is a *commitment* milestone (we want money for the product) — ads are a *demand-generation* milestone (we want strangers to try it). Do them in sequence, not simultaneously, so we know whether each is working.

---

## Work list — week 1 of paid launch

### A. Flip pilots to paid (Day 1–3)

For each pilot:

1. 15-minute call. Walk them through the new `/billing` page. They pick a tier — most should default to Starter, a couple may be ready for Pro. **Don't upsell.** Their pilot WTP answer was the floor; charge that.
2. They subscribe via Revolut Hosted Checkout. Real card, autopay enabled.
3. Set `User.isPilot = false`. They are now real customers.
4. Send a thank-you WhatsApp + an invoice number + a code (`PILOT-2026`) for the first month at 50% off — they earned it.

Pilots who **don't** convert: respect their decision, ask why in writing, set `isPilot = false`, **don't auto-downgrade them to a free tier — there is no free tier**. They become read-only and migrate off at their convenience.

### B. Public landing + waitlist (Day 1–4, parallel to A)

The existing landing page (`src/app/page.tsx`) is dentist/mechanic-flavoured. Update:

- Hero copy reflects the eight Priority 1 verticals — rotate through them, or pick the dominant one from pilot conversions (likely barber / nails for RO, auto / MedSpa for US).
- Add a "Verticals we serve" section with the eight icons.
- Replace the existing "Sign up" CTA with **"Request access"** for now — a form that creates a `WaitlistEntry` row, sends us a Discord ping, and emails them within 24h.
- Why a waitlist? Two reasons: (a) we are limited by hand-holding capacity; (b) it generates Stage-5 ad audiences once we open up.

Schema:

```prisma
model WaitlistEntry {
  id        String   @id @default(cuid())
  email     String   @unique
  vertical  Profession?
  country   String?
  notes     String?
  createdAt DateTime @default(now())
}
```

### C. Refund / cancel UX hardening (Day 3–7)

The first paid customer who hits a problem will try to cancel inside 24 hours. Make sure:

- "Cancel" is one click from `/billing`, with a confirmation modal.
- Cancellation triggers an immediate email + WhatsApp DM confirmation (uses the dunning template approved during Layer 3 of billing).
- Auto-issue refund if cancel within 7 days **and** the tenant clicks "request refund". Don't auto-refund without a click — some tenants prefer the credit.
- Refund triggers a credit note via the e-Factura flow ([Layer 3](./03-billing-and-tax.md#layer-4--invoices-dunning-refunds-7d)).

This is the smallest set of changes that doesn't leave a paid customer feeling trapped.

### D. Reminders (parallel — start Meta template approval in pilot week 1!)

Now that we have paid customers and they'll be supporting their customers, the **single highest-leverage feature** is no-show reduction.

- 24h-before-appointment WhatsApp reminder (utility template, pre-approved by Meta).
- 2h-before-appointment email reminder (Resend, no approval needed).
- Cron: `/api/cron/send-reminders` runs hourly, fetches `Appointment` rows due in [24h ± 30min] and [2h ± 30min] and not flagged sent.

Schema (these fields exist or are trivially added):

```prisma
model Appointment {
  // existing...
  reminderWhatsappSentAt DateTime?
  reminderEmailSentAt    DateTime?  // already exists per app-overview
}
```

Skip SMS reminders. Skip Customer email collection beyond what the AI already asks. **Don't build a reminder UI** — it's a side-effect feature, not a configurable one.

---

## Work list — week 2 of paid launch

### E. Onboarding video (1 day)

A 90-second screen recording of the founder doing the entire onboarding. Hosted on Loom or YouTube unlisted. Linked from the landing page CTA, the waitlist confirmation email, and `/onboarding` step 1.

### F. Outbound email confirmations (1–2 days)

Now that Resend is wired for dunning, extend it to:

- Booking confirmation (to the customer, if they gave an email).
- Booking reminder email (already covered in D).
- Receipt / invoice attached to a "Thank you for your subscription" email (to the tenant) on every renewal.

`src/lib/email/templates.ts` — three templates, no template engine, JSX server components rendered to HTML by Resend. Don't over-engineer.

### G. Founder ops checklist (ongoing)

A one-page Notion or Google doc the founder reads every morning:

- Open Discord error pipe. Triage any error from yesterday.
- Open `/admin/pilots` (now `/admin/customers`). Glance: anyone in `PAST_DUE`? Anyone with 0 conversations this week?
- Reply to all WhatsApp DMs from customers from yesterday.

That's the entire ops surface. Nothing more.

### H. Decide whether to apply for Meta Solution Partner (1 day decision, weeks of waiting)

See [`docs/app-overview.md §9.1`](../app-overview.md). The decision criteria:

- **Apply now** if: pilots said the "add payment method in WhatsApp Manager" step was the #1 friction.
- **Wait** if: pilots completed ES end-to-end without complaining about the payment-method step.

If we apply: it's a multi-week Meta review process. We continue selling under Tech Provider during the wait. P1 stays pass-through until granted.

If we wait: revisit at $10k/mo MRR or 50 paying tenants, whichever is first.

---

## What we are **not** doing in this stage

| Item | Why not now |
|---|---|
| Paid ads | Stage 5. Don't muddy the signal. |
| Affiliate program | Stage 5+. |
| Annual prepay | Wait for 3 explicit requests. |
| Multi-currency display in AI replies | The tenant's currency is enough; their customers' currency is the same as theirs. |
| Customer-collected email enforcement | The agent can ask. If a Customer doesn't give one, they get WhatsApp reminders only. |
| Multilingual prompt **beyond** the one-line "reply in same language" | The post-pilot retro tells us if we need real localisation. |
| Tests | Still no. |

---

## Definition of Done

- [ ] All converting pilots are on paid plans with autopay enabled.
- [ ] Non-converting pilots have a respectful exit path (set to read-only or migration TBD).
- [ ] The landing page reflects the eight Priority 1 verticals; signup is "request access" with a waitlist; founder triages the waitlist daily.
- [ ] One real refund has been issued and the credit note shows up in e-Factura.
- [ ] WhatsApp reminder template is **approved** by Meta and one real reminder has been sent.
- [ ] One real email confirmation, one real reminder, one real receipt have been sent.
- [ ] The founder-ops checklist is documented in `docs/roadmap/runbooks/daily-ops.md` and has been followed for ≥5 consecutive days.
- [ ] Solution Partner decision is recorded in [`risks-and-decisions.md`](./risks-and-decisions.md) with a one-line justification.
