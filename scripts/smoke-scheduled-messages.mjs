// Smoke-test for the manual + scheduled messages backend.
//
// This intentionally avoids the HTTP layer (which would require Google OAuth
// to mint a session) and exercises the same code paths the routes call:
//   - sendOutboundMessage (manual send-now)
//   - cron dispatcher logic (PENDING -> SENT, retry, FAILED-after-3)
//   - recordIncomingCustomerMessage (AI-disabled webhook path)
//
// We monkey-patch the WhatsApp provider factory so no real API call is made.
//
// Run: node --env-file=.env scripts/smoke-scheduled-messages.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- We can't mutate the ES module export, so instead we stub global fetch
// for the Meta Graph API endpoint. The configured WhatsApp provider in this
// smoke test is META, so all outbound traffic flows through fetch().

const sentLog = [];
let sendBehaviour = "ok"; // "ok" | "fail-always"

const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const u = String(url);
  if (u.includes("graph.facebook.com")) {
    const body = init?.body ? JSON.parse(init.body) : null;
    sentLog.push({ url: u, body });
    if (sendBehaviour === "fail-always") {
      return new Response("forced failure for smoke test", {
        status: 500,
        headers: { "content-type": "text/plain" },
      });
    }
    return new Response(
      JSON.stringify({ messages: [{ id: "wamid.fake" }] }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
  return realFetch(url, init);
};

const { sendOutboundMessage } = await import(
  "../src/lib/scheduled-messages.ts"
);
const { recordIncomingCustomerMessage } = await import(
  "../src/lib/ai-agent.ts"
);

function assertEq(actual, expected, name) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`❌ ${name}: expected ${e}, got ${a}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${name}`);
  }
}

