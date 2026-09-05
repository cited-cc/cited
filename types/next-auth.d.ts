import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    provider?: "local" | "clerk";
    providerSubject?: string;
  }

  interface Session {
    user: {
      id: string;
      provider: "local" | "clerk";
      providerSubject: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: "local" | "clerk";
    providerSubject?: string;
    passwordChangedAt?: number;
    invalidated?: boolean;
  }
}
