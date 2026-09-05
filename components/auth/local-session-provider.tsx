"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

type LocalSessionProviderProps = {
  children: ReactNode;
};

export function LocalSessionProvider({ children }: LocalSessionProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
