# Track B — Billing hardening, VAT/sales tax, invoicing, dunning

> **Gate:** the engineering work in this track starts after [`00-phase-0-app-readiness.md`](./00-phase-0-app-readiness.md) is signed off. The tax-advisor consult (the external-clock starter) is booked during Phase 0 because its calendar time is outside our control.

**Status:** Internal dev work. One external input (tax advisor consult) must be booked during Phase 0.

**Goal:** By Week 10, BookMe AI can legally and automatically charge a Romanian VAT-registered business, a German non-VAT-registered consumer, and a US LLC, generate a correct invoice for each, file the Romanian invoice with ANAF e-Factura, and retry a failed charge without a human in the loop.

---

## 1. What we have today

From [`REVOLUT_INTEGRATION.md`](../../REVOLUT_INTEGRATION.md) and `prisma/schema.prisma`:

- Revolut Hosted Checkout, **flat $25 USD/month**, no tax line.
- `Subscription` + `Payment` tables with autopay scaffold (`nextChargeAt`, `failedAttempts`, `paymentMethodId`).
- `revolut-autopay.ts` for cron-driven renewal, `revolut-webhook.ts` for ORDER_COMPLETED / ORDER_PAYMENT_FAILED.
- `Payment.discountCode` exists; promo discounts work.
- **No invoice generation. No tax. No country detection at checkout. No VATIN field on `BusinessProfile`. No credit notes. No dunning beyond `failedAttempts`. No e-Factura.**

That is the gap.

---

## 2. Tax model we are committing to

This section is the brief for the tax advisor. **It is a proposal, not a decision** — we engage the advisor in Week 0 to confirm or correct it. Updated decisions will be tracked in [`07-risks-and-open-decisions.md`](./07-risks-and-open-decisions.md).

### 2.1 Counterparty taxonomy

For tax purposes every Tenant falls into one of four buckets:

| Bucket | Definition | What we charge |
|---|---|---|
| **B2B-RO** | Tenant is in Romania and has a valid Romanian CUI (CIF) | Net price + Romanian VAT (19%) on the invoice; e-Factura submission to ANAF |
| **B2B-EU-non-RO** | Tenant is in another EU member state and has a valid EU VATIN, validated via VIES | Net price, **VAT reverse-charged** (no VAT on invoice, "reverse charge" mention) |
| **B2C-EU** (incl. non-VAT-registered businesses) | Tenant is in the EU but no VATIN, or VATIN is invalid | Net price + VAT at the **Tenant's country rate** (OSS scheme) |
| **B2B-Outside-EU** | Tenant is outside the EU (US, UK, CH, etc.) | Net price, no EU VAT. Sales tax handled per §2.3 if applicable. |

The selling entity (BookMe AI legal entity) is assumed to be **VAT-registered in Romania**. Confirm with advisor.

### 2.2 What we collect at checkout

1. **Billing country** (dropdown, default by IP geolocation; we let user override).
2. **Business / individual** toggle.
3. **VATIN** (if business and in EU). Validated against VIES synchronously at checkout.
4. **Legal entity name** and **billing address** for the invoice.

If the user is a business with no valid VATIN, we still issue an invoice but treat them as B2C-EU for tax purposes.

### 2.3 US sales tax

We will **not** collect US sales tax until we cross a state's economic nexus threshold (typically $100k or 200 transactions, varies). Until then, US tenants pay the net price and we display "no US sales tax collected — you are responsible for use tax in your state" on the invoice.

We will revisit when: any US state revenue line exceeds $50k/year, **or** total US tenants > 50. At that point we engage a US tax-compliance vendor (TaxJar / Stripe Tax / Anrok). This is explicitly **out of scope for the 12-week window** and is a Track-D-post-launch item.

### 2.4 Currency

Today everything is in USD. The tax advisor will tell us whether a Romanian-registered entity invoicing in USD is fine (it is, generally) or whether we must invoice in RON with the BNR exchange rate of the invoice date for ANAF purposes. **Decision deferred to advisor; placeholder assumption: invoice in original transaction currency (USD), include RON-equivalent line for RO invoices using BNR rate.**

---

## 3. Invoice obligations

### 3.1 Required invoice fields (RO/EU)

Pulled from RO Fiscal Code; advisor to confirm completeness:

- Invoice number (sequential, gap-free) and date
- Issuer legal name, address, CUI / VATIN
- Buyer legal name, address, CUI / VATIN (if business)
- Line items with description, quantity, unit price, VAT rate, VAT amount
- Subtotal, VAT subtotal, total
- Currency
- Payment method (e.g. "Card via Revolut")
- For reverse-charge invoices: "Taxare inversă" / "Reverse charge" mention
- For OSS invoices: VAT rate of the buyer's country

### 3.2 Invoice numbering

A per-tenant or per-series sequential counter, no gaps allowed. We will maintain a single `InvoiceSeries` table:

