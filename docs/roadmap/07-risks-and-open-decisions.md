# 07 — Risks and open decisions

> Decisions and risks specific to **Phase 0** (app readiness) are listed in [`00-phase-0-app-readiness.md`](./00-phase-0-app-readiness.md) §9. The decisions and risks below are for Phase 1.

The roadmap is built on assumptions. This file lists them, names what would invalidate them, and identifies the decisions we have *not yet made*. Anything here is fair game for re-discussion in our weekly planning.

---

## 1. Decisions we have *not* made and need to make this quarter

Decisions are labelled `D{n}` and referenced from the other roadmap files.

### D1 — Which 3 of the 8 Priority 1 verticals do we pilot first?

**Recommended:** Barber shops, nail salons, independent auto repair.

**Why:**
- All three are in our existing default themes (we have dentist+mechanic; auto repair is adjacent; barbers/nails share dynamics with dentists in that they are appointment-driven service businesses with short turnover).
- High WhatsApp adoption among customers (RO market).
- Different price points and durations across the three → tests generalisation.
- We can likely find pilots in our personal network within 1 week.

**What would change the recommendation:**
- If founder network has 5 medspa intros warm and 0 barber intros, swap barber → medspa.
- If a partner deal (e.g. a vet supplier) lands first, swap auto repair → dog grooming.

**Deadline to decide:** End of Week 0.

### D2 — Do we ship without an invoice in the first 4 weeks of pilots?

**Recommended:** Yes, for the unpaid trial. No, for any paid charge.

**Why:** Pilots are free for 60 days; no invoice obligation triggers until we charge them. We do not delay pilots waiting for B1. But the moment Track B B1 lands (Week 2), we backfill an invoice for any subsequent charge.

**What would change the recommendation:** A pilot's accountant requests a "no-charge receipt" during the trial. Then we ship a `proforma` invoice flavour earlier.

**Deadline to decide:** Decided. Documented here.

### D3 — Currency: USD, EUR, RON?

**Open.** USD today. Tax advisor will tell us if a RO entity charging USD to an RO B2B customer is OK. EUR is more natural for EU pricing; RON is required for some RO accounting workflows.

**Decision owner:** Founder, after tax advisor consult (Week 0–2).

**Deadline:** Before Track B B2 ships (Week 3).

### D4 — Markup on Token Overage

**Open.** Stated default of 30% in [`03-track-b-billing-taxes.md`](./03-track-b-billing-taxes.md) §5. Real number lives in the commercial agreement, not the code.

**Decision owner:** Founder.

**Deadline:** Before Track B B7 ships (Week 8).

### D5 — Can we launch publicly if Token Overage metering (B7) is not ready?

**Recommended:** Yes — launch on flat $25 with a generous-but-documented "fair use" limit, and ship B7 within 30 days post-launch.

**Why:** B7 has internal-dev complexity (instrumenting `ai-agent.ts`, aggregator job, period-close logic) that should not gate a public launch if A+B1–B6 are solid. The risk of an abusive tenant burning our LLM budget in the first 30 days is bounded by the small tenant count and capped LLM provider budgets.

**What would change the recommendation:** Any tenant in pilots produces >10× the median token usage of their cohort. Then we ship B7 before launch.

**Deadline:** Re-decide at the Week 9 planning checkpoint.

### D6 — Do we keep both Gemini and OpenAI?

**Recommended:** Keep both abstraction, default Gemini, expose OpenAI as a per-tenant flag (already shipped). Decide on consolidation only after B7 metering proves we are cost-bound on one provider.

**Deadline:** Out of scope for Q2.

### D7 — Email provider: Resend vs Postmark?

**Recommended:** Resend (cheaper, native React Email integration, sufficient deliverability for transactional).

**What would change the recommendation:** A pilot reports our trial-ending emails landing in spam. Then evaluate Postmark / SendGrid.

**Deadline:** Week 3 (before Track B B5 dunning lands).

### D8 — Pilot extension policy if a pilot is not ready to decide at Week 7

**Recommended:** Offer one 30-day extension at the existing free-pilot terms. After that, they must either convert or churn. We do not run pilots indefinitely.

**Deadline:** Decide before first end-of-pilot call (Week 7).

### D9 — Customer (end-user) data retention

**Open.** Customer phone numbers + conversation logs accumulate. EU GDPR + RO law require a retention policy. Today the schema does not encode one.

