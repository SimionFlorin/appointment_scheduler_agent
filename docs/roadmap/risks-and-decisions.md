# Appendix C — Risks & open decisions

> Living doc. The format is *deliberately minimal* — every entry is a one-line decision, a trigger, and an owner. If a row needs more than two paragraphs of context, that context belongs in its stage doc, not here.

---

## Risk register

Sorted by *expected pain × likelihood*, highest first.

| # | Risk | Likelihood | Pain if it happens | Cheapest signal | Mitigation |
|---|---|---|---|---|---|
| R1 | **Embedded Signup not usable by a non-technical owner.** We've never validated end-to-end. | High | Pilot is delayed by weeks while we either screen-share every signup or rebuild. | Founder dogfood walkthrough ([`01-pre-pilot.md` §A](./01-pre-pilot.md#a-embedded-signup-dogfood-founder-23-days)). | Hand-built signup-guidance banner; if friction is severe, fall back to manual paste + screen-share for pilot only. |
| R2 | **Pilots churn silently in week 2.** Owner stops sharing the number after a single bad reply. | High | We learn the wrong thing — that the product doesn't work, when really it wasn't used. | Discord ping when a pilot's conversations drop to 0 for 3 days. | Proactive WhatsApp check-in from founder. |
| R3 | **ANAF e-Factura rejects our XML.** Compliance breach for RO B2B. | Medium | Manual SPV upload until fixed; potential ANAF fine after 5 days. | Cron poll alerts on `efacturaStatus = rejected`. | Manual upload while we debug; keep a "manual override" admin button. |
| R4 | **Revolut autopay silently fails on a subset of cards.** Customer doesn't realise; we lose MRR. | Medium | Churn invisible until end-of-period reconciliation. | `PAST_DUE` count > 5% in any month. | Backup processor (Stripe) becomes a justified build. |
| R5 | **WhatsApp quality rating drops on a tenant number** because the AI agent's tone is wrong, or replies are too fast / too templated. | Medium | Tenant's number is throttled; we look responsible. | Tenant tells us, or Meta's WABA banner. | Audit conversations, soften prompt, add a 1–3 sec randomised reply delay if needed. |
| R6 | **Calendar double-sync race** — owner manually adds a slot between `get_availability` and `book_appointment`. | Medium | Customer thinks they're booked, walks in to a closed shop. | Pilot tells us. | Re-check inside `book_appointment` ([`01-pre-pilot.md` §D](./01-pre-pilot.md#d-critical-edge-cases-34-days-parallel)). |
| R7 | **AI hallucinates a service / price / hours** that doesn't exist. | Medium | Customer arrives expecting a service we never offered. | Pilot weekly check-in. | Tighten system prompt; do not let the agent invent services / hours outside `get_services` / `get_business_hours`. |
| R8 | **GDPR complaint** from a customer who didn't realise an AI was responding. | Low | Letter from ANSPDCP; fine cap is %-of-revenue, currently low. | Email from a regulator. | Add a one-line disclosure to the first reply per new customer: "Hi, this is the BookMe AI receptionist — replying on behalf of {business}." Pilot validates wording. |
| R9 | **Meta deprecates / changes Embedded Signup mid-pilot.** | Low | We rebuild the connector; pilots blocked. | Meta developer changelog. | Manual paste path is still there. |
| R10 | **LLM provider outage** (Gemini / OpenAI) during pilot. | Low | Bookings drop silently while customers wait for replies. | `processWhatsAppMessage` errors spike. | Per-tenant fallback to the other provider when the configured one returns 5xx. Trivial code change; defer until first incident. |
| R11 | **Solution Partner application denied or stuck for months.** | Low | We stay Tech Provider longer than planned; payment-method friction stays. | Meta status emails. | Tech Provider is good enough through Stage 5; revisit at $10k MRR. |
| R12 | **Pilot WTP < €25.** | Medium | Tier model needs to shift. | Week-4 debrief. | Consider €15 Starter tier or a "Lite" with fewer services / numbers. |
| R13 | **Pilot WTP > €50.** | Low | We're under-charging. | Same. | Raise Pro tier; keep Starter. |

---

## Decision log

Each decision has a **trigger condition** for revisiting. Don't revisit before the trigger fires.

