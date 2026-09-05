import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  getAuthSecret,
  getSessionMaxAgeSeconds,
  isLocalAuthEnabled,
} from "@/lib/auth/config";
import {
  LocalAuthError,
  verifyLocalCredentials,
} from "@/lib/auth/local-credentials";
import {
  getPasswordChangedAtMs,
  isSessionStillValid,
} from "@/lib/auth/session-validation";

export const authConfig = {
  providers: [
    Credentials({
      id: "local-credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!isLocalAuthEnabled()) {
          return null;
        }

        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        try {
          const principal = await verifyLocalCredentials({ email, password });
          return {
            id: principal.userId,
            email: principal.email,
            name: principal.displayName,
            provider: "local" as const,
            providerSubject: principal.providerSubject,
          };
        } catch (error) {
          if (error instanceof LocalAuthError) {
            return null;
          }
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: getSessionMaxAgeSeconds(),
  },
  pages: {
    signIn: "/sign-in",
  },
  secret: getAuthSecret(),
  trustHost: true,
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.sub = user.id;
        token.provider = user.provider ?? "local";
        token.providerSubject = user.providerSubject ?? user.id;
        const changedAt = await getPasswordChangedAtMs(user.id);
        token.passwordChangedAt = changedAt ?? Date.now();
        token.invalidated = false;
        return token;
      }

      if (token.sub && typeof token.sub === "string") {
        const stillValid = await isSessionStillValid({
          userId: token.sub,
          tokenPasswordChangedAt:
            typeof token.passwordChangedAt === "number"
              ? token.passwordChangedAt
              : undefined,
        });
        if (!stillValid) {
          token.invalidated = true;
        }
      }

      if (trigger === "update") {
        token.invalidated = token.invalidated ?? false;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.invalidated) {
        return {
          ...session,
          user: undefined,
          expires: new Date(0).toISOString(),
        };
      }

      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.provider = (token.provider as "local" | "clerk") ?? "local";
        session.user.providerSubject =
          (token.providerSubject as string | undefined) ?? token.sub;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
} satisfies NextAuthConfig;
