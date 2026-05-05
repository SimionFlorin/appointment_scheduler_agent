import { handleRevolutWebhook } from "@/lib/revolut-webhook";

export async function POST(req: Request) {
  return handleRevolutWebhook(req, {
    signingSecret: process.env.REVOLUT_LIVE_WEBHOOK_SIGNING_SECRET,
    sandbox: false,
  });
}
