# Track D — Pricing, GTM, public launch

**Status:** Gated on outputs of Track A (pilot data) and Track B (billing readiness). Begins meaningfully Week 6+.

**Goal:** A repeatable, accountable, paid-acquisition or outbound-sales motion that brings new paying tenants into BookMe AI without us being on every call.

---

## 1. Why this track exists last

We do not know:

- What our actual conversion price is. The `$25/month` in code is a guess, not a tested price.
- What the actual willingness-to-pay split between verticals is.
- Whether the value prop is "I save the receptionist's salary" (high WTP) or "I avoid losing late-night bookings" (low WTP).
- How long the sales cycle is for a barber vs an auto shop vs a medspa.

We will not invent answers to those questions; we will read them off the pilot data from Track A and tune the launch accordingly.

---

## 2. Deliverables, sequenced

### D1 — Pricing model v2 (Week 7, post-mid-pilot)

Inputs:
- End-of-pilot conversion conversations from Track A §3 step 5.
- Real `TokenUsage` data from Track B7 once metering is live.
- Competitive scan: what do incumbents (Reservio, Treatwell, ManyChat-built bots, local-language tools) charge per vertical?

Outputs:
- One or more tiers. **Default position: stay single-tier at $25** unless pilot data forces tiering.
- Token allowance per tier (data-driven, from real pilot consumption × 1.5–2× safety margin).
- Overage rate per 1k tokens (provider unit cost × 1.30 default markup).
- Annual prepay discount: 2 months free for paying upfront (i.e. 10 × monthly).

A pricing decision document (separate file: `docs/roadmap/decisions/pricing-v2.md`) is produced at the end of this step. Do **not** change `src/app/pricing/page.tsx` until D1 lands.

### D2 — Pricing page + tax-inclusive UX (Week 9, gated on B3)

Once B3 (tax-scheme decision + price display) ships:

- Pricing page asks for country first (default by geo).
- Shows tax-inclusive total to B2C and tax-exclusive + "VAT applies at checkout" to B2B.
- Shows sample invoice PDF for trust.
- Adds vertical-specific landing pages (`/for/barbers`, `/for/nail-salons`, `/for/auto-repair`, etc.) with vertical-tuned copy and a vertical-pinned signup link.

### D3 — Outbound sales motion (Week 10–11)

Hand-outbound, not scaled paid acquisition. Why: pilots' case studies are our only proof, and proof is what gets a barber to say yes.

Per pilot vertical:

- Build a list of 50 candidate businesses (Google Maps + Instagram + RO-specific directories).
- Send a personalised WhatsApp / Instagram DM (their channel of choice) referencing the case-study pilot. Format: "Hey, [pilot name]'s barber shop in [city] booked X bookings via AI last month. Want me to set you up the same way? Free for 30 days."
- Target: 3 calls/day per vertical → 15/week → 45 over 3 weeks → ~5 conversions per vertical at a 10% close rate.

A simple CRM (Notion DB or Airtable) tracks: lead, vertical, status (cold / replied / call booked / signed up / paid).

### D4 — Public launch (Week 12)

- Public Product Hunt post or RO-tech announcement (the latter has more conversion power locally).
- LinkedIn announcement post from founder with the case-study numbers.
- The Track B billing stack is live; the Track C 8 verticals are live; the Track A pilots are paying tenants we can quote.

We do not launch on Product Hunt as a goal in itself — we launch because the **system can absorb new tenants without us breaking**. That is the gate.

---

## 3. Pricing principles we will follow

These are constraints on D1, not the answer. They live here so D1 cannot wander off.

1. **One number on the marketing page.** A barber's brain does not parse a feature matrix. Even if we run 2 tiers internally for upsells, the homepage shows one price.
2. **Free trial, never freemium.** Freemium attracts non-customers; free trial attracts customers who are deciding.
3. **No anchored fake "enterprise" tier we cannot deliver.** It erodes trust in B2B-SMB sales.
4. **Annual prepay is a discount, not a feature.** "Save 2 months by paying yearly" is the framing; we do not lock features behind annual.
5. **Tax shown inclusive to consumers, exclusive to businesses** (EU convention). Do not invert this; it costs trust.

---

## 4. Acquisition channels we will *not* use in Weeks 0–12

We are explicit so we do not get nerd-sniped by them:

- **Google / Meta paid ads.** Need a tuned landing page per vertical + working pricing + 30 days of conversion data. Out of scope.
- **Affiliate / partner program.** Needs a partner portal + revenue-share accounting + the volume to make a partner say yes. Out of scope.
- **Free SEO blog.** 6-month payoff curve, faster channels available.
- **App store presence.** No app.
- **Trade shows / conferences.** Not in 12 weeks.

We can revisit any of these after Week 12 with pilot data in hand.

---

## 5. Sales materials that ship in this track

The minimum kit, owned by the founder:

| Artifact | When | Format |
|---|---|---|
| 1-page pilot agreement | Week 0 | PDF (e-sign via Revolut Sign / DocuSign-free / a Notion page) |
| Public Pricing page v2 | Week 9 | Web (`src/app/pricing/page.tsx` update) |
| Sample Invoice PDF | Week 6 (from B1) | PDF |
| Per-vertical 1-pager (×3, then ×5) | Week 6 / 10 | PDF |
| Case-study quote sheet | Week 8 | Web page + PDF (with first 2 pilot quotes) |
| Demo video (90 seconds, vertical-specific) | Week 9 | MP4 |
| Outbound DM template per vertical | Week 10 | Notion |

Nothing in this list is a design dependency we cannot self-serve. None of it goes to an external designer for v1.

---

## 6. Exit criteria for Track D

1. Pricing v2 is decided, documented (`docs/roadmap/decisions/pricing-v2.md`), and shipped.
2. Pricing page localises tax display correctly for at least RO, DE, US.
3. ≥10 paid tenants across ≥3 verticals at end of Week 12.
4. ≥1 case-study page live with named pilot quote.
5. A repeatable weekly outbound process is documented and run for at least 2 consecutive weeks.

---

## 7. What we do at Week 13 (out-of-scope but flagged)

So the next planning cycle is not blindsided:

- Look at the 47 non-Priority-1 verticals and pick the next 2–4 to expand into based on inbound interest.
- Re-evaluate the messaging-channels strategy with real volume data (does outbound email reminder actually reduce no-shows? then ship it; else don't).
- Re-evaluate token allowance + markup with 4 weeks of metered data.
- Open a US-tax conversation if we have any US tenants by then.
- Open a profitability review using the cost categories from [`docs/app-overview.md`](../app-overview.md) §4.
