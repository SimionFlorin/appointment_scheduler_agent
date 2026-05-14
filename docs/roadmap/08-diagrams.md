# 08 — Diagrams

All roadmap diagrams in one place, in Mermaid (renders natively on GitHub, in most Markdown viewers, and in the Cursor / VS Code preview).

If a diagram does not render where you are looking at this, paste the fenced ```mermaid``` block into <https://mermaid.live>.

---

## 0. Phase 0 → Phase 1 (the gate)

```mermaid
flowchart LR
    subgraph Phase0["Phase 0 — App dev-readiness (GATE)"]
        Z1[Audit + dogfood plan]
        Z2[Eng fixes P0-1..P0-12<br/>incl. taxonomy + 3 pilot verticals]
        Z3[Meta App Review submit<br/>external queue 1-3 wks]
        Z4[Founder dogfood on real<br/>demo Meta number, 2 weeks]
        Z5[Live $1 charge + autopay<br/>+ dunning cycle on test tenant]
        Z6[Friction backlog burn-down]
        Z7{Sign-off:<br/>12 of 12 criteria green?}
    end

    Z1 --> Z2
    Z1 --> Z3
    Z2 --> Z4
    Z4 --> Z6
    Z5 --> Z6
    Z6 --> Z7
    Z3 --> Z7
    Z7 -- no --> Z6
    Z7 -- yes --> P1[Phase 1: four parallel tracks begin]

    classDef gate fill:#fee2e2,stroke:#b91c1c,color:#000;
    class Z7 gate;
```

Phase 0 fixes are listed in detail in [`00-phase-0-app-readiness.md`](./00-phase-0-app-readiness.md) §3.

---

## 1. Parallel tracks (Phase 1, high-level)

```mermaid
flowchart LR
    subgraph TrackA["Track A — Signup & pilots (external-clock)"]
        A1[Recruit 5 pilots<br/>3 priority verticals]
        A2[Validate embedded signup<br/>live, observed]
        A3[Meta App Review]
        A4[Run 4-week pilot]
        A5[Convert to paid]
    end

    subgraph TrackB["Track B — Billing & taxes (heads-down)"]
        B1[Invoice model + PDF]
        B2[Country detect + VATIN/VIES]
        B3[Tax-scheme + price display]
        B4[Romanian e-Factura]
        B5[Autopay + dunning + email]
        B6[Refunds + credit notes]
        B7[Token-overage metering R2]
    end

    subgraph TrackC["Track C — Vertical defaults"]
        C1[Vertical taxonomy refactor]
        C2[Seed 3 pilot verticals]
        C3[Per-vertical AI prompts]
        C4[Seed remaining 5 verticals]
    end

    subgraph TrackD["Track D — GTM + launch"]
        D1[Pricing v2 from pilot data]
        D2[Pricing page + tax UX]
        D3[Outbound sales]
        D4[Public launch]
    end

    C2 --> A1
    A3 --> A2
    A2 --> A4
    A4 --> A5

    B1 --> B2
    B2 --> B3
    B1 --> B5
    B1 --> B6
    B3 --> B4
    B1 --> B7

    C1 --> C2
    C2 --> C3
    C3 --> C4

    A5 --> D1
    B3 --> D2
    B4 --> D2
    D1 --> D3
    D2 --> D3
    D3 --> D4
```

---

## 2. Dependency graph (what blocks what)

```mermaid
graph TD
    E1[Pilot recruitment]:::ext
    E2[Meta App Review submit]:::ext
    E3[Tax advisor consult]:::ext
    E4[Revolut prod + ANAF API access]:::ext

    A1[Observed embedded signup]
    A2[Live pilot 4 weeks]
    A4[Convert pilot to paid]

    B1[Invoice + PDF]
    B2[VAT + VATIN]
    B3[Tax scheme]
    B4[e-Factura]
    B5[Autopay + dunning]
    B7[Token overage]

    C1[Vertical taxonomy]
    C2[Seed pilot verticals]
    C3[Pilot vertical prompts]

    D1[Pricing v2]
    D2[Pricing page v2]
    D3[Outbound sales]
    D4[Public launch]

    E1 --> A1
    E2 --> A1
    C2 --> A1
    A1 --> A2 --> A4

    E3 --> B2
    E3 --> B3
    B1 --> B2 --> B3 --> B4
    E4 --> B4
    B1 --> B5
    B1 --> B7

    C1 --> C2 --> C3

    A4 --> D1
    A2 --> D1
    B3 --> D2
    B4 --> D2
    D1 --> D3
    D2 --> D3
    D3 --> D4

    classDef ext fill:#fde68a,stroke:#92400e,color:#000;
```

