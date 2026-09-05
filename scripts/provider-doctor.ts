import {
  assertMonitoringProviderSelection,
  isMockProviderAllowed,
  parseSurfaceProviderMap,
  readDeploymentModeForProviderConfig,
  resolveDefaultMonitoringProviderId,
} from "@/lib/providers/config";
import { listMonitoringProviders } from "@/lib/providers/registry";
import { validateProviderRouting } from "@/lib/providers/router";

import "@/lib/providers/bootstrap";

function validateDataForSeoConfiguration(): {
  status: "ready" | "incomplete" | "invalid";
  message?: string;
} {
  const hasLogin = Boolean(process.env.DATAFORSEO_LOGIN?.trim());
  const hasPassword = Boolean(process.env.DATAFORSEO_PASSWORD?.trim());
  if (!hasLogin || !hasPassword) {
    return {
      status: "incomplete",
      message: "Monitoring provider credentials are not configured.",
    };
  }

  const baseUrl = process.env.DATAFORSEO_API_BASE_URL ?? "https://api.dataforseo.com";
  try {
    const host = new URL(baseUrl).hostname;
    const allowed = new Set(["api.dataforseo.com", "sandbox.dataforseo.com"]);
    if (process.env.NODE_ENV === "production" && !allowed.has(host)) {
      return {
        status: "invalid",
        message: "Production DataForSEO base URL must use an official host.",
      };
    }
  } catch {
    return {
      status: "invalid",
      message: "Invalid DataForSEO base URL.",
    };
  }

  return { status: "ready" };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const liveRequested = args.has("--live");

  if (liveRequested) {
    console.error(
      "provider:doctor --live is blocked in this repository phase. Remove --live to continue.",
    );
    process.exit(1);
  }

  const defaultProviderId = resolveDefaultMonitoringProviderId();
  const deploymentMode = readDeploymentModeForProviderConfig();
  const mockAllowed = isMockProviderAllowed();
  const routing = validateProviderRouting();
  const providers = listMonitoringProviders();
  let exitCode = 0;

  console.log("Monitoring provider doctor (offline)\n");
  console.log(`deployment mode: ${deploymentMode}`);
  console.log(`default provider: ${defaultProviderId}`);
  console.log(`mock allowed: ${mockAllowed ? "yes" : "no"}`);

  try {
    parseSurfaceProviderMap();
    console.log("surface map: valid");
  } catch (error) {
    exitCode = 1;
    console.error(
      `surface map: invalid (${error instanceof Error ? error.message : String(error)})`,
    );
  }

  const selection = assertMonitoringProviderSelection(defaultProviderId);
  if ("ok" in selection && selection.ok === false) {
    exitCode = 1;
    console.error(`selection: blocked (${selection.safeMessage})`);
  } else {
    console.log("selection: allowed");
  }

  for (const provider of providers) {
    if (provider.id === "mock") {
      const status = mockAllowed ? "ready" : "invalid";
      console.log(`- mock: ${status}`);
      if (!mockAllowed) {
        exitCode = 1;
        console.error("  message: Mock provider is not allowed in this environment.");
      } else {
        console.log("  warning: Mock provider returns fictional demo data only.");
      }
      continue;
    }

    if (provider.id === "dataforseo") {
      const validation = validateDataForSeoConfiguration();
      console.log(`- dataforseo: ${validation.status}`);
      if (validation.status !== "ready") {
        if (defaultProviderId === "dataforseo") {
          exitCode = 1;
        }
        if (validation.message) {
          console.error(`  message: ${validation.message}`);
        }
      } else {
        console.log("  warning: DataForSEO usage is billed to your provider account.");
      }
    }
  }

  console.log(`surface routes: ${routing.routes.length || "default only"}`);
  for (const route of routing.routes) {
    console.log(`  ${route.surface} -> ${route.providerId}`);
  }

  process.exit(exitCode);
}

main();
