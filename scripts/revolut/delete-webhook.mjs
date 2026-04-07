/**
 * Delete a Revolut webhook.
 *
 * Usage:
 *   node --env-file=.env scripts/revolut/delete-webhook.mjs <webhook-id> [--live]
 */

import { API_URL, headers, ENV_LABEL, die } from "./_config.mjs";

const webhookId = process.argv.find(
  (a) => !a.startsWith("-") && a !== process.argv[0] && a !== process.argv[1]
);
if (!webhookId) die("Provide the webhook ID as the first argument.");

console.log(`\n  [${ENV_LABEL}] Deleting webhook ${webhookId}...\n`);

const res = await fetch(`${API_URL}/api/1.0/webhooks/${webhookId}`, {
  method: "DELETE",
  headers,
});

if (res.status === 204) {
  console.log("  Webhook deleted successfully.\n");
} else {
  const body = await res.text();
  die(`${res.status} ${res.statusText}\n  ${body}`);
}
