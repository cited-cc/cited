import { listMonitoringProviders } from "@/lib/providers/registry";

import "@/lib/providers/bootstrap";

function main() {
  const providers = listMonitoringProviders();
  console.log("Registered monitoring providers:\n");
  for (const provider of providers) {
    console.log(`- ${provider.id} (${provider.displayName})`);
    console.log(`  adapter: ${provider.adapterVersion}`);
    console.log(`  normalization: ${provider.normalizationVersion}`);
    console.log(`  polling: ${provider.requiresPolling ? "yes" : "no"}`);
    console.log(`  surfaces: ${provider.supportedSurfaces.join(", ")}`);
    console.log("");
  }
}

main();