Yellow nodes are external-clock dependencies. They all start Week 0.

---

## 3. Full Gantt — Phase 0 then Phase 1

```mermaid
gantt
    title BookMe AI — Phase 0 then Phase 1
    dateFormat  YYYY-MM-DD
    axisFormat %b %d

    section Phase 0 — App readiness (GATE)
    Audit + dogfood plan              :done, p0a, 2026-05-14, 3d
    P0 eng fixes (12 items)           :crit, p0b, 2026-05-17, 21d
    Meta App Review submission        :crit, p0meta, 2026-05-17, 21d
    Tax advisor consult booked        :crit, p0tax, 2026-05-17, 14d
    Founder dogfood on demo number    :crit, p0dog, 2026-05-24, 14d
    Friction backlog burn-down        :p0fric, after p0dog, 7d
    Phase 0 sign-off                  :milestone, p0gate, after p0fric, 0d

    section Phase 1, Track 1 — Signup & pilots
    Pilot recruitment outreach        :crit, e1, after p0gate, 7d
    Revolut prod + ANAF API request   :crit, e4, after p0gate, 14d
    Pilots 1-2 observed signup        :a1, after e1, 14d
    Pilots 3-5 unobserved signup      :a2, after a1, 14d
    Live pilot use (all 5)            :a3, after a1, 30d
    End-of-pilot conversion calls     :a4, after a3, 7d

    section Phase 1, Track 2 — Billing & taxes
    B1 Invoice model + PDF            :b1, after p0gate, 14d
    B2 Country + VATIN                :b2, after b1, 10d
    B3 Tax-scheme + display           :b3, after b2, 7d
    B5 Autopay + dunning + email      :b5, after b1, 14d
    B4 Romanian e-Factura             :b4, after b3, 21d
    B6 Refunds + credit notes         :b6, after b4, 10d
    B7 Token-overage metering         :b7, after b1, 21d

    section Phase 1, Track 3 — Vertical defaults
    C4 Seed remaining 5 verticals     :c4, after p0gate, 14d
    C5 Per-vertical prompts + fields  :c5, after c4, 14d

    section Phase 1, Track 4 — GTM + launch
    D1 Pricing v2                     :d1, after a3, 7d
    D2 Pricing page + tax UX          :d2, after b3, 7d
    D3 Outbound sales                 :d3, after d1, 14d
    D4 Public launch                  :milestone, d4, after d3, 1d
```

`crit` rows are the critical path. **The Phase 0 sign-off milestone is the single biggest gate**; everything in Phase 1 starts from that anchor.

Track 3 sub-items C1 (taxonomy refactor) + C2 (seed 3 pilot verticals) + C3 (per-vertical prompts for pilot verticals) are absorbed into Phase 0's P0-3 fix and therefore do not appear separately in the Phase 1 section above.

---

## 4. Tenant signup flow (current vs target)

### 4.1 Current

```mermaid
sequenceDiagram
    actor T as Tenant
    participant W as Web app
    participant G as Google OAuth
    participant M as Meta WhatsApp
    participant DB as DB

    T->>W: Visit /login
    W->>G: Redirect to Google OAuth (calendar scopes)
    G-->>W: Tokens
    W->>DB: Create User, ensureSubscription (30d trial)
    W-->>T: Onboarding page
    T->>W: Pick profession (DENTIST / MECHANIC)
    W->>DB: Seed default services
    W-->>T: Connect WhatsApp page
    Note over T,M: ⚠️ Tenant must manually obtain<br/>WABA ID + Phone Number ID +<br/>System User access token from Meta
    T->>M: Manual Meta Business setup<br/>(often takes hours, often fails)
    T->>W: Paste credentials
    W->>M: Test send a message
    M-->>W: 131031 (or success)
```

