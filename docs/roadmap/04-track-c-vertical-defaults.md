# Track C — Vertical defaults

> **Partial Phase-0 overlap:** the vertical taxonomy refactor + the 3 pilot verticals (barber, nails, auto repair) ship **inside Phase 0** (as fix P0-3 in [`00-phase-0-app-readiness.md`](./00-phase-0-app-readiness.md) §3) because dogfooding "as a barber" requires the barber vertical to exist. The remaining 5 priority verticals + per-vertical prompts + customer fields ship in Phase 1.

**Status:** Internal dev. Small, continuous. Partial in Phase 0, remainder in Phase 1.

**Goal:** A tenant in any of the 8 "Priority 1" verticals can pick their vertical at onboarding and immediately have a sensible service catalogue, business-hour defaults, AI behaviour, and reminder copy — *with no further configuration required to make their first booking work*.

---

## 1. Why vertical defaults matter commercially

The pitch to a barber should not be "configure your services, set your prices, set your durations, train the AI." The pitch should be "click 'I run a barber shop,' connect WhatsApp, done." Defaults are what turn the product from a CMS-shaped configuration tool into a one-click receptionist.

They also de-risk the AI:

- A barber pricing a "fade" at €20 / 30 min is plausible; the AI quoting €120 / 45 min (the dental cleaning default) at a barber is a launch-blocking embarrassment.
- A vet's "vaccination" service is 15 min, not 60 min like a "Root Canal." Default duration directly drives the AI's calendar lookups.

---

## 2. Today's state

`src/lib/defaults.ts`:

- Two arrays: `DENTIST_SERVICES`, `MECHANIC_SERVICES`.
- Profession picked via `Profession` enum in `prisma/schema.prisma` (`DENTIST` / `MECHANIC`).
- The AI prompt in `src/lib/ai-agent.ts` is profession-agnostic; it does not change behaviour based on the picked profession beyond seeing the seeded service list.

Limitations:

- Adding a 3rd vertical requires editing an enum, a switch statement, and shipping a migration.
- No business-hours defaults per vertical (barber shops are open Sat, dental clinics often closed Sat; vets are emergency-on-call).
- No per-vertical AI persona / tone / handling rules (a tattoo studio wants the AI to ask about preferred artist; a tire shop wants the AI to ask about tire size + season).

---

## 3. The 8 Priority 1 verticals

From the supplied [`259195d5-bookmeaiverticals.xlsx`](../../../):

| # | Vertical (EN / RO) | CAEN | NAICS |
|---|---|---|---|
| 1 | Barber shops / men's grooming (Frizerii) | 9602 | 812111 |
| 2 | Nail salons (Saloane manichiura) | 9602 | 812113 |
| 3 | Eyelash / PMU / microblading studios | 9602 / 9609 | 812199 |
| 4 | Dog grooming (Toaletaj canin) | 9609 | 812910 |
| 5 | Independent auto repair (Service auto) | 4520 | 811111 |
| 6 | Tire shops + ITP stations (Vulcanizare + ITP) | 4520 / 7120 | 811198 / 811191 |
| 7 | MedSpas / aesthetic clinics | 8622 / 9604 | 621399 / 812199 |
| 8 | Physiotherapy (Kinetoterapie) | 8690 | 621340 |

Of these, **3 are pilot ICPs** (barber, nails, auto repair — see Track A) and ship in Weeks 1–3. The remaining 5 ship Weeks 5–8.

---

## 4. The taxonomy refactor

### 4.1 From `Profession` enum to `Vertical` taxonomy

Replace the `Profession` enum with a `Vertical` model:

```
Vertical
  id              String  @id   -- e.g. "barber_shop"
  nameEn          String
  nameRo          String
  caenCode        String?
  naicsCode       String?
  isPriority1     Boolean
  isLaunchEnabled Boolean        -- can a tenant pick it during onboarding?
  defaults        Json            -- service list, hours, persona, prompts
```

Why a row, not an enum:
- New verticals can be added without migration.
- `isLaunchEnabled` lets us soft-launch one vertical at a time without code change.
- `defaults` as JSON lets us iterate the schema of defaults per-vertical without schema migrations.

Migration plan:
- New `Vertical` table seeded with all 55 from the xlsx (status `isLaunchEnabled = false` for the 47 non-Priority-1; `true` for the 8 Priority 1 as they ship).
- `User.profession: Profession` → `User.verticalId: String?` referencing `Vertical.id`.
- Backfill: existing `DENTIST` users → `verticalId = "dental_practice"`; existing `MECHANIC` users → `verticalId = "auto_repair"`.
- Keep the `Profession` enum for one release as a deprecated mirror so we can roll back. Drop it the following release.

This is the **only schema change** in Track C. Everything else is data + prompts.

### 4.2 Shape of `Vertical.defaults`

