import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/", "/login", "/api/auth", "/api/webhooks"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = req.auth.user as Record<string, unknown>;
  if (
    !user?.onboardingDone &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/api")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
