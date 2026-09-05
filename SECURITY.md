# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| Latest tagged stable release | Supported once published |
| Pre-release / main branch | Best-effort during open-source preparation |
| No stable public release yet | **Current state** |

There is **no stable public version** yet. This repository remains a
pre-release candidate and is not ready for production self-hosting without
operator hardening review.

Cited is **not** claimed to be penetration-tested, SOC 2 certified, HIPAA
compliant, or GDPR compliant.

## Reporting a vulnerability

**Do not report security vulnerabilities in public GitHub issues, discussions,
or pull requests.**

### After the public GitHub repository exists

Use GitHub private vulnerability reporting when enabled for the repository.

### Interim reporting (current phase)

Report security issues through the Cited contact page:

https://cited.cc/contact

Select a private or security-appropriate contact method if offered. Do not include
credentials, customer data, or personal information in the initial report.

## What to include

Help us investigate quickly by providing:

- A clear description of the issue and potential impact
- Steps to reproduce, or a proof of concept if available
- Affected components, routes, or versions (commit hash if known)
- Your assessment of severity (informational is fine)

## Response goals (not guarantees)

We aim to:

- Acknowledge reports within **5 business days**
- Provide a preliminary assessment within **15 business days** for valid reports
- Coordinate fixes and disclosure timelines responsibly

These are goals, not contractual service levels.

## Safe harbor for good-faith research

We support good-faith security research that follows this policy.

Researchers must:

- Avoid accessing other users' data
- Avoid service disruption, data exfiltration, or social engineering
- Avoid testing against cited.cc production without explicit written authorization
- Stop immediately if sensitive data is encountered and report it privately

We will not pursue legal action against researchers who act in good faith and
follow this policy, subject to applicable law.

## Prohibited activities

- Including live credentials, tokens, or personal data in reports
- Publicly disclosing unresolved critical issues without coordination
- Automated scanning that degrades production services
- Testing production self-hosted instances without operator permission

## Scope

This policy covers the **public Cited community edition source** in this
repository (self-hosted distribution).

It does **not** authorize testing of cited.cc production infrastructure,
customer accounts, or private Cited Cloud systems without explicit permission.

## Community edition vs cited.cc

The open-source community edition is a separate self-hosted distribution from
**hosted Cited Cloud** at cited.cc. Security findings in this repository do not
automatically apply to cited.cc operations, and vice versa.

## Security documentation

- [Threat model](docs/security/threat-model.md)
- [Privacy and data](docs/security/privacy-and-data.md)
- [Hardening guide](docs/security/hardening.md)
- [Release checklist](docs/security/release-checklist.md)

## Recognition

We appreciate responsible disclosure. Recognition details may be published after
the first stable public release.
