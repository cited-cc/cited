# Mock monitoring provider

The mock provider returns deterministic fictional data for demos, development, and tests.

## When it is allowed

| Environment | Allowed |
| --- | --- |
| Development / test | Yes (default in dev when unset) |
| Self-hosted production | Only with `CITED_ALLOW_MOCK_PROVIDER=true` |
| Cited Cloud production | Never |

## Configuration

```env
CITED_MONITORING_PROVIDER=mock
CITED_ALLOW_MOCK_PROVIDER=true
```

Legacy variables `MONITORING_PROVIDER` and `MONITORING_ALLOW_MOCK_PROVIDER` remain temporarily accepted with deprecation warnings.

## Behavior

- Supports every public AI surface with `[MOCK DATA]` labeled responses
- Uses fictional brands and domains (`cited-test.example`, `competitor-labs.example`)
- Simulates citations, mentions, recommendations, competitors, missed opportunities, rate limits, timeouts, malformed responses, and pending poll completion
- Never contacts external networks

## UI warning

Self-hosted installations running mock mode should show a visible demo warning in workspace provider settings.

Do not treat mock output as live AI evidence.