**Recommended starting policy:**
- Conversation logs: 24 months from last message.
- Appointment records: 7 years (for tenant's tax records).
- Customer profile (name+phone+notes): until tenant deletes or 24 months of inactivity.
- Pilot tenants get a one-line addition to their pilot agreement disclosing the above.

**Deadline:** Before public launch (Week 12).

### D10 — Do we ship a separate Romanian-language dashboard?

**Recommended:** Not in this 12-week window. The dashboard stays English; the AI receptionist's customer-facing language is already controllable per vertical (Track C §5). Romanian dashboard is a Q3 item.

**What would change the recommendation:** ≥3 pilots cite "the dashboard is in English" as a friction in the mid-pilot survey.

**Deadline:** Decide based on Week 4 survey data.

---

## 2. Risks

Risks are labelled `R{n}`. For each: what it is, how likely, what we do.

### R1 — Meta App Review rejected or delayed >4 weeks

- **Likelihood:** Medium. We have already encountered Meta WhatsApp errors (see [`whatsapp-error-131031-troubleshooting.md`](../../whatsapp-error-131031-troubleshooting.md)).
- **Impact:** Embedded signup cannot be used by non-approved tenants. Pilots fall back to Twilio.
- **Mitigation:** Submit Week 0 with rough materials. Keep Twilio path first-class. Have a `pilotProvider` field that defaults to Twilio for pilots until Meta App Review lands.

### R2 — Romanian e-Factura is harder to wire than estimated

- **Likelihood:** Medium–high. ANAF API quality is well-known to be variable. UBL 2.1 XML has many fields.
- **Impact:** B4 slips, RO B2B paid tenants cannot be issued legally compliant invoices, RO B2B conversion blocked.
- **Mitigation:** Allocate 3 weeks (Weeks 5–7) instead of 1. If still not done by Week 8, narrow the launch to RO B2C + EU + US (we can charge them without ANAF) and ship RO B2B post-launch.

### R3 — Pilots do not convert (≥3 of 5 fail)

- **Likelihood:** Medium. Possible reasons: AI quality below bar; price too high; "AI receptionist" is not the problem they want solved.
- **Impact:** Track D launch is hollow. Pricing v2 reads as panic, not pivot.
- **Mitigation:** Mid-pilot survey at Week 2 catches early signal. If ≥2 pilots are at 1–4/10 usefulness at mid-pilot, we re-plan rather than push through.

### R4 — Token costs blow past assumed budget

- **Likelihood:** Low–medium with Gemini Flash; medium with OpenAI GPT-4-class models.
- **Impact:** Unit economics fall below 0; $25/month does not cover token cost for a busy salon.
- **Mitigation:** B7 metering is the test. If pre-metering pilot data (from logs, retroactively counted) shows a salon burning >$8/month in tokens at $25 price, accelerate B7 before launch.

### R5 — A pilot has a public AI failure that costs them money or reputation

- **Likelihood:** Low if we monitor; higher than zero always.
- **Impact:** Pilot churns, possibly publicly. Word of mouth in their vertical turns against us locally.
- **Mitigation:**
  - Per-vertical "safety" rules in the AI prompt (e.g. MedSpa AI never books medical procedures without a consult — see Track C §5.7).
  - For the first 2 weeks of each pilot, the founder monitors conversations daily.
  - Pilot agreement explicitly disclaims liability for AI errors (§2 above).
  - In-app "panic switch" that disables the AI agent and falls back to a "we will reply soon" auto-message. Ship this as part of Track A pilot-prep.

### R6 — Revolut is wrong for our use case

- **Likelihood:** Low. We have made an explicit commitment; integration is shipped.
- **Impact:** If Revolut Business cannot handle multi-currency / VAT-correct charges / B2B reverse-charge mention, we have to migrate processors mid-track.
- **Mitigation:** Tax advisor consult includes "is Revolut Business an appropriate processor for our jurisdiction + customer mix" as a question. If "no," we have time to migrate before public launch (Week 12).

### R7 — Founder is bottleneck on pilots + sales + tax decisions

- **Likelihood:** High. There is one founder and many calendar-blocked external dependencies.
- **Impact:** Track A pilots stall mid-pilot because nobody is doing weekly check-ins.
- **Mitigation:**
  - Front-load all external-clock starters in Week 0 so founder time is not the bottleneck on *timing*.
  - Time-box pilot check-ins (15 min each) and batch them on one day per week.
  - Acceptable for a pilot check-in to slip by 2–3 days. Not acceptable for a P0 signup bug to slip.

### R8 — Pilot conversion to paid is blocked by Track B billing not being ready

- **Likelihood:** Medium. If pilots want to pay in Week 7 but Track B is mid-flight (e.g. B5 dunning not done), we cannot reliably collect.
- **Impact:** Pilots cool on us; we lose conversion momentum.
- **Mitigation:** B1 (invoices) and B2 (VAT/VATIN) **must** ship by Week 4. The other Track B work can land after first paid charges. Worst case, we charge the first pilot manually via Revolut while B5 ships behind the scenes.

### R9 — A non-Priority-1 vertical surprises us with strong inbound

- **Likelihood:** Low–medium.
- **Impact:** Distraction from the 8 priority verticals.
- **Mitigation:** Documented rule (Track C §8): no new defaults for non-Priority-1 verticals in 12 weeks. We can sell into any vertical with manual configuration, but we do not seed defaults for them until ≥3 priority verticals have paying tenants.

### R10 — Customer-facing data privacy complaint

- **Likelihood:** Low in pilot, growing post-launch.
- **Impact:** GDPR complaint or RO ANSPDCP investigation.
- **Mitigation:**
  - Tenants must disclose AI handling of WhatsApp messages in their business profile (D9 above + pilot agreement).
  - Privacy policy is already public (`src/app/privacy-policy/page.tsx`).
  - Retention policy (D9) shipped before launch.

---

## 3. Decisions we have explicitly *not* deferred to this roadmap

These came up in conversation or are recurring temptations, and we are saying "no" on the record:

- **No additional conversational channels** (SMS, IG, Messenger) in 12 weeks. See [`docs/messaging-channels-strategy.md`](../messaging-channels-strategy.md).
- **No third LLM provider** in 12 weeks.
- **No mobile app** in 12 weeks.
- **No multi-tenant agency / white-label** in 12 weeks.
- **No paid acquisition** in 12 weeks.

These are real options that will be evaluated post-Week-12 with data, not pre-Week-12 by impulse.
