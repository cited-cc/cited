# Prompts and surfaces

## Monitored prompts

A **monitored prompt** is a question or instruction you want Cited to run against selected AI surfaces on a schedule. Examples:

- "What is the best tool to monitor AI citations?"
- "Best AI SEO tools for startups"

Prompts belong to a verified domain and workspace.

## AI surfaces

A **surface** is a specific AI product or mode Cited can query through a provider adapter. Public surfaces include:

| Surface | Notes |
| --- | --- |
| ChatGPT | Provider-dependent availability |
| Gemini | Provider-dependent availability |
| Perplexity | Provider-dependent availability |
| Claude | Provider-dependent availability |
| Google AI Overviews | Provider-dependent availability |
| Google AI Mode | Provider-dependent availability |

Enable surfaces with `MONITORING_ENABLED_SURFACES` (comma-separated list).

## Provider boundary

Surface availability depends on the **selected provider**:

- **Mock**: all public surfaces return fictional labeled data
- **DataForSEO**: live availability follows DataForSEO API support; operator supplies credentials

Cited does not guarantee every surface for every provider.

## Monitor configuration

Each monitor ties together:

- One prompt
- One surface
- Locale and country targeting
- Scan frequency

See [monitoring lifecycle](monitoring-lifecycle.md).

## Related

- [Provider overview](../providers/overview.md)
- Monitored prompts (in-app documentation at `/docs/monitored-prompts`)
