import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const authRequiredPaths = ["/dashboard", "/services", "/appointments", "/conversations", "/settings", "/onboarding"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const needsAuth =
    authRequiredPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    ) ||
    (pathname.startsWith("/api") &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/api/webhooks"));

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon\\.svg|.*\\.png$|.*\\.svg$|sitemap\\.xsl$).*)"],
};
