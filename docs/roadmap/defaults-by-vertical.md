# Appendix A — Default services per vertical

> **Source of priority:** the spreadsheet *BookMe AI Verticals* (uploaded 2026-05-14). The eight **Priority 1** rows are the ones we ship defaults for now. Standard-tier verticals are listed at the bottom for future expansion but explicitly out of scope for pre-pilot.
>
> **Why defaults matter:** the longest single drop-off in onboarding is the moment we ask the owner to type their service menu. A pre-filled list — even if half-wrong — turns "I'll come back to this later" into "let me just rename three things."

---

## How to read the tables

- **Service name** — what appears in the dashboard and in the AI's reply to a customer.
- **Duration** — minutes blocked on Google Calendar. AI uses this for `get_availability`.
- **Price (RON)** / **Price (USD)** — placeholder market-rate values for a mid-size RO city / mid-size US city. The owner edits these in the dashboard. We do **not** localise prices per signup geo automatically.
- **AI hint** — single-sentence addendum to the system prompt when this vertical is selected. Injected via `src/lib/defaults.ts`.

For each vertical, **5 services minimum, 6 maximum**. More services = more decision fatigue in onboarding.

---

## Service defaults

### 1. Barber shops & men's grooming  (`BARBER`)

> **AI hint:** "You schedule appointments for a barbershop. Default is a men's haircut, ~30 min. Ask about beard trim as an add-on. Most customers book one slot back-to-back with their usual barber, so confirm the requested time as-is rather than offering alternatives unless busy."

| Service | Duration (min) | RON | USD |
|---|---|---|---|
| Tuns clasic / Classic haircut | 30 | 60 | 25 |
| Tuns + barba / Haircut + beard trim | 45 | 90 | 35 |
| Doar barba / Beard trim | 20 | 40 | 15 |
| Tuns copil / Kid's haircut | 25 | 45 | 18 |
| Spalat + styling / Wash + style | 20 | 30 | 12 |
| Pachet complet / Full package | 60 | 130 | 50 |

### 2. Nail salons / nail techs  (`NAILS`)

> **AI hint:** "You schedule appointments for a nail salon. Most appointments are 60–120 min and tied to a specific technician. If the customer mentions a name (e.g. 'with Andra'), confirm only her availability. If not, treat any technician's calendar as fine."

| Service | Duration (min) | RON | USD |
|---|---|---|---|
| Manichiura semipermanenta / Gel mani | 60 | 90 | 40 |
| Manichiura clasica / Classic mani | 45 | 50 | 25 |
| Pedichiura semipermanenta / Gel pedi | 75 | 120 | 50 |
| Constructie unghii (gel/acril) / Sculpted nails | 120 | 200 | 80 |
| Aplicatie tipsuri / Tip extensions | 90 | 160 | 65 |
| Indepartare semipermanent / Gel removal | 30 | 30 | 15 |

### 3. Eyelash extensions / PMU / microblading  (`LASH_PMU`)

> **AI hint:** "You schedule lash, brow, or PMU appointments. PMU procedures (microblading, lip blush) require a 48h patch-test consultation appointment **before** the main session — when the customer asks for one, also offer the consult slot. Lash refills are typically every 2–3 weeks."

| Service | Duration (min) | RON | USD |
|---|---|---|---|
| Extensii gene full set / Lash full set | 120 | 250 | 120 |
| Refill gene / Lash refill | 75 | 130 | 60 |
| Microblading sprancene / Microblading | 150 | 700 | 350 |
| Retus microblading / Microblading touch-up | 90 | 250 | 120 |
| Lip blush PMU | 150 | 800 | 400 |
| Consultatie patch-test / Patch-test consult | 20 | 0 | 0 |

### 4. Dog grooming / Toaletaj canin  (`DOG_GROOMING`)

> **AI hint:** "You schedule dog grooming appointments. Always ask for the breed and approximate weight — duration and price depend on both. If the customer doesn't know, assume medium dog (≈10–25 kg). Most appointments are 60–120 min. Some dogs are aggressive — note any owner warning in the appointment notes."

