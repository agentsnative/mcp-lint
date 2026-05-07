# MCP-Lint Public Constitution

## Project Identity

MCP-Lint is a static linter and GitHub Action for Model Context Protocol server
repositories. v0 focuses on TypeScript and Python servers, static analysis,
local CLI output, GitHub-native reports, and public-safe rule documentation.

## Source of Truth

Public rule behavior is governed by this constitution, `policy/rule-catalog.yml`,
`specs/**/spec.md`, and `docs/rules/MCP-*.md`. Agents must not invent new rules,
rename rule IDs, change severity, change confidence, change build order, or
broaden v0 scope without an explicit spec update.

## Locked v0 Rule Catalog

| Build order | Rule ID | Name | Severity | Default confidence |
|---:|---|---|---|---|
| 1 | MCP-SEC-003a | HTTP Non-Loopback Bind | High | High |
| 2 | MCP-SEC-003b | HTTP Transport Without Auth | High | High |
| 3 | MCP-SEC-001 | Shell / Eval / Exec Exposed Without Operator Gate | Critical | High |
| 4 | MCP-SEC-005 | SSRF URL-Fetch Tool Without Denylist | High | High |
| 5 | MCP-SEC-002 | Path Traversal in File Tools | High | Medium |
| 6 | MCP-QUAL-002 | Destructive Tool Missing Safety Metadata | Medium | Medium |
| 7 | MCP-SEC-004 | Secret Handling Hygiene | High | Medium |
| 8 | MCP-QUAL-001 | Hard Schema Checks Only | High | High |
| 9 | MCP-QUAL-003 | Tool Description Prose Quality | Medium | Low |

## Fixture-First TDD

Behavioral work must follow RED, GREEN, REFACTOR. Add or update failing fixtures,
tests, or golden output assertions before implementing detector, reporter,
scoring, suppression, configuration, or parser behavior.

Each rule needs positive, negative, synthetic, and approved real-fixture
coverage where available. Real fixtures require provenance and complete
disclosure status.

## Public Artifact Policy

Public artifacts may include scrubbed specs, scrubbed constitution content,
source, tests, docs, policy files, and deterministic governance scripts.

Public artifacts must not include raw prompts, raw research notes, generated
implementation scratchpads, private paths, undisclosed evidence, or internal
planning notes.

## Output Contract

Every finding must preserve stable rule metadata, severity, confidence, file
location when available, message, fix suggestion, score impact, and fingerprint.
Reporter changes require golden output checks.

## Validation Gates

Before finishing governance-sensitive work, run:

```bash
pnpm specs:check-public
pnpm governance:check
```

Before release-sensitive work, also run:

```bash
pnpm verify
pnpm governance:pack
```
