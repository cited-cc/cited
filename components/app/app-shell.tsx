"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { AppSidebar } from "@/components/app/app-sidebar";
import type { CreateMonitorDialogConfig } from "@/components/app/create-monitor-dialog";
import type { DomainSwitcherOption } from "@/components/app/domain-switcher";
import { MobileAppHeader } from "@/components/app/mobile-app-nav";
import { useCommandMenuShortcut } from "@/components/ui/command-menu";
import { Sheet } from "@/components/ui/sheet";
import { ToastProvider } from "@/components/ui/toast";

const CommandMenu = dynamic(
  () =>
    import("@/components/ui/command-menu").then((mod) => mod.CommandMenu),
  { ssr: false },
);

const CreateMonitorDialog = dynamic(
  () =>
    import("@/components/app/create-monitor-dialog").then(
      (mod) => mod.CreateMonitorDialog,
    ),
  { ssr: false },
);

type AppChromeContextValue = {
  openCommand: () => void;
  openCreateMonitor: () => void;
};

const AppChromeContext = createContext<AppChromeContextValue | null>(null);

export function useAppChrome() {
  const ctx = useContext(AppChromeContext);
  if (!ctx) {
    throw new Error("useAppChrome must be used within AppShellChrome");
  }
  return ctx;
}

type AppShellChromeProps = {
  children: ReactNode;
  workspaceName: string;
  planName: string;
  planLabel: string;
  billingStatusLabel: string | null;
  domains?: DomainSwitcherOption[];
  activeDomainId?: string | null;
  showDomainSwitcher?: boolean;
  canAddDomain?: boolean;
  createMonitorConfig?: CreateMonitorDialogConfig | null;
};

export function AppShellChrome({
  children,
  workspaceName,
  planName,
  planLabel,
  billingStatusLabel,
  domains = [],
  activeDomainId = null,
  showDomainSwitcher = false,
  canAddDomain = false,
  createMonitorConfig = null,
}: AppShellChromeProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createMonitorOpen, setCreateMonitorOpen] = useState(false);

  const openCommand = useCallback(() => setCommandOpen(true), []);
  const openCreateMonitor = useCallback(() => {
    setMobileOpen(false);
    setCreateMonitorOpen(true);
  }, []);

  useCommandMenuShortcut(openCommand);

  return (
    <AppChromeContext.Provider value={{ openCommand, openCreateMonitor }}>
      <ToastProvider>
        <div className="cited-atmosphere cited-grain relative flex min-h-dvh overflow-x-clip bg-cited-canvas text-cited-ink">
          <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:shrink-0">
            <AppSidebar
              workspaceName={workspaceName}
              planName={planName}
              planLabel={planLabel}
              billingStatusLabel={billingStatusLabel}
              domains={domains}
              activeDomainId={activeDomainId}
              showDomainSwitcher={showDomainSwitcher}
              canAddDomain={canAddDomain}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col pb-[env(safe-area-inset-bottom,0px)]">
            <MobileAppHeader
              onOpenNav={() => setMobileOpen(true)}
              onOpenCommand={openCommand}
            />
            <div className="mx-auto flex w-full max-w-[1440px] min-w-0 flex-1 flex-col">
              {children}
            </div>
          </div>

          <Sheet
            open={mobileOpen}
            onOpenChange={setMobileOpen}
            title="Navigation"
            side="left"
            className="p-0"
          >
            <div className="-mx-2 -my-3 h-full">
              <AppSidebar
                className="h-full w-full border-0"
                workspaceName={workspaceName}
                planName={planName}
                planLabel={planLabel}
                billingStatusLabel={billingStatusLabel}
                domains={domains}
                activeDomainId={activeDomainId}
                showDomainSwitcher={showDomainSwitcher}
                canAddDomain={canAddDomain}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </Sheet>

          <CommandMenu
            open={commandOpen}
            onOpenChange={setCommandOpen}
            onCreateMonitor={openCreateMonitor}
          />

          <CreateMonitorDialog
            open={createMonitorOpen}
            onOpenChange={setCreateMonitorOpen}
            config={createMonitorConfig}
          />
        </div>
      </ToastProvider>
    </AppChromeContext.Provider>
  );
}