| Service | Duration (min) | RON | USD |
|---|---|---|---|
| Toaletaj complet caine mic / Full groom small dog | 60 | 130 | 60 |
| Toaletaj complet caine mediu / Full groom medium dog | 90 | 180 | 80 |
| Toaletaj complet caine mare / Full groom large dog | 120 | 250 | 110 |
| Spa + spalat / Bath only | 45 | 90 | 40 |
| Tuns unghii / Nail trim | 15 | 30 | 15 |
| Smulgere par (rase specifice) / Hand-stripping | 90 | 200 | 90 |

### 5. Auto repair (independent)  (`AUTO_REPAIR`)

> **AI hint:** "You schedule auto repair appointments. Always ask for car make + model + year + the symptom. Diagnostic appointments are short (60 min); actual repairs are open-ended and the AI should book a **diagnostic** slot only, with a note that further work is quoted after inspection. If the symptom is brakes or steering, prioritise within 48h."

| Service | Duration (min) | RON | USD |
|---|---|---|---|
| Diagnoza / Diagnostic | 60 | 150 | 80 |
| Schimb ulei + filtru / Oil change | 45 | 180 | 65 |
| Schimb placute frana / Brake pads (per axle) | 90 | 350 | 180 |
| Revizie completa / Full service | 180 | 700 | 280 |
| Geometrie roti / Wheel alignment | 60 | 200 | 90 |
| Schimb pneuri (set 4) / Tire change (set of 4) | 75 | 120 | 50 |

### 6. Tire shops + ITP stations  (`TIRE_ITP`)

> **AI hint:** "You schedule tire and ITP (Romanian periodic inspection) slots. ITP is a fixed 30-min appointment with a hard-required current vehicle insurance ('RCA') — if the customer asks for ITP, mention they need to bring proof of valid RCA. Tire-change appointments are 45–60 min; seasonal peaks (Mar–Apr and Oct–Nov) book out 1–2 weeks ahead."

| Service | Duration (min) | RON | USD |
|---|---|---|---|
| ITP autoturism / ITP (passenger car) | 30 | 120 | — |
| ITP camioneta / ITP (van) | 45 | 250 | — |
| Schimb pneuri sezonal / Seasonal tire change | 45 | 80 | 40 |
| Vulcanizare (reparatie pana) / Tire repair (puncture) | 30 | 40 | 25 |
| Echilibrare roti / Wheel balancing | 30 | 60 | 30 |
| Depozitare pneuri sezonier / Seasonal tire storage | 15 | 100 | — |

### 7. MedSpa / cosmetic dermatology  (`MEDSPA`)

> **AI hint:** "You schedule MedSpa appointments. Many treatments (botox, fillers, laser hair removal) require a brief consultation before the first session — offer the consult slot when a new customer asks for a procedure. Procedures are duration-sensitive; never overlap two laser slots."

| Service | Duration (min) | RON | USD |
|---|---|---|---|
| Consultatie estetica / Aesthetic consult | 30 | 100 | 75 |
| Botox (zone) / Botox per area | 30 | 600 | 300 |
| Fillere buze / Lip filler | 60 | 1500 | 600 |
| Hidrafacial / Hydrafacial | 60 | 400 | 200 |
| Epilare laser zone mica / Laser hair (small area) | 30 | 200 | 100 |
| Peeling chimic / Chemical peel | 45 | 350 | 175 |

### 8. Physiotherapy / Kinetoterapie  (`PHYSIO`)

> **AI hint:** "You schedule physiotherapy / kinetoterapie appointments. Sessions are 60 minutes. New customers need an initial evaluation appointment (75 min); follow-ups are 45–60 min. Recurring weekly bookings are common — if a customer mentions a 'series of sessions', offer to confirm the first one and ask whether they want the same time slot booked weekly."