### 4.2 Target (post-Track-A)

```mermaid
sequenceDiagram
    actor T as Tenant
    participant W as Web app
    participant G as Google OAuth
    participant M as Meta WhatsApp
    participant DB as DB

    T->>W: Visit /login
    W->>G: Redirect to Google OAuth
    G-->>W: Tokens
    W->>DB: Create User, ensureSubscription
    W-->>T: Onboarding step 1: Pick vertical
    T->>W: Pick from 8 priority verticals
    W->>DB: Seed vertical defaults + persona
    W-->>T: Onboarding step 2: Billing details
    T->>W: Country + business name + VATIN
    W->>VIES: Validate VATIN
    W->>DB: Save BusinessProfile w/ tax info
    W-->>T: Onboarding step 3: Embedded signup
    T->>M: Embedded signup widget<br/>(approved app, App Review passed)
    M-->>W: WABA ID + Phone Number ID + token via OAuth
    W->>M: Subscribe to webhook
    W->>M: Test send
    M-->>W: Success
    W-->>T: Done ✅
```

The target flow is what Track A §4 + Track B §B2 + Track C §4 jointly produce.

---

## 5. Billing lifecycle (target, post-Track-B)

```mermaid
stateDiagram-v2
    [*] --> TRIALING: signup
    TRIALING --> ACTIVE: first successful charge
    TRIALING --> EXPIRED: 30d (or 60d pilot) lapsed,<br/>no payment method
    ACTIVE --> ACTIVE: monthly renewal charge succeeded<br/>(invoice issued, e-Factura submitted if RO B2B)
    ACTIVE --> PAST_DUE: renewal charge failed
    PAST_DUE --> ACTIVE: retry succeeded (T+3d, T+5d, T+7d)
    PAST_DUE --> EXPIRED: 7d grace after 3 failed retries
    ACTIVE --> CANCELLED: tenant cancels
    CANCELLED --> [*]: end of period
    EXPIRED --> ACTIVE: tenant pays again
```

---

## 6. Tax-scheme decision (target, post-B3)

```mermaid
flowchart TD
    start([Tenant checks out]) --> q1{Tenant country?}
    q1 -- RO --> q2{Has valid RO CUI?}
    q2 -- yes --> ro_b2b[B2B-RO: charge net + 19% RO VAT;<br/>submit e-Factura to ANAF]
    q2 -- no --> ro_b2c[B2C-RO: charge gross including 19% RO VAT]
    q1 -- Other EU --> q3{Has valid EU VATIN per VIES?}
    q3 -- yes --> eu_b2b[B2B-EU: charge net; invoice mentions<br/>'reverse charge — recipient pays VAT']
    q3 -- no --> eu_b2c[B2C-EU OSS: charge gross<br/>at TENANT's country rate]
    q1 -- Non-EU --> q4{US tenant + nexus state?}
    q4 -- yes --> us_tax[Out of scope v1:<br/>flag for TaxJar/Anrok later]
    q4 -- no --> rest[Charge net, no VAT,<br/>no sales tax collected]
```

---

## 7. Per-pilot timeline

```mermaid
gantt
    title One pilot from recruit to converted
    dateFormat  YYYY-MM-DD
    axisFormat %b %d

    section Pilot life
    Recruit & agreement                :p1, 2026-05-14, 7d
    Observed embedded signup           :crit, p2, after p1, 1d
    Setup polish (48h SLA)             :p3, after p2, 2d
    Live use, week 1                   :p4, after p3, 7d
    Mid-pilot survey (Week 2)          :milestone, p5, after p4, 1d
    Live use, weeks 2-4                :p6, after p5, 21d
    Conversion call (end of pilot)     :crit, p7, after p6, 1d
    Paid conversion                    :milestone, p8, after p7, 1d
```
