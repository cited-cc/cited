import "server-only";

import { NextResponse } from "next/server";

import { isCapabilityAvailable } from "@/lib/deployment/capabilities";
import { getDeploymentMode } from "@/lib/deployment/mode";
import type { DeploymentCapability } from "@/lib/deployment/types";

const DISABLED_ROUTE_BODY = Object.freeze({
  error: "Not found.",
});

export function deploymentDisabledRouteResponse(): NextResponse {
  return NextResponse.json(DISABLED_ROUTE_BODY, { status: 404 });
}

export function guardDeploymentCapabilityRoute(
  capability: DeploymentCapability,
): NextResponse | null {
  if (!isCapabilityAvailable(capability, getDeploymentMode())) {
    return deploymentDisabledRouteResponse();
  }
  return null;
}

/** Legacy cloud guard names retained as always-disabled stubs for compatibility imports. */
export function guardCloudBillingRoute(): NextResponse | null {
  return deploymentDisabledRouteResponse();
}

export function guardStripeCheckoutRoute(): NextResponse | null {
  return deploymentDisabledRouteResponse();
}

export function guardStripePortalRoute(): NextResponse | null {
  return deploymentDisabledRouteResponse();
}

export function guardStripeWebhookRoute(): NextResponse | null {
  return deploymentDisabledRouteResponse();
}

export function guardBillingReconciliationRoute(): NextResponse | null {
  return deploymentDisabledRouteResponse();
}

export function guardMarketingFreeScanRoute(): NextResponse | null {
  return deploymentDisabledRouteResponse();
}

export function guardMarketingChatbotRoute(): NextResponse | null {
  return deploymentDisabledRouteResponse();
}

export function guardHostedInboundEmailRoute(): NextResponse | null {
  return deploymentDisabledRouteResponse();
}

export function guardLearnDomainsHandoffRoute(): NextResponse | null {
  return deploymentDisabledRouteResponse();
}

export function guardHostedLifecycleCampaignsRoute(): NextResponse | null {
  return deploymentDisabledRouteResponse();
}
