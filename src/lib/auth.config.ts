import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

// On Vercel / any HTTPS host we must use the `__Secure-` prefixed cookie
// name. We detect this from the auto-injected env vars so the same config
// works in dev, preview and production.
const useSecureCookies =
  process.env.VERCEL === "1" ||
  process.env.NODE_ENV === "production" ||
  process.env.AUTH_URL?.startsWith("https://") ||
  process.env.NEXTAUTH_URL?.startsWith("https://");

const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
        },
      },
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (token.dbUserId) {
        session.user.id = token.dbUserId as string;
      }
      (session.user as unknown as Record<string, unknown>).profession =
        token.profession ?? null;
      (session.user as unknown as Record<string, unknown>).onboardingDone =
        token.onboardingDone ?? false;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  // Explicitly trust the host header. On Vercel this is auto-detected, but
  // setting it defensively avoids "InvalidCheck" errors that can show up on
  // preview deployments where the auto-detection logic occasionally fails.
  trustHost: true,
  // Explicit cookie configuration for the OAuth flow. The default Auth.js
  // config relies on auto-detection of the secure prefix which can be racy
  // on serverless cold starts and behind CDNs, leading to the
  // "InvalidCheck: pkceCodeVerifier value could not be parsed" error
  // (see https://github.com/nextauthjs/next-auth/issues/12345). Pinning the
  // cookie names + options makes the callback deterministic.
  cookies: {
    pkceCodeVerifier: {
      name: `${cookiePrefix}authjs.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        // 15 minutes – plenty of time to complete the Google consent screen
        // but short enough that stale verifiers from abandoned flows expire.
        maxAge: 60 * 15,
      },
    },
    state: {
      name: `${cookiePrefix}authjs.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15,
      },
    },
    nonce: {
      name: `${cookiePrefix}authjs.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
} satisfies NextAuthConfig;
