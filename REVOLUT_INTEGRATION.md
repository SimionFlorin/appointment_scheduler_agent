# Revolut Payment Integration

## Overview

BookMe AI now includes subscription billing powered by Revolut's Hosted Checkout Page. Business users (dentists, mechanics) get a **30-day free trial** (no card required), after which they must subscribe at **$20 USD / 100 RON per month** to continue using the platform.

---

## Changes Made

### Database (Prisma Schema)

- **New enums:** `SubscriptionStatus` (TRIALING, ACTIVE, PAST_DUE, CANCELLED, EXPIRED) and `PaymentStatus` (PENDING, COMPLETED, FAILED, REFUNDED)
- **New model `Subscription`:** Tracks each user's subscription state, trial end date, current billing period, and linked Revolut order ID
- **New model `Payment`:** Records every checkout attempt — Revolut order ID, amount, currency, status, and checkout URL
- **Updated `User` model:** Added relations to `Subscription` (1:1) and `Payment` (1:many)

### Backend — Libraries

| File | Purpose |
|------|---------|
| `src/lib/revolut.ts` | Revolut Merchant API client — creates orders, retrieves order status, verifies webhook signatures (HMAC-SHA256) |
| `src/lib/subscription.ts` | Subscription business logic — creates trial on sign-up, checks subscription status, activates paid subscriptions |

### Backend — API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/billing` | GET | Returns current subscription status for the authenticated user |
| `/api/billing/checkout` | POST | Creates a Revolut order and returns the hosted checkout URL. Accepts `{ currency: "USD" | "RON" }` |
| `/api/billing/status` | GET | Polls Revolut for latest payment status and updates subscription accordingly (fallback if webhook is delayed) |
| `/api/webhooks/revolut` | POST | Receives Revolut webhook events (`ORDER_COMPLETED`, `ORDER_PAYMENT_FAILED`), verifies signature, and activates/fails subscriptions |

### Backend — Auth Changes

- `src/lib/auth.ts`: On sign-in, automatically creates a `Subscription` record in `TRIALING` status with a 30-day trial period if one doesn't exist
- `src/proxy.ts`: Added `/billing` to auth-required paths; `/api/webhooks/revolut` is already excluded from auth (covered by the existing `/api/webhooks` exclusion)

### Frontend — New Pages & Components

| File | Description |
|------|-------------|
| `src/app/(dashboard)/billing/page.tsx` | Full billing page — shows subscription status, plan details, currency selector (USD/RON), checkout button, and post-payment polling |
| `src/components/dashboard/subscription-banner.tsx` | Dismissible banner in the dashboard header — warns when trial is ending (≤7 days) or subscription has expired |
| `src/components/dashboard/subscription-gate.tsx` | Client-side gate that blocks access to dashboard features when subscription is expired, while allowing access to `/billing`, `/settings`, and `/onboarding` |

### Frontend — Updated Files

| File | Change |
|------|--------|
| `src/components/dashboard/shell.tsx` | Added "Billing" nav item with `CreditCard` icon; integrated `SubscriptionBanner` below the header |
| `src/app/(dashboard)/layout.tsx` | Wrapped children in `SubscriptionGate` to enforce subscription on dashboard pages |

### Environment Variables

Added to `.env` and `.env.example`:

```
REVOLUT_API_URL=https://sandbox-merchant.revolut.com
REVOLUT_API_SECRET_KEY=your-revolut-sandbox-secret-key
REVOLUT_API_PUBLIC_KEY=your-revolut-sandbox-public-key
REVOLUT_WEBHOOK_SECRET=your-revolut-webhook-signing-secret
```

---

## Revolut Merchant Account Setup Tasks

### 1. Create Sandbox Account (for testing)

