import type { Session } from "next-auth";

type MockAuthSession = Session | null;

let mockSession: MockAuthSession = null;

export function setMockAuthSession(session: MockAuthSession): void {
  mockSession = session;
}

export function resetMockAuthSession(): void {
  mockSession = null;
}

export async function auth(): Promise<MockAuthSession> {
  return mockSession;
}

export const handlers = {
  GET: async () => new Response(null, { status: 404 }),
  POST: async () => new Response(null, { status: 404 }),
};

export async function signIn(): Promise<{ error?: string } | undefined> {
  return undefined;
}

export async function signOut(): Promise<void> {
  mockSession = null;
}
