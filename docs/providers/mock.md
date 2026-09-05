# Mock provider

The mock provider returns **deterministic fictional data** for demos, development, and tests.

## When allowed

| Environment | Allowed |
| --- | --- |
| Development / test | Yes (default when unset in dev) |
| Self-hosted production | Only with `CITED_ALLOW_MOCK_PROVIDER=true` |
| Cited Cloud production | Never (not applicable to community edition) |

## Configuration

```bash
CITED_MONITORING_PROVIDER=mock
CITED_ALLOW_MOCK_PROVIDER=true
```

## Behavior

- Supports every public AI surface with `[MOCK DATA]` labeled responses
- Uses fictional brands and domains (`cited-test.example`, `competitor-labs.example`)
- Simulates citations, mentions, recommendations, competitors, and missed opportunities
- Never contacts external networks

## UI warning

Self-hosted installations running mock mode show a visible demo warning in provider settings.

**Do not treat mock output as live AI evidence.**

## Related

- [First monitor tutorial](../getting-started/first-monitor.md)
- [Provider overview](overview.md)