```
InvoiceSeries
  id
  code         e.g. "BMA-2026"
  nextNumber   integer
  format       e.g. "BMA-2026-{0000}"
```

Each successful payment increments `nextNumber` atomically. Credit notes use a separate series ("BMA-CN-2026").

### 3.3 e-Factura (RO)

Since 2024, RO requires B2B invoices to be submitted to ANAF's e-Factura system (RO eFactura, the SPV portal) in UBL 2.1 XML format. We need:

- ANAF developer account.
- OAuth token for the e-Factura API.
- UBL 2.1 XML generator (library: there are RO-specific NPM packages; alternative is to build the XML by hand from the invoice model — small enough for an MVP).
- Submission worker + retry on transient failures.
- Storage of the ANAF response ID + downloaded signed XML for audit.

The e-Factura submission is **a hard regulatory requirement** for RO B2B; we cannot ship paid RO B2B tenants without it. RO B2C is currently exempt (verify with advisor — rules tightening over time).

---

## 4. Engineering deliverables

Sequenced for delivery, with internal dependencies stated.

### B1 — Invoice data model + PDF (Week 1–2)

New Prisma models:

```
Invoice
  id, userId, paymentId (nullable for manual invoices)
  series (FK -> InvoiceSeries)
  number, issuedAt
  currency
  buyer { name, country, vatin?, address }
  seller (snapshot of our entity at time of issue)
  lineItems[] { description, quantity, unitPrice, vatRate, vatAmount, total }
  subtotal, vatTotal, total
  taxScheme: enum { STANDARD, REVERSE_CHARGE, OSS, OUT_OF_SCOPE }
  pdfUrl, ublXmlUrl?
  anafSubmissionId?, anafStatus?, anafSubmittedAt?

InvoiceSeries (above)

CreditNote   -- mirrors Invoice; references the Invoice it credits
```

PDF generation: use the existing tech stack (React → HTML → Puppeteer/Playwright or @react-pdf/renderer). Simple, single-template. Store on Supabase Storage (since DB is Supabase) or Vercel Blob.

API: `/api/invoices/[id]` (GET, returns PDF URL or stream). Dashboard page `/billing/invoices` listing all of a tenant's invoices with download links.

**Dependency:** none. Starts Week 1.

### B2 — Country detection + VATIN validation (Week 2–3)

- Add `BusinessProfile.country` (ISO 3166-1 alpha-2) and `BusinessProfile.vatin` (string, optional).
- Onboarding step (after profession pick, before WhatsApp connect): "Your business details for billing" — country, business/individual toggle, VATIN, address.
- Checkout: re-confirm these before creating the Revolut order. Use them to compute the tax line. Pass the computed total (including VAT for B2C-EU, excluding for B2B reverse-charge) to Revolut Hosted Checkout.
- VATIN validation: call VIES SOAP endpoint server-side at the moment of save and at checkout (with a short cache). On failure, treat as B2C.

**Dependency:** none for the model; B1 for the checkout to wire to.

### B3 — Tax-scheme decision + price display (Week 3–4)

Pure function `computeTaxScheme({ sellerCountry, buyerCountry, buyerIsBusiness, buyerVatin, buyerVatinValid }) → { scheme, vatRate, breakdown }`. Unit-tested with a table of cases (RO→RO, RO→DE-B2B, RO→DE-B2C, RO→US, etc.).

Public pricing page (`src/app/pricing/page.tsx`) updated to show **"$25 USD / month"** with a small note "VAT may apply depending on your country" until country is selected, then a recomputed price after country selection.

**Dependency:** B2.

### B4 — Romanian e-Factura submission (Week 5–7)

- ANAF OAuth client.
- UBL 2.1 XML generator from `Invoice` model.
- Submission worker triggered on `Invoice` create where `taxScheme = STANDARD` (RO B2B). Retries on transient failures.
- Webhook or polling for ANAF response status.
- Manual re-submission button in an internal-only admin route (gated by an env-var allowlist of user emails).

**Dependency:** B1 + ANAF API access granted (external Week 1 application).

### B5 — Autopay + dunning hardening (Week 4–6)

We have `failedAttempts` and `nextChargeAt`. We need the **policy**:

- Renewal attempt at `currentPeriodEnd`.
- On failure: retry at +3 days, +5 days, +7 days (3 retries).
- Email tenant after each failed attempt with a "update card" link.
- After 3 failed retries: subscription → `PAST_DUE`, dashboard banner switches to "billing issue — update card to keep service."
- After 7 more days in PAST_DUE: subscription → `EXPIRED`, AI receptionist disabled.
- Tenant can re-activate any time by completing a successful payment.

Implement in `src/lib/revolut-autopay.ts`. Use Vercel cron (already used elsewhere) for the polling.

**Dependency:** B1 (so a successful renewal mints an invoice). Outbound email — see §6.

