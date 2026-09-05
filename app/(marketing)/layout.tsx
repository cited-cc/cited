import { PostFooterBar } from "@/components/layout/post-footer-bar";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { getSessionPrincipal } from "@/lib/auth/session";

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const principal = await getSessionPrincipal();
  const signedIn = Boolean(principal?.userId);

  return (
    <div className="cited-atmosphere cited-grain flex min-h-dvh flex-col overflow-x-clip">
      <MarketingHeader signedIn={signedIn} />
      <main className="flex-1 pb-[env(safe-area-inset-bottom,0px)]">{children}</main>
      <MarketingFooter />
      <PostFooterBar />
    </div>
  );
}
