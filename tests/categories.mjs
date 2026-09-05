/**
 * Vitest category definitions for deterministic CI partitioning.
 * Each category must remain disjoint except where noted.
 */

/** @type {readonly string[]} */
export const BOUNDARY_TESTS = [
  "tests/auth-boundary-check.test.ts",
  "tests/billing-boundary-check.test.ts",
  "tests/database-boundary-check.test.ts",
  "tests/deployment-boundary-check.test.ts",
  "tests/monitoring-boundary-check.test.ts",
  "tests/provider-boundary-check.test.ts",
  "tests/public-surface-boundary.test.ts",
  "tests/publication-readiness.test.ts",
  "tests/license-check.test.ts",
  "tests/provider-isolation.test.ts",
];

/** @type {readonly string[]} */
export const SECURITY_TESTS = [
  "tests/phase11-security-legal.test.ts",
  "tests/phase13-security.test.ts",
  "tests/secret-files.test.ts",
  "tests/auth.test.ts",
  "tests/auth-permissions.test.ts",
  "tests/auth-redirects.test.ts",
  "tests/domain-adversarial.test.ts",
  "tests/inbox-evidence-safety.test.ts",
  "tests/logger.test.ts",
  "tests/backend-rescue-guards.test.ts",
  "tests/robots-noindex.test.ts",
  "tests/monitoring-provider.test.ts",
  "tests/security/network-denial.test.ts",
];

/** @type {readonly string[]} */
export const INTEGRATION_TESTS = ["tests/integration/**/*.test.ts"];

/** @type {readonly string[]} */
export const ALL_VITEST_GLOB = ["tests/**/*.test.ts"];

/**
 * @param {readonly string[]} allFiles
 * @param {readonly string[]} excluded
 */
function excludePatterns(allFiles, excluded) {
  const excludedSet = new Set(excluded.flat());
  return allFiles.filter((file) => !excludedSet.has(file));
}

/** @type {readonly string[]} */
export const UNIT_TESTS = excludePatterns(
  [
    "tests/access-state.test.ts",
    "tests/blog-llm-visibility.test.ts",
    "tests/citations-normalize.test.ts",
    "tests/classification-contract.test.ts",
    "tests/contact-form.test.ts",
    "tests/create-monitor.test.ts",
    "tests/dataforseo-serp.test.ts",
    "tests/dataforseo-tasks.test.ts",
    "tests/database-phase7.test.ts",
    "tests/deployment.test.ts",
    "tests/docs-phase10.test.ts",
    "tests/entitlements.test.ts",
    "tests/entitlements-phase6.test.ts",
    "tests/inbox-filters.test.ts",
    "tests/inbox-member-state.test.ts",
    "tests/jobs-phase10.test.ts",
    "tests/marketing-cta-seo.test.ts",
    "tests/monitoring-classification.test.ts",
    "tests/monitoring-competitors.test.ts",
    "tests/monitoring-eligibility.test.ts",
    "tests/monitoring-lifecycle.test.ts",
    "tests/monitoring-schedule.test.ts",
    "tests/monitoring-state-machine.test.ts",
    "tests/monitoring-status-copy.test.ts",
    "tests/monitoring-surfaces.test.ts",
    "tests/notebook.test.ts",
    "tests/notifications-providers.test.ts",
    "tests/notifications.test.ts",
    "tests/onboarding-domain.test.ts",
    "tests/post-footer.test.ts",
    "tests/provider-contract.test.ts",
    "tests/provider-text.test.ts",
    "tests/provider-visibility.test.ts",
    "tests/theme.test.ts",
    "tests/validation-schemas.test.ts",
  ],
  [...BOUNDARY_TESTS, ...SECURITY_TESTS, ...INTEGRATION_TESTS],
);