```ts
type VerticalDefaults = {
  services: Array<{
    name: string;
    description: string;
    priceUsd: number;     // suggested default; tenant edits
    durationMin: number;
    bufferMinAfter?: number;
  }>;
  hours: {
    [day in "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"]:
      | { start: string; end: string }
      | null;     // null = closed
  };
  persona: {
    toneHints: string;        // injected into the system prompt
    customerLanguage: "en" | "ro";   // primary
    requiredCustomerFields: Array<"phone" | "carModel" | "petBreed" | ...>;
    upsellHints?: string[];   // e.g. "offer cuticle care with manicure"
  };
  reminders: {
    confirmationCopy: string;
    reminderHoursBefore: number[];   // e.g. [24, 2]
    reminderCopy: string;
    cancellationPolicy: string;
  };
};
```

---

## 5. Per-vertical defaults v1

Below: a working draft of the v1 defaults. These are **starting points** for tenant tuning, not the One True Price List. Real pilots will move the numbers.

Currency: USD displayed (in line with current pricing). RO tenants see them in USD on the dashboard but can edit to RON-equivalent. Currency display localisation is a Track-B follow-up (§B8).

### 5.1 Barber shop

| Service | Price (USD) | Duration |
|---|---:|---:|
| Men's haircut | 20 | 30 |
| Beard trim | 12 | 20 |
| Cut + beard combo | 28 | 45 |
| Kids' haircut | 15 | 30 |
| Hot towel shave | 25 | 30 |
| Hair colour (men) | 35 | 45 |

Hours: Mon–Sat 09:00–19:00, Sun closed.
Persona: friendly, brief, uses Romanian by default. Asks for preferred barber if shop has multiple.
Reminders: 24h + 2h before. Cancellation: 2h notice.

### 5.2 Nail salon

| Service | Price (USD) | Duration |
|---|---:|---:|
| Classic manicure | 18 | 45 |
| Gel manicure | 28 | 60 |
| Gel removal + reapplication | 35 | 75 |
| Classic pedicure | 25 | 60 |
| Spa pedicure | 38 | 75 |
| Nail art (per nail) | 3 | 10 |
| Full set acrylic | 55 | 90 |

Hours: Tue–Sat 10:00–20:00, Sun–Mon closed.
Persona: warm, suggests pairing manicure + pedicure. Asks colour preference at booking when natural.
Reminders: 24h + 4h before. Cancellation: 4h notice.

### 5.3 Eyelash / PMU / microblading

| Service | Price (USD) | Duration |
|---|---:|---:|
| Classic lash set | 65 | 120 |
| Volume lash set | 85 | 150 |
| Lash fill (2 weeks) | 35 | 60 |
| Lash fill (3 weeks) | 45 | 75 |
| Microblading (initial) | 250 | 180 |
| Microblading touch-up (6w) | 80 | 90 |
| Lip blush PMU | 280 | 180 |

Hours: Tue–Sat 10:00–19:00.
Persona: explains aftercare proactively. Asks about prior PMU and allergies before booking.
Reminders: 48h + 24h + 4h. Cancellation: 24h notice (PMU is highly time-blocking).

### 5.4 Dog grooming

| Service | Price (USD) | Duration |
|---|---:|---:|
| Small dog bath + brush | 30 | 60 |
| Medium dog bath + brush | 40 | 75 |
| Large dog bath + brush | 55 | 90 |
| Full groom (small) | 45 | 90 |
| Full groom (medium) | 60 | 120 |
| Full groom (large) | 80 | 150 |
| Nail trim only | 15 | 20 |

Hours: Tue–Sat 09:00–18:00.
Persona: asks **breed + weight + temperament** before booking. Confirms vaccination requirement once at first booking.
Required customer fields: `petName`, `petBreed`, `petWeightKg`.
Reminders: 24h. Cancellation: 12h.

### 5.5 Independent auto repair

| Service | Price (USD) | Duration |
|---|---:|---:|
| Oil change | 45 | 45 |
| Brake inspection | 30 | 30 |
| Brake pad replacement (axle) | 180 | 90 |
| Diagnostic (OBD scan) | 60 | 45 |
| Pre-purchase inspection | 90 | 75 |
| AC service + recharge | 110 | 90 |

Hours: Mon–Fri 08:00–18:00, Sat 09:00–14:00.
Persona: asks **make + model + year + plate** at first booking. Treats vague problem descriptions ("makes a noise") by suggesting a diagnostic appointment, not by guessing a service.
Required customer fields: `vehicleMake`, `vehicleModel`, `vehicleYear`, `plate?`.
Reminders: 24h + 2h. Cancellation: 12h.

### 5.6 Tire shop + ITP

