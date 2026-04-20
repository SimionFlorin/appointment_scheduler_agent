import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listRevolutPaymentMethods } from "@/lib/revolut";

/**
 * Dev-only diagnostic: hits Revolut's customer payment-methods endpoint for
 * the current user's revolutCustomerId, in both scopes, so we can see exactly
 * whether a card got saved and in which scope.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { revolutCustomerId: true },
  });

  if (!user?.revolutCustomerId) {
    return NextResponse.json({
      revolutCustomerId: null,
      note: "User has no revolutCustomerId yet — no checkout has created a Revolut customer for them.",
    });
  }

  const latestPayment = await prisma.payment.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { isSandbox: true },
  });
  const sandbox = latestPayment?.isSandbox ?? true;

  const out: Record<string, unknown> = {
    revolutCustomerId: user.revolutCustomerId,
    sandbox,
  };

  try {
    out.merchantOnly = await listRevolutPaymentMethods(user.revolutCustomerId, {
      onlyMerchant: true,
      sandbox,
    });
  } catch (err) {
    out.merchantOnlyError = err instanceof Error ? err.message : String(err);
  }

  try {
    out.all = await listRevolutPaymentMethods(user.revolutCustomerId, {
      onlyMerchant: false,
      sandbox,
    });
  } catch (err) {
    out.allError = err instanceof Error ? err.message : String(err);
  }

  out.dbRows = await prisma.revolutPaymentMethod.findMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json(out);
}