### B6 — Refunds + credit notes (Week 7–8)

- Refund flow in Revolut (full or partial).
- On refund, automatically issue a credit note (`CreditNote` model) numbered from the CN series.
- For RO B2B credit notes, submit credit-note UBL XML to ANAF.

**Dependency:** B1, B4.

### B7 — Token-overage metering (R2) (Week 8–10)

This is the R2 revenue source from [`docs/app-overview.md`](../app-overview.md) §3.2. Currently unimplemented.

- Add `TokenUsage` table: `userId`, `model`, `direction` (input/output), `tokens`, `costMicros`, `at`, `conversationId?`.
- Instrument `src/lib/ai-agent.ts` to write a `TokenUsage` row after every LLM call (Gemini + OpenAI both expose token counts in their responses).
- Aggregator job runs daily; rolls up per-tenant per-period totals into `Subscription.tokensUsedThisPeriod`.
- On period close: if `tokensUsedThisPeriod > Tier.tokenAllowance`, create an overage `Invoice` line.

The overage price is `provider_unit_price × (1 + Markup)`. Markup TBD in commercial agreement (see `docs/app-overview.md` §3.2 footnote).

**Dependency:** B1.

### B8 — Public pricing v2 (Week 9)

Once we have invoicing + tax + overage metering, the public pricing page can show:

- Plan price (in user's currency if we localise; else USD with note).
- "Tax computed at checkout based on your country" line.
- Included token allowance + overage rate.
- Link to a Sample Invoice PDF (huge trust signal for B2B).

**Dependency:** B1, B3, B7.

---

## 5. Defaults that ship with billing

These are the **billing defaults** — the values we pick that the user does not have to think about. Documented separately because they are commercial decisions, not engineering decisions, and they will get tuned post-pilot.

| Default | Value v1 | Rationale | Revisit when |
|---|---|---|---|
| Subscription price | $25 USD / month | What's already in the code | After pilot signal (Track A §3) |
| Trial length | 30 days standard; 60 days pilots | Tested in Revolut integration; pilots get extra | After Week 12 conversion data |
| Token allowance per tier | TBD with advisor on the commercial agreement, initially **1.5M Gemini-Flash equivalent tokens / month** | Covers ~2,000 average bookings/month based on our internal estimate; large enough to be invisible to small tenants | After 1 month of real `TokenUsage` data |
| Overage markup | 30% over provider list price | Industry-typical SaaS LLM markup | After 1 month of real `TokenUsage` data + competitive scan |
| Currency | USD | What we have | After advisor consult; may force RON or EUR for RO/EU |
| Dunning retry schedule | 3 retries at +3d, +5d, +7d | Standard SaaS dunning | After 30 days of churn data |
| Grace period after final failed retry | 7 days | Balances tenant patience vs ours | After 30 days of churn data |
| Refund policy | Pro-rata within 14 days of charge, no questions | Aligned with EU consumer law; reduces support burden | Whenever a refund pattern emerges |

These defaults live in code (`src/lib/billing-defaults.ts`, new file) so they are one place to edit, version-controlled, and surfaceable to the tenant.

---

## 6. Outbound transactional email (cross-cutting)

Track B depends on outbound email for:

- "Your subscription renewed — invoice attached"
- "Payment failed — please update your card"
- "Your subscription expires in 3 days"
- Credit note + refund confirmation

This is **the email channel referenced in [`docs/messaging-channels-strategy.md`](../messaging-channels-strategy.md)** as "worth it." We add it as a B-prerequisite, not a separate track. Concrete plan:

- Provider: Resend or Postmark (Resend is cheaper and integrates with React Email; Postmark has better deliverability reputation). Default to Resend.
- One `EmailTemplate` enum + one `sendTransactionalEmail` helper.
- 4–6 templates initially: invoice, payment-failed, trial-ending-3d, trial-ended, subscription-cancelled, refund-issued.

**Sequencing:** Email ships in Week 4 alongside dunning (B5). We do not block B1/B2/B3 on it.

---

## 7. Exit criteria for Track B

Track B is "done enough to launch publicly" when **all** of these are true:

1. A new tenant in any of {RO, DE, US} can complete checkout and gets a correctly-VAT'd invoice as a PDF within 5 minutes.
2. RO B2B invoices appear in ANAF e-Factura SPV within 1 business day.
3. Renewal autopay runs daily without manual intervention; failed renewals enter dunning automatically.
4. A refund issued via Revolut produces a matching credit note within 1 hour.
5. Token usage is metered for every tenant; overage is computed at period-close.
6. The tenant dashboard at `/billing` shows: current period, next renewal date, last 12 invoices, payment method, cancel button.

If 1–4 are true but 5–6 are partial, we can launch on a flat-fee model and ship overage post-launch. Track this in [`07-risks-and-open-decisions.md`](./07-risks-and-open-decisions.md) §D5.
