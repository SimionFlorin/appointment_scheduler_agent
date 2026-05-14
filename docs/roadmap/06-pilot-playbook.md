# 06 — Pilot playbook

This is the operating manual for running the 5 free pilots referenced in [`02-track-a-whatsapp-signup-pilots.md`](./02-track-a-whatsapp-signup-pilots.md). It exists as a separate file because it is the doc the founder will open most often during Weeks 0–8.

---

## 1. The pilot offer — one paragraph

> *"Hey, we are building an AI receptionist that takes appointments via WhatsApp 24/7 — checks your calendar, books people in, sends them a confirmation. We are looking for 5 businesses in {your vertical} to use it free for 60 days while we polish it. You give us 15 minutes a week and honest feedback; we give you a working AI receptionist and, if it works for you, a 20% lifetime discount once you decide to pay. No card, no commitment, you can stop any time."*

This sentence is the script for every outreach DM, every warm intro email, every Zoom intro. Resist the urge to make it longer.

---

## 2. Pilot agreement (1 page)

A real document, signed (e-signature is fine; an email reply with "I agree" is *also* fine for v1). Contents:

| Section | One-sentence summary |
|---|---|
| Parties | BookMe AI ({legal entity}) and {Pilot business name} |
| Term | 60 calendar days from account activation |
| What we give | Full platform access at zero cost; founder support via WhatsApp ≤24h response; 20% lifetime discount on conversion |
| What you give | ~15 min/week feedback; consent to one screen-recorded onboarding session; right for us to quote you and use your logo on our site **if** you convert to paid |
| Data | Your business data (services, appointments, customer messages) belongs to you; we may use anonymised aggregates for product improvement; we will not share it with third parties |
| Termination | Either party at any time; on termination we export your data to CSV within 7 days |
| Privacy | Our [privacy policy](../../privacy-policy) applies; the AI receptionist is processing customer messages — pilot agrees to add a one-liner in their WhatsApp business profile disclosing this |
| Liability | Software is provided as-is during the pilot; we are not liable for missed bookings if the AI errs (we **will** fix the AI; we will not write a refund cheque) |

Keep it one page. A 4-page agreement scares small-business owners more than no agreement does.

---

## 3. Mid-pilot survey (Week 2 of live use)

5 questions, asked via WhatsApp to maximise response rate:

1. On a 1–10 scale, how useful has BookMe AI been so far?
2. Has it correctly booked appointments without you intervening? (Yes / Mostly / Sometimes / Rarely)
3. What is the **single biggest annoyance** since you started?
4. What would have to be true for you to pay $25/month at the end of the trial?
5. If a friend in {vertical} asked, would you recommend it today?

Aggregated, this is what tells us whether Track B billing is overkill or whether we need to keep pilots free for longer.

---

## 4. End-of-pilot conversion call (~Week 7)

15 minutes. Founder. Script:

> 1. "How has the last 8 weeks been? Honest answer."
> 2. "If we charged you $25/month starting today, would you say yes?"
> 3. **If yes:** "Would you also say yes at $35/month?" (probe ceiling)
> 4. **If no:** "What would make it a yes? (more features / lower price / longer trial / something else)"
> 5. **If extending:** "What is the one specific thing you need to see in the next 30 days to decide?"
> 6. "Can we quote you on the website with this sentence? *{paraphrase what they just said}*"

The output of every call goes into the pricing v2 decision doc (see Track D §D1).

---

## 5. What we do on signup day (the observed call)

A 30-min Zoom. The pilot shares their screen. We do not.

**Rules for the founder on this call:**

- Do not narrate. Do not "let me explain why we did it that way." Watch.
- If they pause >5 seconds, do not jump in. Wait until they ask.
- If they go off-script (e.g. open a different tab, lose patience), let them. Note where. That is the data.
- Only intervene if they cannot proceed — and when you do, say "let me unblock you, then we will keep watching." Do not switch into pitch mode.
- Take written notes during the call. Audio recording (with consent) is a backup.

At the end of the call:

- 5 minutes: ask them to summarise what they just did in their own words. If they cannot, we have an onboarding-comprehension bug, not just a UX bug.
- Tell them what we will fix in the next 48h based on what we saw.
- Schedule the weekly check-in.

---

## 6. Weekly check-in cadence (Weeks 1–8 of live use)

15 minutes, WhatsApp voice note or quick call (their preference). Questions:

- What worked this week?
- What broke?
- Anything customers said about the AI?

These get logged in the pilot spreadsheet ([`02-track-a-whatsapp-signup-pilots.md`](./02-track-a-whatsapp-signup-pilots.md) §5).

---

## 7. Pilot account setup checklist (founder-operated)

Per pilot, one-time:

1. [ ] Create user (Google sign-in on their behalf is fine if they delegate; otherwise they sign up themselves).
2. [ ] In DB: set `User.isPilot = true`, `Subscription.trialEndsAt = now + 60d`.
3. [ ] Tag their account with `pilotCohort = "2026Q2-priority1"` (or similar).
4. [ ] Add them to the pilot spreadsheet.
5. [ ] Send them the pilot agreement.
6. [ ] Schedule the observed-signup Zoom.
7. [ ] Schedule the Week 7 conversion call (60 days out from agreement signing).

Anything in this list that takes more than 5 minutes per pilot needs automating. Until we have 5 pilots, manual is fine.

---

## 8. Failure modes and what we do about them

| Failure | Likelihood | Response |
|---|---|---|
| Pilot recruits faster than embedded signup is approved by Meta | Medium | Use Twilio path for pilots 1–2 while Meta App Review pends. Track A §4.1 still kicks off on Day 1 regardless. |
| Pilot cannot complete embedded signup at all (P0 bug) | High for pilot 1 | Halt new pilots until fixed. Eng on Track A drops everything to debug. |
| AI quality is unacceptable for a vertical | Medium | Fix the per-vertical system prompt (Track C §6). If unfixable, drop the vertical from launch and reallocate. |
| Pilot disengages (no replies for 2+ weeks) | Medium | One "are you still in?" message. If no reply, mark as churned-disengaged. Do not chase. |
| Pilot says "yes I'd pay" but later does not pay | High | Treat conversion as committed only when Track B billing produces a successful first charge. "Verbally yes" is not yes. |
| Pilot finds a competitor while we are running the pilot | Low–medium | Listen carefully; ask which competitor and why. Update our pricing/positioning. Do not match price reflexively. |
| Pilot is in a vertical we cannot legally invoice yet (e.g. EU tenant before Track B B2 ships) | Certain in Weeks 1–4 | Acceptable for the **trial** period. Conversion to paid must wait for Track B readiness; pilot is informed. |

---

## 9. What success looks like

Concretely, at Week 12:

- 5 pilots ran to completion.
- ≥3 converted to paid.
- We have ≥3 quotable reference sentences on the website.
- The pilot spreadsheet has ≥40 rows of usage data we can use to set token allowance and pricing.
- The founder is no longer the bottleneck on signup — pilot 5 completed it without an observed call.

If we hit those, Track D launches with proof; if we miss them, we have an honest map of where the product is not ready and we extend Phase 1.
