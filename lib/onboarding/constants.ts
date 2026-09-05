export const ONBOARDING_STEPS = [
  { step: 1, key: "workspace", label: "Workspace" },
  { step: 2, key: "domain", label: "Domain" },
  { step: 3, key: "verify", label: "Verify" },
  { step: 4, key: "prompts", label: "Prompts" },
  { step: 5, key: "review", label: "Review" },
] as const;

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export const PROMPT_IDEA_TEMPLATES = [
  "Best tools for [category]",
  "What is [brand]?",
  "Best alternatives to [competitor]",
  "How do I solve [problem]?",
  "Who is best for [job to be done]?",
] as const;
