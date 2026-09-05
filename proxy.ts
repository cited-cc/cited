import { NextResponse, type NextRequest } from "next/server";

import { auth as localAuth } from "@/auth";
import { canRunBrowserBootstrap } from "@/lib/auth/bootstrap";

const isProtectedPageRoute = (pathname: string) =>
  pathname.startsWith("/app") ||
  pathname.startsWith("/onboarding");

const isProtectedApiRoute = (pathname: string) =>
  pathname.startsWith("/api/billing") ||
  pathname.startsWith("/api/export") ||
  pathname.startsWith("/api/integrations");

const isPublicAuthRoute = (pathname: string) =>
  pathname.startsWith("/sign-in") ||
  pathname.startsWith("/sign-up") ||
  pathname.startsWith("/forgot-password") ||
  pathname.startsWith("/setup") ||
  pathname.startsWith("/accept-invite") ||
  pathname.startsWith("/api/auth");

const isCronInternalRoute = (pathname: string) =>
  pathname.startsWith("/api/internal/monitoring/dispatch") ||
  pathname.startsWith("/api/internal/monitoring/health") ||
  pathname.startsWith("/api/internal/notifications/dispatch") ||
  pathname.startsWith("/api/internal/notifications/digests") ||
  pathname.startsWith("/api/internal/notifications/health");

const isUserInternalRoute = (pathname: string) =>
  pathname.startsWith("/api/internal");

function redirectToSignIn(request: NextRequest) {
  const url = new URL(request.url);
  const returnTo = `${url.pathname}${url.search}`;
  const signIn = new URL("/sign-in", url.origin);
  if (returnTo && returnTo !== "/" && returnTo !== "/sign-in") {
    signIn.searchParams.set("redirect_url", returnTo);
  }
  return NextResponse.redirect(signIn);
}

async function handleLocalProxy(request: NextRequest) {
  const pathname = new URL(request.url).pathname;

  if (isCronInternalRoute(pathname)) {
    return;
  }

  if (pathname.startsWith("/setup")) {
    const eligible = await canRunBrowserBootstrap();
    if (!eligible) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    return;
  }

  if (isPublicAuthRoute(pathname)) {
    return;
  }

  if (isProtectedPageRoute(pathname)) {
    const session = await localAuth();
    if (!session?.user?.id) {
      return redirectToSignIn(request);
    }
    return;
  }

  if (isProtectedApiRoute(pathname) || isUserInternalRoute(pathname)) {
    const session = await localAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
}

export default async function proxy(request: NextRequest) {
  return handleLocalProxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap/|llms.txt|llms-full.txt|ai.txt|blog/rss.xml|[^?]*\\.(?:xml|txt)$).*)",
    "/(api|trpc)(.*)",
  ],
};
