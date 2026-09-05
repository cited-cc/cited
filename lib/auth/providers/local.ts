import "server-only";

import { auth as nextAuth } from "@/auth";
import { resolvePrincipalFromUserId } from "@/lib/auth/identity";
import type { AuthProviderAdapter } from "@/lib/auth/provider";

export const localAuthProvider: AuthProviderAdapter = {
  id: "local",

  async resolveSessionPrincipal() {
    const session = await nextAuth();
    const user = session?.user;
    if (!user?.id) {
      return null;
    }

    const providerSubject = user.providerSubject ?? user.id;
    return resolvePrincipalFromUserId(user.id, "local", providerSubject);
  },
};
