import NextAuth from "next-auth";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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

    async jwt({ token, account, trigger }) {
      // On sign-in: store googleId and fetch user data from DB
      if (account) {
        token.googleId = account.providerAccountId;

        const dbUser = await prisma.user.findUnique({
          where: { googleId: account.providerAccountId },
          select: { id: true, profession: true, onboardingDone: true },
        });
        if (dbUser) {
          token.dbUserId = dbUser.id;
          token.profession = dbUser.profession;
          token.onboardingDone = dbUser.onboardingDone;
        }
      }

      // On explicit update() call: re-fetch from DB to pick up changes
      if (trigger === "update" && token.googleId) {
        const dbUser = await prisma.user.findUnique({
          where: { googleId: token.googleId as string },
          select: { id: true, profession: true, onboardingDone: true },
        });
        if (dbUser) {
          token.dbUserId = dbUser.id;
          token.profession = dbUser.profession;
          token.onboardingDone = dbUser.onboardingDone;
        }
      }

      return token;
    },

    async session({ session, token }) {
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
});
