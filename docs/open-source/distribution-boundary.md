# Distribution boundary

This document defines the boundary between the Cited open-source community edition and Cited Cloud, the managed service at [cited.cc](https://cited.cc).

This is a planning and safety reference. It is not legal advice. Nothing in this document authorizes making a repository public.

## Community distribution

The community edition is distributed under **AGPL-3.0-only**. It includes:

- Self-hosted application code
- Public core features (monitoring, evidence, inbox, notebook, exports)
- Public provider adapters (DataForSEO bring-your-own, mock provider)
- Public notification adapters (SMTP, Slack, disabled)
- Public documentation and Docker deployment
- Local authentication and workspace roles
- Portable background job worker

The community edition does **not** require Cited Cloud. It must build and run independently.

## Cited Cloud

Cited Cloud is the managed service at cited.cc. It remains separate and includes:

- Private operational infrastructure
- Private billing and lifecycle systems (Stripe, hosted checkout)
- Private authentication operations (Clerk) where applicable
- Private deployment configuration
- Separate support and commercial operations

## License and access

- The software license does **not** automatically include access to cited.cc.
- AGPL commercial use remains permitted under its terms.
- Cited Cloud is a managed deployment, not a feature unlock embedded in self-hosted code.
- Forks must follow the [trademark policy](../../TRADEMARKS.md).
- Public contributors retain the rights described by AGPL and the [Developer Certificate of Origin](../../DCO.md).
- DCO alone does **not** grant proprietary relicensing rights.
- Cited Cloud maintainers must not incorporate third-party contributions into a proprietary distribution without complying with AGPL or obtaining necessary rights.
- Future CLA adoption requires explicit legal review.

## Structural separation

Removing Cloud implementation from the community tree is an engineering boundary. It does **not** by itself avoid AGPL obligations for anyone who modifies and distributes the software. Network use of a modified self-hosted instance may trigger AGPL source-offer requirements depending on how the software is used and distributed.

## Managed hosting link

Self-hosted documentation may link to cited.cc for users who prefer managed hosting. That link must not expose private implementation details.

## Publication status

Publication remains blocked until Phase 13–16 complete. See `config/publication-policy.json` and `npm run publication:check`.
