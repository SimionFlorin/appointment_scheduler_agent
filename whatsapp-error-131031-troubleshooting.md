# WhatsApp Business API — Error 131031 "Business Account Locked"

> **TL;DR:** If your WhatsApp test number suddenly returns `131031 Business Account locked` and you can't even receive messages on it from a normal WhatsApp account (only one gray check), the test number is **out of registered state on WhatsApp's network**. Re-register it via the `/register` endpoint and it will work again.

---

## Symptoms

When this issue hits, you see **all** of the following:

1. API call to send a message returns successfully with a `wamid` (you get a 200 response).
2. Webhook fires shortly after with a `STATUS UPDATE` payload showing:
   ```
   status: 'failed'
   errors: [{
     code: 131031,
     title: 'Business Account locked',
     message: 'Business Account locked',
     error_data: { details: 'Business account has been locked.' }
   }]
   ```
3. The recipient never receives the message.
4. **Critical tell:** When you send a message *from a regular WhatsApp account TO the test number*, the message stays at **one gray check** (sent, but not delivered to WhatsApp's servers).
5. Business Manager dashboard shows the WABA as **Verified** and **Approved** with no warnings.

If symptom #4 is present, this is almost certainly a number-registration issue, not an account/policy/billing issue.

---

## What this error does NOT mean (in this case)

I went down a lot of wrong paths debugging this. Here's what 131031 is **not** when you see the symptoms above:

- ❌ Not a policy violation (no violations show in Account Quality)
- ❌ Not missing business verification (already verified)
- ❌ Not the "Tax info missing" warning on a sibling WABA
- ❌ Not the "Payment configurations: India" entry in WhatsApp Manager (that's for in-chat customer payments, unrelated)
- ❌ Not a Tech Provider access verification still in review
- ❌ Not a recipient phone number that wasn't verified
- ❌ Not the WABA timezone being set to America/Los_Angeles
- ❌ Not the public email / passkey warnings in Security Center

All of those CAN cause 131031 in other situations, but if your symptoms match the list above (especially the one-gray-check tell), the cause is the number-registration state.

---

## Root cause

WhatsApp test numbers (and real numbers) have **two separate states**:

1. **Dashboard state** — visible in Business Manager / WhatsApp Manager. This is what you see in the UI.
2. **Network state** — the actual registration on WhatsApp's messaging infrastructure. Invisible from the UI.

These can drift apart. The dashboard can say "everything is fine" while the network registration has expired, been invalidated, or never fully completed. When that happens:

- Outbound API messages fail with `131031`.
- Inbound messages from regular WhatsApp accounts can't reach the number (one gray check).
- Nothing in the UI tells you this is what's wrong.

The fix is to **re-register the number** on WhatsApp's network via the API.

---

## The fix

Call the `/register` endpoint with the phone number ID and a 6-digit PIN you choose:

```bash
curl -X POST "https://graph.facebook.com/v25.0/PHONE_NUMBER_ID/register" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "pin": "123456"
  }'
```

Replace:
- `PHONE_NUMBER_ID` — the ID shown under your test number in API Setup (e.g. `976745758863501`)
- `YOUR_ACCESS_TOKEN` — your access token from the API Setup page
- `"123456"` — pick any 6-digit PIN. **Save it somewhere safe.** You'll need it if two-step verification is ever enabled.

A successful response looks like:

```json
{ "success": true }
```

After this, retry your original message send. The 131031 error should be gone within seconds.

---

## Verifying the fix worked

Quickest check: have someone send a normal WhatsApp message TO your test number. If you now see **two gray checks** (delivered) instead of one, the network state is healthy again. Your API sends will work.

You can also call the original send endpoint:

```bash
curl -i -X POST \
  "https://graph.facebook.com/v25.0/PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "RECIPIENT_NUMBER",
    "type": "template",
    "template": { "name": "hello_world", "language": { "code": "en_US" } }
  }'
```

The webhook STATUS UPDATE should now show `status: 'sent'` → `status: 'delivered'` → `status: 'read'` instead of `status: 'failed'`.

---

## When this can happen

Test numbers can drift out of registered state for several reasons:

- Long inactivity (number sits unused for weeks)
- 2FA / PIN changes on the WABA
- Token regeneration or expiry events
- Backend reshuffling on Meta's side (no visible cause)
- Sometimes immediately after a fresh test number is provisioned, before it fully activates

For real (non-test) production numbers the same fix applies, but you should also check WhatsApp Manager → Phone Numbers for any displayed warnings before re-registering.

---

## If re-registration doesn't fix it

If `/register` returns success but you still get 131031, the cause is something else. Work through these in order:

1. **Recipient not actually verified.** In API Setup, check the "To" dropdown. The recipient must show as Verified (green check), not just listed. If pending, resend the code and have the recipient enter it.

2. **Sibling WABA with billing/tax issues.** Even if it's not the WABA you're sending from, unresolved tax info on another WABA in the same business portfolio can hold messaging across the portfolio. Go to Business Settings → WhatsApp Accounts → check each WABA for red banners. Add VAT/tax info where missing.

3. **Try the other test number.** If you have multiple test WABAs, send from a different one. If that works, the original WABA has a specific issue.

4. **Delete and recreate the test number.** In WhatsApp Manager → Phone Numbers → remove the number. Then go back to the app dashboard and provision a new test number. Fresh numbers usually have no issues.

5. **Contact Meta support directly.** If none of the above works, the cause is on Meta's backend and only they can see it. Submit a ticket via `business.facebook.com` → Help → Get Started. Include:
   - Your phone number ID
   - Your WABA ID
   - The exact error code (131031)
   - The "one gray check" symptom
   - That re-registration was attempted and didn't resolve it

---

## Mental model: the layers that all have to be healthy

When you're working with WhatsApp Business API, there are **multiple separate layers** that all have to be in good standing for messages to send. Knowing which layer is broken saves hours of debugging:

| Layer | Where to check | Symptoms when broken |
|---|---|---|
| Meta Developer Account | developers.facebook.com | Can't access dashboards at all |
| Developer App | App dashboard | App stuck "Unpublished" (fine for dev mode) |
| Business Portfolio | business.facebook.com → Settings | Can't link assets, can't run ads |
| WhatsApp Business Account (WABA) | Settings → WhatsApp Accounts | Red banners (tax info, restrictions) |
| Phone Number (dashboard state) | WhatsApp Manager → Phone Numbers | Warning icons next to the number |
| Phone Number (network state) | **Invisible — only API behavior tells you** | 131031, one gray check on inbound |
| Recipient verification | API Setup → "To" dropdown | Sends accepted but never delivered |

The "phone number network state" row is the one that bit me here. It's the only layer with no UI indicator, and it's the layer that the `/register` endpoint fixes.

---

## References

- Meta error code reference: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
- WhatsApp Cloud API register endpoint docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/registration
- Meta's official guidance for 131031: disable 2FA → re-register the number → enable 2FA again

---

## Personal note

If you're reading this because it's happening again: don't waste time digging through Account Quality, Security Center, tax info, payment configurations, or Tech Provider verification first. Check the **one gray check** symptom on inbound messages. If that's present, run the `/register` call. It takes 30 seconds and fixes the problem.
