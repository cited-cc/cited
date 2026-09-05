import { setDeploymentModeOverrideForTests } from "@/lib/deployment/config";
import { resetDeploymentCacheForTests } from "@/lib/deployment/mode";

export function withCloudDeploymentForTest(run: () => void): void {
  const previousMode = process.env.CITED_DEPLOYMENT_MODE;
  const previousPublic = process.env.NEXT_PUBLIC_CITED_DEPLOYMENT_MODE;
  setDeploymentModeOverrideForTests("cloud");
  resetDeploymentCacheForTests();
  process.env.NEXT_PUBLIC_CITED_DEPLOYMENT_MODE = "cloud";
  try {
    run();
  } finally {
    setDeploymentModeOverrideForTests(null);
    resetDeploymentCacheForTests();
    if (previousMode === undefined) {
      delete process.env.CITED_DEPLOYMENT_MODE;
    } else {
      process.env.CITED_DEPLOYMENT_MODE = previousMode;
    }
    if (previousPublic === undefined) {
      delete process.env.NEXT_PUBLIC_CITED_DEPLOYMENT_MODE;
    } else {
      process.env.NEXT_PUBLIC_CITED_DEPLOYMENT_MODE = previousPublic;
    }
  }
}
