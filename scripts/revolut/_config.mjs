const isLive = process.argv.includes("--live");

const SANDBOX = {
  apiUrl: process.env.REVOLUT_API_URL || "https://sandbox-merchant.revolut.com",
  secretKey: process.env.REVOLUT_API_SECRET_KEY,
};

const LIVE = {
  apiUrl:
    process.env.REVOLUT_LIVE_API_URL || "https://merchant.revolut.com",
  secretKey: process.env.REVOLUT_LIVE_SECRET_KEY,
};

const config = isLive ? LIVE : SANDBOX;

if (!config.secretKey) {
  console.error(
    `\n  Missing ${isLive ? "REVOLUT_LIVE_SECRET_KEY" : "REVOLUT_API_SECRET_KEY"} in .env\n`
  );
  process.exit(1);
}

export const API_URL = config.apiUrl;
export const SECRET_KEY = config.secretKey;
export const API_VERSION = "2024-09-01";
export const ENV_LABEL = isLive ? "LIVE" : "SANDBOX";

export const headers = {
  Authorization: `Bearer ${SECRET_KEY}`,
  "Content-Type": "application/json",
  "Revolut-Api-Version": API_VERSION,
};

export function die(msg) {
  console.error(`\n  Error: ${msg}\n`);
  process.exit(1);
}
