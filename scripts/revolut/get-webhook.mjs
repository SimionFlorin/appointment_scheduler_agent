/**
 * Retrieve a single Revolut webhook (includes the signing_secret).
 *
 * Usage:
 *   node --env-file=.env scripts/revolut/get-webhook.mjs <webhook-id> [--live]
 */

import { API_URL, headers, ENV_LABEL, die } from "./_config.mjs";

const webhookId = process.argv.find(
  (a) => !a.startsWith("-") && a !== process.argv[0] && a !== process.argv[1]
);
if (!webhookId) die("Provide the webhook ID as the first argument.");

console.log(`\n  [${ENV_LABEL}] Retrieving webhook ${webhookId}...\n`);

const res = await fetch(`${API_URL}/api/1.0/webhooks/${webhookId}`, {
  headers,
});
const body = await res.text();

if (!res.ok) {
  die(`${res.status} ${res.statusText}\n  ${body}`);
}

const wh = JSON.parse(body);

console.log(`  ID:             ${wh.id}`);
console.log(`  URL:            ${wh.url}`);
console.log(`  Events:         ${wh.events?.join(", ")}`);

if (wh.signing_secret) {
  console.log(`  Signing secret: ${wh.signing_secret}`);
  console.log(
    "\n  Add this to your .env as REVOLUT_WEBHOOK_SIGNING_SECRET\n"
  );
} else {
  console.log(`  Signing secret: (not returned — may require creation)\n`);
}
