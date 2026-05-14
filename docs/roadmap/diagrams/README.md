# Roadmap diagrams

All diagrams are mermaid blocks renderable directly on GitHub. They are inlined where they're most useful (Gantt in [`README.md`](../README.md), flowcharts and ERD in the relevant stage docs), and **collected here** for easy linking.

Index:

- [Critical path & parallelism (Gantt)](#critical-path--parallelism)
- [Stage dependency graph](#stage-dependency-graph)
- [Pre-pilot work parallelism](#pre-pilot-work-parallelism)
- [Pilot calendar](#pilot-calendar)
- [Billing layer sequence](#billing-layer-sequence)
- [Billing data model (ERD)](#billing-data-model-erd)
- [Subscription state machine](#subscription-state-machine)
- [Money flow sequence](#money-flow-sequence)
- [Customer booking sequence (WhatsApp → Calendar)](#customer-booking-sequence-whatsapp--calendar)
- [Post-GTM hardening order](#post-gtm-hardening-order)

---

## Critical path & parallelism

```mermaid
gantt
    title BookMe AI — Stage parallelism (weeks since "today")
    dateFormat  YYYY-MM-DD
    axisFormat  W%V

    section Pre-pilot (us only)
    ES self-test (dogfood)           :a1, 2026-05-14, 4d
    Top-8 vertical defaults          :a2, 2026-05-14, 5d
    Critical edge cases              :a3, after a1, 6d
    Onboarding polish (<10 min)      :a4, after a2, 4d
    Recruit 3–6 pilot businesses     :a5, after a1, 7d

    section Pilot (free, customer-driven)
    Pilot week 1 (hand-holding)      :b1, after a3, 7d
    Pilot weeks 2–6 (light support)  :b2, after b1, 35d
    Pilot debrief + go/no-go         :b3, after b2, 3d

    section Billing + tax (parallel)
    Tier model + token metering      :c1, after a3, 10d
    Revolut autopay finalisation     :c2, after c1, 5d
    VAT + RO e-Factura               :c3, after c2, 10d
    Invoices + dunning + refunds     :c4, after c3, 7d
    Billing UX polish                :c5, after c4, 4d

    section Paid launch
    Flip pilots to paid              :d1, after b3, 5d
    Refund / cancel UX hardening     :d2, after d1, 4d

    section GTM
    Stage-1 ads (US Meta + Search)   :e1, after d1, 30d
    Stage-2 RO expansion             :e2, after e1, 30d

    section Post-GTM hardening
    Tests + multilingual + analytics :f1, after e2, 30d
```

## Stage dependency graph

```mermaid
flowchart LR
    A[Pre-pilot: ES dogfood<br/>+ defaults + edge cases] --> B[Pilot recruitment]
    B --> C[Free pilot running]
    A --> D[Billing tiers + autopay]
    D --> E[VAT + e-Factura + invoices]
    C --> F[Pilot debrief<br/>go/no-go]
    E --> F
    F -->|Go| G[Paid launch]
    G --> H[GTM Stage 1: US]
    H --> I[GTM Stage 2: RO]
    I --> J[Hardening: tests, multilingual,<br/>multi-channel, Customer model]
    F -->|No-go| K[Iterate product, re-pilot]
    K --> B
```

## Pre-pilot work parallelism

```mermaid
flowchart TB
    subgraph FNDR[Founder]
      A[A. ES dogfood walkthrough]
      E[E. Onboarding audit]
      F[F. Pilot recruitment]
    end
    subgraph DEV[Dev]
      B[B. Webhook signature]
      C[C. Top-8 defaults]
      D[D. Edge cases]
      G[G. Pilot kill switches]
      H[H. Discord error pipe]
    end
    A -->|surfaces friction list| D
    A -->|copy for ES guidance banner| C
    F -->|specific vertical asks| C
    F -->|specific edge cases| D
    C --> G
    D --> G
    G --> PILOTSTART[Pilot can start]
    H --> PILOTSTART
```

## Pilot calendar

```mermaid
gantt
    title Pilot calendar (8-week ceiling)
    dateFormat  YYYY-MM-DD
    section Pilots
    Pilot 1 (barber)        :p1, 2026-05-26, 56d
    Pilot 2 (nails)         :p2, 2026-05-26, 56d
    Pilot 3 (dog grooming)  :p3, 2026-05-30, 52d
    Pilot 4 (auto repair)   :p4, 2026-06-02, 49d
    Pilot 5 (physio)        :p5, 2026-06-09, 42d
    Pilot 6 (MedSpa)        :p6, 2026-06-09, 42d
    section Founder
    Onboarding hand-holding :h1, 2026-05-26, 7d
    Weekly check-ins        :h2, after h1, 35d
    Week-4 debriefs         :h3, 2026-06-23, 7d
    Go/no-go decision       :h4, after h3, 3d
    section Build
    Billing tiers           :b1, 2026-05-26, 14d
    Autopay finalisation    :b2, after b1, 5d
    VAT + e-Factura         :b3, after b2, 14d
    Invoices + dunning      :b4, after b3, 7d
```

## Billing layer sequence

```mermaid
flowchart LR
    Layer1[Layer 1<br/>Tiers + token metering<br/>~10d] --> Layer2[Layer 2<br/>Recurring autopay<br/>~5d]
    Layer2 --> Layer3[Layer 3<br/>VAT + RO e-Factura<br/>~10d]
    Layer3 --> Layer4[Layer 4<br/>Invoices + dunning + refunds<br/>~7d]
    Layer4 --> Layer5[Layer 5<br/>Billing UX polish<br/>~4d]
```

## Billing data model (ERD)

```mermaid
erDiagram
    User ||--o| Subscription : has
    User ||--o{ Payment : pays
    User ||--o{ Invoice : "is billed via"
    User ||--o{ UsageEvent : "consumes"
    Subscription ||--o{ Payment : "triggers"
    Payment ||--o| Invoice : "is recorded as"
    Invoice }o..|| InvoiceSequence : "uses for number"

    Subscription {
        Tier tier
        SubscriptionStatus status
        int tokenAllowance
        int tokensConsumed
        DateTime periodStartedAt
        DateTime currentPeriodEnd
    }
    Payment {
        PaymentStatus status
        int amountCents
        string currency
        string revolutOrderId
        string discountCode
    }
    Invoice {
        string number
        int netCents
        int vatCents
        int totalCents
        Decimal vatRate
        bool vatReverseCharge
        string efacturaStatus
    }
    UsageEvent {
        string kind
        int tokens
        int costCents
        string llmModel
    }
```

## Subscription state machine

```mermaid
stateDiagram-v2
    [*] --> TRIALING : sign-in
    TRIALING --> ACTIVE : first payment OK
    TRIALING --> EXPIRED : 30 days no payment
    ACTIVE --> PAST_DUE : autopay fails
    PAST_DUE --> ACTIVE : payment fixed
    PAST_DUE --> EXPIRED : 14 days unresolved
    ACTIVE --> CANCELLED : tenant cancels
    CANCELLED --> ACTIVE : reactivate within period
    CANCELLED --> EXPIRED : period ends
    EXPIRED --> ACTIVE : re-subscribe (new period)
```

## Money flow sequence

```mermaid
sequenceDiagram
    autonumber
    participant T as Tenant
    participant App as BookMe AI
    participant Rev as Revolut
    participant SPV as ANAF e-Factura
    participant Email as Resend

    T->>App: Click Subscribe / Tier
    App->>Rev: POST /api/orders (amount, currency, save_payment_method=true)
    Rev-->>App: checkout_url, order_id
    App-->>T: Redirect to checkout_url
    T->>Rev: Pay (3DS as needed)
    Rev-->>App: Webhook ORDER_COMPLETED + payment_method_id
    App->>App: Activate Subscription, store payment_method_id
    App->>App: Create Invoice (PDF)
    App->>SPV: Upload XML (async, no block)
    App->>Email: Send receipt
    Note over App: Cron daily
    App->>App: Find subs renewing today
    App->>Rev: POST /orders + capture w/ saved payment_method
    Rev-->>App: Webhook ORDER_COMPLETED OR ORDER_PAYMENT_FAILED
    alt Success
      App->>App: New Invoice
      App->>SPV: Upload XML
      App->>Email: Send receipt
    else Failure
      App->>App: Subscription.status = PAST_DUE
      App->>Email: Dunning email
      App->>T: WhatsApp dunning template
    end
```

## Customer booking sequence (WhatsApp → Calendar)

```mermaid
sequenceDiagram
    autonumber
    participant C as Customer
    participant Meta as Meta Cloud API
    participant App as BookMe AI webhook
    participant Agent as LangChain agent
    participant GCal as Google Calendar
    participant DB as Postgres

    C->>Meta: WhatsApp message
    Meta->>App: POST /api/webhooks/whatsapp (signed)
    App->>App: verify signature
    App->>DB: load Conversation history (last 10)
    App->>Agent: processWhatsAppMessage(msg, history)
    Agent->>Agent: tool: get_services / get_business_hours
    Agent->>GCal: get_availability(start, end)
    GCal-->>Agent: free / busy slots
    Agent->>Agent: tool: book_appointment(...)
    Note over Agent: book_appointment re-checks availability<br/>(double-sync race guard)
    Agent->>GCal: create event
    Agent->>DB: insert Appointment + UsageEvent
    Agent-->>App: reply text
    App->>Meta: send WhatsApp reply
    Meta-->>C: confirmation
```

## Post-GTM hardening order

```mermaid
flowchart LR
    A[1. Sentry / structured logging] --> B[2. Chat-simulator regression suite]
    B --> C[3. AI-agent prompt-eval harness]
    C --> D[4. Integration tests on billing webhooks]
    D --> E[5. E2E test on onboarding]
    E --> F[6. Customer entity refactor]
    F --> G[7. Multi-channel rebuild]
```