| Service | Price (USD) | Duration |
|---|---:|---:|
| Seasonal tire swap (4) | 35 | 45 |
| Tire + rim swap (4) | 60 | 60 |
| Tire balancing (4) | 25 | 30 |
| Puncture repair | 18 | 30 |
| ITP inspection (car) | 65 | 45 |
| ITP inspection (light truck) | 90 | 60 |

Hours: Mon–Fri 08:00–18:00, Sat 09:00–14:00.
Persona: knows the seasonal swap rush is March–April and October–November and proactively offers to hold a slot. Asks **tire size** (e.g. 205/55 R16) before booking a swap.
Required customer fields: `vehicleMake`, `vehicleModel`, `tireSize?`.
Reminders: 24h. Cancellation: 6h.

### 5.7 MedSpa / aesthetic clinic

| Service | Price (USD) | Duration |
|---|---:|---:|
| Consultation | 50 | 30 |
| Botox (per area) | 250 | 30 |
| Filler (1 ml) | 380 | 45 |
| HydraFacial | 180 | 60 |
| Laser hair removal (small area) | 80 | 30 |
| Chemical peel | 150 | 60 |

Hours: Tue–Sat 10:00–19:00.
Persona: **medical-grade caution.** Refuses to book medical procedures without an initial consultation. Mentions pregnancy / breastfeeding screening if relevant. Never gives medical advice; defers to the practitioner.
Reminders: 48h + 24h + 4h. Cancellation: 24h.

### 5.8 Physiotherapy

| Service | Price (USD) | Duration |
|---|---:|---:|
| Initial assessment | 70 | 60 |
| Follow-up session | 50 | 45 |
| Manual therapy | 60 | 45 |
| Dry needling | 65 | 45 |
| Sports rehab session | 65 | 60 |
| Post-op rehab session | 70 | 60 |

Hours: Mon–Fri 09:00–20:00, Sat 09:00–14:00.
Persona: gently requires a referral or "what is the issue" description before booking. Recognises that a first-time client needs an Initial Assessment, not a follow-up.
Required customer fields: `referralFrom?`, `condition?`.
Reminders: 24h + 2h. Cancellation: 12h.

---

## 6. Per-vertical AI prompting

`src/lib/ai-agent.ts` currently builds a generic system prompt. We add a per-vertical prompt fragment composed from `Vertical.defaults.persona`:

```
You are a receptionist for {businessName}, a {vertical.nameEn}.
Tone: {persona.toneHints}.
You must ask for the following information before confirming a booking:
{persona.requiredCustomerFields}.
Cancellation policy: {reminders.cancellationPolicy}.
```

These additions are **purely additive** to the existing system prompt. We keep the tools the same (`get_services`, `get_availability`, `book_appointment`, `cancel_appointment`, `get_business_hours`).

For verticals where the AI must capture extra structured data (vehicle for auto repair, pet info for grooming, tire size for tire shop), we add a `Customer` table:

```
Customer
  id, userId, phone, name
  metadata Json    -- per-vertical fields
  createdAt, updatedAt
  @@unique([userId, phone])
```

This replaces the current `(userId, customerPhone)` implicit identity with a real entity. The agent can then read/write structured customer attributes across conversations (e.g. "you brought your Dacia Logan last time" on the second booking).

---

## 7. Engineering deliverables

| ID | Deliverable | Effort | Dependency | Weeks |
|---|---|---|---|---|
| C1 | `Vertical` model + migration; seed all 55; backfill existing users | M | — | 1 |
| C2 | Onboarding picker UI: search/filter by vertical; show Priority 1 first | S | C1 | 2 |
| C3 | Seed defaults for the 3 pilot verticals (barber, nails, auto repair) | M | C1 | 2 |
| C4 | `Customer` model + per-vertical required-fields wiring | M | C1 | 3 |
| C5 | Per-vertical system prompt composition in `ai-agent.ts` | S | C3 | 3 |
| C6 | Seed defaults for the remaining 5 priority verticals | M | C1 | 5–6 |
| C7 | Per-vertical reminder templates (when outbound email lands in Track B) | S | C3 + B email | 6–7 |
| C8 | Vertical-specific tools (e.g. `lookup_customer_vehicle`, `check_breed_policy`) | M–L | C4 | 7–8 |

`S` = ≤1 day; `M` = 2–4 days; `L` = 1+ week.

---

## 8. Exit criteria for Track C

1. All 8 Priority 1 verticals are pickable at onboarding and seed correct defaults.
2. The AI agent injects the per-vertical persona into its system prompt and respects required fields per vertical.
3. At least 1 pilot per pilot vertical (barber, nails, auto repair) used the defaults without editing them, and that was acceptable to them ("good enough to start").
4. The 47 non-Priority-1 verticals exist in the `Vertical` table with `isLaunchEnabled = false` so the data is ready when we expand without further migration.

We deliberately **do not** ship defaults for the 47 non-Priority-1 verticals in the next 12 weeks. They will be added one-by-one when a sales conversation opens in that vertical.