| # | Decision | Chosen | Trigger to revisit |
|---|---|---|---|
| D1 | Meta Solution Partner vs Tech Provider | **Tech Provider** for pre-pilot, pilot, paid launch, Stage 1 GTM. | At $10k/mo MRR **or** 50 paying tenants. |
| D2 | Two legal entities (Mythril-Tech SRL + Mythril Tech LLC) | **Two — keep.** Invoice from the geographically correct one. | Tax-advisor says no. |
| D3 | Revolut vs Stripe | **Revolut.** | Revolut autopay churn > 5% in any month, **or** any Stage-3 customer asks for ACH / a non-card method that Revolut doesn't support. |
| D4 | Token allowance as a usage cap | **Yes — explicit allowance per tier, overage at provider cost + Markup.** | If overage UX confuses 3+ tenants in support. |
| D5 | EU VAT engine | **Hand-rolled lookup table.** | Adding a 4th legal entity, or expanding outside EU to 3+ tax regions. |
| D6 | US sales tax | **Defer.** | $5k/mo US MRR or first state-side audit letter. |
| D7 | Tests | **Skip until post-GTM** ([`06-post-gtm-hardening.md`](./06-post-gtm-hardening.md)). | GTM DoD met. |
| D8 | Annual prepay | **Defer.** | 3+ tenants ask in writing. |
| D9 | Multi-channel (Messenger / IG / SMS) | **Defer.** | A paying vertical specifically requires it (e.g. RO restaurants on Messenger). |
| D10 | Customer entity refactor | **Defer to post-GTM.** | Multi-channel decision (D9) triggers. |
| D11 | Sentry / structured logging | **Defer to post-GTM.** Discord webhook is enough now. | First time we miss an error for 24h. |
| D12 | Hiring | **Defer.** | MRR > €15k/mo; first hire is customer success. |
| D13 | Cron-based appointment reminders | **Stage 4** (paid launch), not pre-pilot. | If pilots ask for it before then, build the email side (no Meta template approval needed). |
| D14 | Pilot pricing | **Free for 4–8 weeks**, no card. | None — this is fixed. |
| D15 | Currency strategy | **EUR display + EUR charge** for EU visitors, **USD** elsewhere. RO tenants see EUR but are invoiced in RON via SRL. | Stage 2 RO scale-up, if RO tenants prefer to be **displayed** RON. |
| D16 | Profession enum scope | **Eight Priority 1 verticals pre-pilot**, plus existing `DENTIST` / `MECHANIC` for back-compat. | A Standard-tier vertical signs up and pays. |
| D17 | Founder-mode observability | **Discord webhook for errors**, weekly cron summary. | Post-GTM. |

---

## Open questions to bring to a tax advisor

Pre-paid-launch, book a 1-hour call with an accountant familiar with Romanian SaaS exports. Bring this list:

1. Are we required to charge VAT to a Romanian B2C customer if Mythril Tech LLC (US) is the seller? (Likely yes via place-of-supply rules + OSS.)
2. e-Factura — does the LLC need to file too if it sells to RO B2B? (Likely yes via SPV; need a CUI for the LLC's RO permanent establishment, or use SRL exclusively for RO customers.)
3. OSS registration — should we register in Romania for OSS to cover all 27 EU member states from the SRL?
4. Cross-border DAC7 reporting — applies?
5. When does Mythril Tech LLC need to start collecting US sales tax in any state, given we're a non-resident seller?
6. Are AI-generated invoices acceptable without manual sign-off for ANAF? (Yes per the latest e-Factura rules, but confirm.)
7. Cost basis for inter-company transactions (SRL bills LLC for engineering, or vice versa)?

The cost of the consultation (€100–€300) is much smaller than the cost of doing this wrong.

---

## Decisions we deliberately are **not** making yet

These are listed so we don't accidentally make them under pressure mid-pilot:

- Which CRM to use for outbound sales.
- Which feature-flag tool (LaunchDarkly / Unleash / PostHog).
- Which support tool (Intercom / Crisp / a shared inbox).
- Which legal-doc generator beyond Iubenda.
- Whether to open-source anything.
- Whether to white-label the product.
- Whether to integrate with Calendly / Acuity / Square for migrations.

Each of these is a decision with a default ("not yet") and a clean trigger ("when a paying customer asks twice"). They are not pre-pilot, pilot, or paid-launch decisions.