| Service | Duration (min) | RON | USD |
|---|---|---|---|
| Evaluare initiala / Initial assessment | 75 | 200 | 100 |
| Sedinta kinetoterapie / Physio session | 60 | 150 | 75 |
| Terapie manuala / Manual therapy | 45 | 180 | 90 |
| Recuperare post-operatorie / Post-op rehab | 60 | 180 | 90 |
| Masaj terapeutic / Therapeutic massage | 60 | 130 | 60 |
| Telemedicina (video) / Telehealth | 30 | 80 | 50 |

---

## Common defaults across all verticals

These ship with **every** vertical and don't need vertical-specific overrides:

| Setting | Default |
|---|---|
| Business hours | Mon–Fri 09:00–18:00, Sat 10:00–14:00, Sun closed |
| Lunch break (optional) | Tue 13:00–14:00 disabled by default; suggested for medical / physio / MedSpa during onboarding |
| Timezone | From browser at signup (Intl.DateTimeFormat().resolvedOptions().timeZone) |
| Currency | RON if country = RO, USD otherwise (override in BusinessProfile) |
| Booking-confirmation message | "Confirmat! Te asteptam pe {date} la {time} pentru {service}." / English equivalent |
| Cancellation message | "Confirmat anulat. Te asteptam data viitoare!" / English equivalent |
| Reminder lead times (Stage 4+) | 24h (WhatsApp template), 2h (email) |
| Same-day booking minimum lead | 60 min |

---

## Standard-tier verticals (post-GTM)

For reference only — these are in the spreadsheet but **not** in the pre-pilot scope:

`HAIR_SALON`, `TATTOO`, `MASSAGE`, `PERSONAL_TRAINER`, `VET`, `DENTAL`, `SPEECH_THERAPY`, `PSYCHOLOGY`, `DRIVING_SCHOOL`, `SPA_WELLNESS`, `TANNING`, `YOGA_PILATES`, `CROSSFIT`, `MARTIAL_ARTS`, `DANCE`, `TENNIS`, `MUSIC_TEACHER`, `EQUESTRIAN`, `PHOTOGRAPHER`, `VIDEOGRAPHER`, `WEDDING_PLANNER`, `EVENT_VENUE`, `TUTOR`, `PLUMBER`, `ELECTRICIAN`, `HVAC`, `LOCKSMITH`, `APPLIANCE_REPAIR`, `GARAGE_DOOR`, `PEST_CONTROL`, `CLEANING`, `WINDOW_CLEANING`, `LANDSCAPING`, `TREE_SERVICE`, `POOL`, `PAINTER`, `HANDYMAN`, `SOLAR_CONSULT`, `AUTO_DETAILING`, `MOTORCYCLE_REPAIR`, `OPTOMETRY`, `AUDIOLOGY`, `NUTRITIONIST`, `CAREER_COACH`, `REAL_ESTATE`, `BNB`, `RESTAURANT`.

Add them to the enum + defaults file **only when a paying customer in that vertical signs up**, not preemptively.

---

## Implementation pointer

Add the eight verticals to `src/lib/defaults.ts` following this pattern:

```ts
type DefaultService = { name: string; description: string; price: number; duration: number };
type DefaultsBundle = {
  services: DefaultService[];
  systemPromptHint: string;
};

const BARBER: DefaultsBundle = {
  services: [/* … from table above … */],
  systemPromptHint: "You schedule appointments for a barbershop. …",
};

// …repeat for the other seven…

export function getDefaults(profession: Profession): DefaultsBundle {
  switch (profession) {
    case "BARBER":         return BARBER;
    case "NAILS":          return NAILS;
    case "LASH_PMU":       return LASH_PMU;
    case "DOG_GROOMING":   return DOG_GROOMING;
    case "AUTO_REPAIR":    return AUTO_REPAIR;
    case "TIRE_ITP":       return TIRE_ITP;
    case "MEDSPA":         return MEDSPA;
    case "PHYSIO":         return PHYSIO;
    case "DENTIST":        return DENTIST;       // demo
    case "MECHANIC":       return MECHANIC;      // demo
    default:               return { services: [], systemPromptHint: "" };
  }
}
```

Wire `systemPromptHint` into `src/lib/ai-agent.ts` where the system prompt is built — append it after the existing role description.
