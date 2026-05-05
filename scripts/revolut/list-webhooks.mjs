/**
 * List all Revolut webhooks.
 *
 * Usage:
 *   node --env-file=.env scripts/revolut/list-webhooks.mjs [--live]
 */

import { API_URL, headers, ENV_LABEL, die } from "./_config.mjs";

console.log(`\n  [${ENV_LABEL}] Listing webhooks...\n`);

const res = await fetch(`${API_URL}/api/1.0/webhooks`, { headers });
const body = await res.text();

if (!res.ok) {
  die(`${res.status} ${res.statusText}\n  ${body}`);
}

const webhooks = JSON.parse(body);

if (!Array.isArray(webhooks) || webhooks.length === 0) {
  console.log("  No webhooks registered.\n");
  process.exit(0);
}

console.log(`  Found ${webhooks.length} webhook(s):\n`);

for (const wh of webhooks) {
  console.log(`  ─────────────────────────────────────`);
  console.log(`  ID:     ${wh.id}`);
  console.log(`  URL:    ${wh.url}`);
  console.log(`  Events: ${wh.events?.join(", ")}`);
}

console.log(`  ─────────────────────────────────────\n`);