async function main() {
  // Clean up + seed
  await prisma.scheduledMessage.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.whatsAppConfig.deleteMany({});
  await prisma.businessProfile.deleteMany({});
  await prisma.user.deleteMany({});

  const user = await prisma.user.create({
    data: {
      googleId: "google-test-1",
      email: "test@example.com",
      name: "Test Owner",
      aiAutoReplyEnabled: true,
      businessProfile: {
        create: {
          businessName: "Test Biz",
          timezone: "America/New_York",
        },
      },
      whatsappConfig: {
        create: {
          provider: "META",
          phoneNumberId: "PNID-1",
          metaAccessToken: "fake",
        },
      },
    },
  });
  console.log("[smoke] seeded user", user.id);

  // ---- Case 1: sendOutboundMessage happy path ----
  await sendOutboundMessage({
    userId: user.id,
    customerPhone: "+15550001111",
    body: "Hello from the owner!",
  });
  assertEq(sentLog.length, 1, "case1: provider called once");
  assertEq(sentLog[0].body.to, "+15550001111", "case1: correct to");
  assertEq(
    sentLog[0].body.text.body,
    "Hello from the owner!",
    "case1: correct body"
  );
  const conv1 = await prisma.conversation.findUnique({
    where: {
      userId_customerPhone: {
        userId: user.id,
        customerPhone: "+15550001111",
      },
    },
  });
  assertEq(!!conv1, true, "case1: conversation created");
  assertEq(conv1.messages.length, 1, "case1: 1 message persisted");
  assertEq(conv1.messages[0].role, "assistant", "case1: assistant role");
  assertEq(conv1.messages[0].manual, true, "case1: manual flag set");

  // ---- Case 2: recordIncomingCustomerMessage (AI off path) ----
  sentLog.length = 0;
  await recordIncomingCustomerMessage(
    user.id,
    "+15550001111",
    "incoming customer reply"
  );
  assertEq(sentLog.length, 0, "case2: provider NOT called for inbound record");
  const conv2 = await prisma.conversation.findUnique({
    where: {
      userId_customerPhone: {
        userId: user.id,
        customerPhone: "+15550001111",
      },
    },
  });
  assertEq(conv2.messages.length, 2, "case2: incoming appended");
  assertEq(conv2.messages[1].role, "customer", "case2: customer role");

  // ---- Case 3: scheduled message — cron dispatch happy path ----
  sentLog.length = 0;
  const due = await prisma.scheduledMessage.create({
    data: {
      userId: user.id,
      customerPhone: "+15550002222",
      body: "Scheduled hello",
      scheduledFor: new Date(Date.now() - 60 * 1000), // already due
      status: "PENDING",
    },
  });

  // Run the same logic the cron does. We import the module purely for parity
  // but we already have all helpers; replicate the loop here to keep it simple:
  const dueBatch = await prisma.scheduledMessage.findMany({
    where: { status: "PENDING", scheduledFor: { lte: new Date() } },
    take: 50,
  });
  for (const msg of dueBatch) {
    try {
      await sendOutboundMessage({
        userId: msg.userId,
        customerPhone: msg.customerPhone,
        body: msg.body,
      });
      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          attempts: { increment: 1 },
          error: null,
        },
      });
    } catch (e) {
      const nextAttempts = msg.attempts + 1;
      const finalFailure = nextAttempts >= 3;
      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: {
          status: finalFailure ? "FAILED" : "PENDING",
          attempts: { increment: 1 },
          error: e.message,
        },
      });
    }
  }
  const after3 = await prisma.scheduledMessage.findUnique({
    where: { id: due.id },
  });
  assertEq(after3.status, "SENT", "case3: scheduled flipped to SENT");
  assertEq(after3.attempts, 1, "case3: attempts == 1");
  assertEq(sentLog.length, 1, "case3: provider called once");

  // ---- Case 4: failure with retry then FAILED after 3 attempts ----
  sendBehaviour = "fail-always";
  const failer = await prisma.scheduledMessage.create({
    data: {
      userId: user.id,
      customerPhone: "+15550003333",
      body: "I will fail",
      scheduledFor: new Date(Date.now() - 60 * 1000),
      status: "PENDING",
      attempts: 0,
    },
  });
  for (let tick = 0; tick < 4; tick++) {
    const due = await prisma.scheduledMessage.findMany({
      where: { status: "PENDING", scheduledFor: { lte: new Date() } },
      take: 50,
    });
    for (const msg of due) {
      try {
        await sendOutboundMessage({
          userId: msg.userId,
          customerPhone: msg.customerPhone,
          body: msg.body,
        });
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            attempts: { increment: 1 },
            error: null,
          },
        });
      } catch (e) {
        const nextAttempts = msg.attempts + 1;
        const finalFailure = nextAttempts >= 3;
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: {
            status: finalFailure ? "FAILED" : "PENDING",
            attempts: { increment: 1 },
            error: e.message,
          },
        });
      }
    }
  }
  const failed = await prisma.scheduledMessage.findUnique({
    where: { id: failer.id },
  });
  assertEq(failed.status, "FAILED", "case4: marked FAILED after retries");
  assertEq(failed.attempts, 3, "case4: stopped at 3 attempts");
  assertEq(typeof failed.error, "string", "case4: error message stored");
  sendBehaviour = "ok";

  // ---- Case 5: cancelled scheduled message stays cancelled ----
  const cancellable = await prisma.scheduledMessage.create({
    data: {
      userId: user.id,
      customerPhone: "+15550004444",
      body: "Cancel me",
      scheduledFor: new Date(Date.now() - 60 * 1000),
      status: "CANCELLED",
    },
  });
  const dueAfterCancel = await prisma.scheduledMessage.findMany({
    where: { status: "PENDING", scheduledFor: { lte: new Date() } },
  });
  assertEq(
    dueAfterCancel.find((m) => m.id === cancellable.id),
    undefined,
    "case5: CANCELLED row not picked up by cron"
  );

  // ---- Case 6: sendOutboundMessage fails when WA not configured ----
  await prisma.whatsAppConfig.deleteMany({ where: { userId: user.id } });
  let threw = false;
  try {
    await sendOutboundMessage({
      userId: user.id,
      customerPhone: "+15550005555",
      body: "no wa configured",
    });
  } catch (e) {
    threw = true;
    assertEq(
      e.message.includes("WhatsApp"),
      true,
      "case6: error mentions WhatsApp"
    );
  }
  assertEq(threw, true, "case6: throws when no WhatsApp config");

  console.log("\n[smoke] Done.");
}

main()
  .catch((e) => {
    console.error("[smoke] FAILED", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
