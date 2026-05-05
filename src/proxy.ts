import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { maskSensitiveText } from "@/lib/api-log";

const { auth } = NextAuth(authConfig);

const authRequiredPaths = ["/dashboard", "/services", "/appointments", "/conversations", "/settings", "/onboarding", "/billing"];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // Per-request log for every API hit (custom routes + next-auth's
  // /api/auth/csrf, /api/auth/session, /api/auth/callback/*). For non-GET
  // we clone() so we can read the body here without consuming it for the
  // downstream handler.
  if (pathname.startsWith("/api")) {
    let bodySnippet = "";
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        const text = await req.clone().text();
        if (text) bodySnippet = ` body=${maskSensitiveText(text)}`;
      } catch {
        bodySnippet = " body=<unreadable>";
      }
    }
    console.log(
      `[API] ${req.method} ${pathname} auth=${req.auth ? "yes" : "no"}${bodySnippet}`
    );
  }

  const needsAuth =
    authRequiredPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    ) ||
    (pathname.startsWith("/api") &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/api/webhooks") &&
      !pathname.startsWith("/api/cron")
    );

  if (!needsAuth) return NextResponse.next();

  if (!req.auth) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
  // Note: api/auth is intentionally NOT excluded so the per-request log above
  // can capture next-auth's csrf/session/callback hits. The proxy short-
  // circuits api/auth via the needsAuth check below, so behaviour is
  // unchanged — only logging is added.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon\\.svg|.*\\.png$|.*\\.svg$|sitemap\\.xsl$).*)",
  ],
};
