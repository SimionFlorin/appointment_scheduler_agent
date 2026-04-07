/**
 * Create a Revolut webhook.
 *
 * Usage:
 *   node --env-file=.env scripts/revolut/create-webhook.mjs <url> [--live]
 *
 * Example:
 *   node --env-file=.env scripts/revolut/create-webhook.mjs https://myapp.com/api/webhooks/revolut
 *   node --env-file=.env scripts/revolut/create-webhook.mjs https://abc.ngrok.io/api/webhooks/revolut
 */

import { API_URL, headers, ENV_LABEL, die } from "./_config.mjs";

const url = process.argv.find((a) => a.startsWith("http"));
if (!url) die("Provide a webhook URL as the first argument.");

const events = [
  "ORDER_COMPLETED",
  "ORDER_AUTHORISED",
  "ORDER_PAYMENT_FAILED",
  "ORDER_PAYMENT_DECLINED",
  "ORDER_CANCELLED",
];

console.log(`\n  [${ENV_LABEL}] Creating webhook → ${url}`);
console.log(`  Events: ${events.join(", ")}\n`);

const res = await fetch(`${API_URL}/api/1.0/webhooks`, {
  method: "POST",
  headers,
  body: JSON.stringify({ url, events }),
});

const body = await res.text();

if (!res.ok) {
  die(`${res.status} ${res.statusText}\n  ${body}`);
}

const webhook = JSON.parse(body);

console.log("  Webhook created successfully!\n");
console.log(`  ID:     ${webhook.id}`);
console.log(`  URL:    ${webhook.url}`);
console.log(`  Events: ${webhook.events?.join(", ")}`);

if (webhook.signing_secret) {
  console.log(`\n  Signing secret: ${webhook.signing_secret}`);
  console.log(
    "  ⚠  Save this to your .env as REVOLUT_WEBHOOK_SIGNING_SECRET"
  );
  console.log("     It is only returned at creation time.\n");
} else {
  console.log(
    "\n  Tip: Run get-webhook.mjs with the ID above to retrieve the signing secret.\n"
  );
}
