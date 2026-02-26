import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
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
    async signIn({ user, account }) {
      if (!account || !user.email) return false;

      await prisma.user.upsert({
        where: { googleId: account.providerAccountId },
        update: {
          name: user.name || "",
          email: user.email,
          image: user.image,
          googleAccessToken: account.access_token,
          googleRefreshToken: account.refresh_token ?? undefined,
          googleTokenExpiry: account.expires_at
            ? new Date(account.expires_at * 1000)
            : undefined,
        },
        create: {
          googleId: account.providerAccountId,
          email: user.email,
          name: user.name || "",
          image: user.image,
          googleAccessToken: account.access_token,
          googleRefreshToken: account.refresh_token,
          googleTokenExpiry: account.expires_at
            ? new Date(account.expires_at * 1000)
            : undefined,
        },
      });

      return true;
    },

    async jwt({ token, account }) {
      if (account) {
        token.googleId = account.providerAccountId;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.googleId) {
        const dbUser = await prisma.user.findUnique({
          where: { googleId: token.googleId as string },
          select: {
            id: true,
            profession: true,
            onboardingDone: true,
            image: true,
          },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
          (session.user as unknown as Record<string, unknown>).profession =
            dbUser.profession;
          (session.user as unknown as Record<string, unknown>).onboardingDone =
            dbUser.onboardingDone;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
