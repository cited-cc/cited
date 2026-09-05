export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const HOME_FAQ: FaqItem[] = [
  {
    id: "what-does-cited-monitor",
    question: "What does Cited monitor?",
    answer:
      "Cited checks the prompts, locations, and AI surfaces you choose (ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode based on your plan). It records when your verified domain appears as a cited source, a mention, a recommendation, or a missed opportunity.",
  },
  {
    id: "free-check",
    question: "What does the free citation check include?",
    answer:
      "Paste your domain, choose the questions that matter, and get a private result link. When the snapshot is ready, you see the prompts checked and included evidence. Continuous monitoring, alerts, and history are available on a plan.",
  },
  {
    id: "how-long",
    question: "How long does a check take?",
    answer:
      "Most checks finish in a few minutes depending on the surfaces and prompts you selected. Cited shows honest progress and emails the private result link when the snapshot is ready.",
  },
  {
    id: "every-conversation",
    question: "Does Cited see every AI conversation?",
    answer:
      "No. Cited monitors the specific prompts and supported surfaces you configure. It does not have access to every private AI conversation happening in the world.",
  },
  {
    id: "need-access",
    question: "Do you need access to my app or analytics?",
    answer:
      "No. The free check uses the public domain and prompts you provide. Monitoring runs on the surfaces included in your plan. No repo access and no analytics hookup.",
  },
  {
    id: "result-private",
    question: "Is my result private?",
    answer:
      "Yes. Result links are private by default and reachable only with your unique token. Links can expire for safety.",
  },
  {
    id: "what-counts-as-citation",
    question: "What counts as a citation?",
    answer:
      "A citation is when a monitored AI response includes a source URL, linked reference, or attributable source that matches your verified domain or approved domain aliases.",
  },
  {
    id: "mentions-without-link",
    question: "Can Cited track mentions without a link?",
    answer:
      "Yes. Cited can distinguish between a direct source citation and a brand mention when the response includes your configured brand or product name without an attributable source link.",
  },
  {
    id: "which-surfaces",
    question: "Which AI surfaces can I monitor?",
    answer:
      "Surface availability depends on your plan, location, and provider support. Cited shows supported options during monitor setup.",
  },
  {
    id: "replace-seo",
    question: "Does Cited replace SEO software?",
    answer:
      "No. Cited is a citation-monitoring and evidence product. It tells you where AI answers are citing you; it does not replace a broader SEO or growth-operations platform.",
  },
  {
    id: "cancel-anytime",
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel your subscription at any time. Your access remains available through the end of your current billing period.",
  },
];

export const PRICING_FAQ: FaqItem[] = [
  {
    id: "what-is-free",
    question: "What is free versus paid?",
    answer:
      "The free citation check gives you a private snapshot for the prompts you choose. Paid plans keep those prompts on a schedule, save durable evidence, and alert you when meaningful evidence appears.",
  },
  {
    id: "every-conversation",
    question: "Does Cited monitor every AI conversation?",
    answer:
      "No. Cited monitors the prompts, locations, schedules, and AI surfaces you configure (ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode based on your plan).",
  },
  {
    id: "monitoring-availability",
    question: "Do all plans monitor the same AI surfaces?",
    answer:
      "Monitoring availability can vary by AI surface, provider support, and location. Cited only runs the checks included in your selected plan and configured monitors.",
  },
  {
    id: "why-limits",
    question: "Why do plans have prompt and cadence limits?",
    answer:
      "Clear usage limits protect monitoring quality and keep plans predictable. You can upgrade when the questions, locations, or monitoring cadence become more important.",
  },
  {
    id: "founder-limit",
    question: "What is the Founder plan?",
    answer:
      "Founder is $19 a month and includes a focused citation inbox with ChatGPT and Gemini monitoring. Growth adds Perplexity. Pro adds Claude, Google AI Overviews, and Google AI Mode. Portfolio adds multi-domain monitoring for teams managing several properties.",
  },
  {
    id: "portfolio-plan",
    question: "What is the Portfolio plan?",
    answer:
      "Portfolio is $199 a month and includes everything in Pro for up to 5 verified domains and 50 monitored prompts in one workspace. It is built for agencies, consultants, and multi-brand teams.",
  },
  {
    id: "cancel-billing",
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel from billing settings or Stripe Customer Portal. Access continues through your current billing period unless your billing state requires attention.",
  },
  {
    id: "overages",
    question: "Will I be charged for overages?",
    answer:
      "No automatic overage billing is enabled. Plan limits protect monitoring quality and predictable costs. Portfolio customers can purchase additional verified domain slots from billing when they need more than the five included domains.",
  },
  {
    id: "prompt-limit",
    question: "What happens if I hit a prompt limit?",
    answer:
      "You can remove prompts or upgrade to a plan with a higher prompt limit.",
  },
  {
    id: "results-vary",
    question: "Will every check return the same answer?",
    answer:
      "Cited monitors the prompts, AI surfaces, locations, and schedules you configure. Results can vary by provider, model, location, timing, and prompt wording.",
  },
];

export const SCAN_DISCLAIMER =
  "Cited monitors the prompts, locations, and AI surfaces you select (ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode based on your plan). Results can vary by model, location, timing, and provider availability.";