- [ ] Go to [https://sandbox-business.revolut.com/signup](https://sandbox-business.revolut.com/signup) and create a sandbox account
- [ ] Verify your sandbox account via email

### 2. Generate Sandbox API Keys

- [ ] In the sandbox dashboard, go to **Settings → Merchant API**
- [ ] Generate a **Secret API key** (starts with `sk_`)
- [ ] Generate or note the **Public API key** (starts with `pk_`)
- [ ] Copy both keys into your `.env` file as `REVOLUT_API_SECRET_KEY` and `REVOLUT_API_PUBLIC_KEY`

### 3. Set Up Webhooks (Sandbox)

- [ ] In the sandbox dashboard, go to **Settings → Merchant API → Webhooks**
- [ ] Create a new webhook with URL: `https://your-domain.com/api/webhooks/revolut`
  - For local testing, use a tunnel service like ngrok: `https://your-ngrok-id.ngrok.io/api/webhooks/revolut`
- [ ] Subscribe to events: `ORDER_COMPLETED`, `ORDER_PAYMENT_FAILED`
- [ ] Copy the **Webhook Signing Secret** into your `.env` as `REVOLUT_WEBHOOK_SECRET`

### 4. Test with Sandbox Cards

Use these Revolut test cards in sandbox mode:

| Card Number | Scenario |
|-------------|----------|
| `4929 4212 3460 0821` | Successful payment |
| `2720 9920 0000 0007` | Successful payment (Mastercard) |
| `4532 0150 0000 0003` | Declined payment |

- CVV: any 3 digits
- Expiry: any future date
- 3DS password (if prompted): `Revolut`

### 5. Customize Checkout Page (Optional)

- [ ] In the sandbox dashboard, go to **Settings → Merchant API → Checkout page**
- [ ] Upload your business logo
- [ ] Set button colors to match BookMe AI branding
- [ ] Add your website URL

### 6. Production Migration

When ready to go live:

- [ ] Create a production Revolut Business account at [https://business.revolut.com](https://business.revolut.com)
- [ ] Complete business verification (KYC)
- [ ] Generate production API keys
- [ ] Set up production webhooks pointing to your live domain
- [ ] Change `REVOLUT_API_URL` to `https://merchant.revolut.com`
- [ ] Replace all API keys with production keys
- [ ] Test a real payment with a small amount
- [ ] **Important:** Remove any test/sandbox references from your environment

### 7. Recurring Billing (Future Enhancement)

The current implementation is a **one-time payment per month**. For automatic recurring billing, you'll need to:

- [ ] Implement a cron job or scheduled task that checks for expiring subscriptions
- [ ] Auto-create new Revolut orders for renewal and email the checkout link to users
- [ ] Alternatively, integrate with Revolut's recurring payment API when it becomes available for your account type

---

## Payment Flow

```
User clicks "Subscribe" on /billing
  → Frontend POST /api/billing/checkout { currency: "USD" | "RON" }
  → Backend creates Revolut order via POST /api/orders
  → Backend stores Payment record (PENDING)
  → Backend returns checkout_url to frontend
  → User is redirected to Revolut's hosted checkout page
  → User completes payment with card/Revolut Pay
  → Revolut redirects user back to /billing?status=success
  → Frontend polls /api/billing/status every 3 seconds
  → Meanwhile, Revolut sends ORDER_COMPLETED webhook to /api/webhooks/revolut
  → Backend verifies signature, marks Payment as COMPLETED
  → Backend activates Subscription (ACTIVE, 30-day period)
  → Frontend sees active status, shows success
```

---

## Architecture Decisions

1. **Hosted Checkout (not embedded):** Simplest integration — no PCI compliance burden, no frontend SDK needed. Revolut handles the entire payment form.

2. **Polling + Webhooks:** Dual approach for reliability. The webhook is the primary mechanism, but the `/api/billing/status` endpoint polls Revolut's API as a fallback if the webhook is delayed.

3. **Client-side subscription gate:** The `SubscriptionGate` component checks subscription status on the client. This avoids blocking server rendering while still enforcing payment. The API routes remain independently protected via session auth.

4. **Trial auto-creation:** Subscriptions are created automatically on first sign-in with `TRIALING` status and a 30-day expiry. No card is required.
