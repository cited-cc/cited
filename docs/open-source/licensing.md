# Licensing

This document summarizes how Cited's public source is licensed. It is not legal
advice. Read LICENSE and consult qualified counsel for your situation.

## Project license

The Cited public source code in this repository is licensed under the
**GNU Affero General Public License version 3 only** (SPDX: `AGPL-3.0-only`).

The complete license text is in [LICENSE](../../LICENSE) at the repository root.

## What AGPL permits

Under AGPL terms, you may:

- Inspect the source code
- Modify the software
- Self-host Cited for your organization
- Use Cited commercially, provided you comply with AGPL obligations

AGPL does not prohibit commercial use. It requires compliance with copyleft
terms, including source availability rules that apply in certain network
deployment scenarios.

## Network use and source disclosure

If you modify Cited and make it available to users over a network (for example,
as a hosted web application), AGPL may require you to offer corresponding
source code to users of that service. The exact obligations depend on how you
deploy and distribute the software.

Review LICENSE section 13 and applicable law before operating a modified
network deployment.

## Dependency licenses

Third-party packages listed in `package.json` remain under their respective
licenses. Cited's AGPL license does not change dependency license terms.

See [dependency-licenses.md](./dependency-licenses.md) for the dependency
license inventory process.

## What this repository does not include

This license applies to the public source in this repository. It does not
automatically grant rights to:

- Cited Cloud hosted services at cited.cc
- Private Cited Cloud infrastructure or operational systems
- Production credentials, customer data, or private modules not distributed here
- Hosted-only features that remain outside the public core

## Trademarks

The software license covers copyright in the source code. It does not grant
trademark permission. See [TRADEMARKS.md](../../TRADEMARKS.md).

## Alternative commercial licensing

Organizations that cannot comply with AGPL requirements may inquire about
alternative commercial licensing in the future. No pricing or terms are
published in this phase.

Alternative licensing, if offered, would be separate from the AGPL-licensed
public source in this repository.

## Next steps

1. Read [LICENSE](../../LICENSE)
2. Run `npm run license:check` for a dependency license inventory
3. Consult counsel before production deployment or commercial redistribution
