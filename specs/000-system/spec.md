<!--
Public-safe spec generated from private SpecKit output.
Do not add raw prompts, private paths, or undisclosed vulnerability evidence.
Source path intentionally omitted from public output.
-->

# Feature Spec: MCP-Lint v0 System

Feature slug: `000-system`  
Source section: Section 1 - System-Level Spec Kit Prompt  
Phase: v0-alpha for installable artifact; v0.1 items are explicitly deferred  
Generation mode: manual SpecKit-style artifact, private workspace only

## Summary

MCP-Lint is a static linter and GitHub Action for Model Context Protocol server
repositories. It produces a reproducible trust signal for maintainers: scan
artifacts, a 0-100 score, a README badge URL, and actionable findings.

The Day-7 v0-alpha must be narrow and installable. It must run locally and in a
basic GitHub Action without executing target MCP servers or exporting private
planning material.

## Users

- Primary: an individual engineer or small team maintaining a public MCP server.
- Secondary: a contributor opening a pull request against an MCP server repo.

## v0-alpha Scope

MUST ship:

- `mcp-lint scan <path>`
- `.mcp-lint/results.json`
- `.mcp-lint/report.md`
- `.mcp-lint/badge.txt`
- `raw_score` and `effective_score`
- public badge defaulting to `raw_score`
- default output showing only HIGH-confidence findings
- a basic GitHub Action that runs `scan` and uploads artifacts
- TypeScript and Python support only
- rules: `MCP-SEC-003a`, `MCP-SEC-003b`, `MCP-SEC-001`, `MCP-SEC-005`, `MCP-QUAL-001`

SHOULD ship if it does not delay the installable alpha:

- minimal SARIF v2.1.0 output
- `mcp-lint rules`
- basic `mcp-lint.yml` parsing

## Deferred Scope

Week-2 / v0.1:

- full SARIF Code Scanning UX
- standalone `report` and `badge` subcommands
- sticky PR comment
- Marketplace polish
- rules: `MCP-SEC-002`, `MCP-SEC-004`, `MCP-QUAL-002`, `MCP-QUAL-003`, `MCP-SEC-006`

v1:

- Go, Rust, and C# parser support
- hosted dashboards, leaderboards, certification badges
- dynamic execution, fuzzing, LLM-based detection, or automated code patches

## Functional Requirements

1. The CLI exposes one binary named `mcp-lint`.
2. `mcp-lint scan <path>` analyzes a local TypeScript or Python MCP server repo.
3. Language detection uses MCP SDK dependencies in `package.json`,
4. The scan writes `.mcp-lint/results.json`, `.mcp-lint/report.md`, and
   `.mcp-lint/badge.txt`.
5. Findings include rule ID, subtype when applicable, base severity, effective
   severity, the v0.x `severity` alias for effective severity, confidence,
   location, message, fix suggestion, fingerprint, suppression fields,
   `score_impact`, `raw_score_impact`, and rule-specific metadata under
   `metadata`.
6. The default confidence threshold is HIGH. MEDIUM findings are folded unless
   the maintainer opts in; LOW findings are advisory and score-neutral in v0.
7. Scoring is explainable and preserves both `raw_score` and `effective_score`.
8. Suppressions and severity overrides affect effective presentation only; they
   do not erase findings or alter raw scoring truth.
9. Public badges use `raw_score` by default. If configured to use
   `effective_score`, the report and badge context disclose suppression and
   override counts.
10. The GitHub Action runs the scan and uploads generated artifacts.
11. Public export is out of scope for this generation session. Scrub/export must
    run later and must never copy raw plans or tasks to the public repo.

## Acceptance Criteria

- `mcp-lint scan <path>` completes under 30 seconds on the largest v0 corpus
  TypeScript server.
- The low-risk control corpus target scores at least 85.
- The critical execution regression case scores at most 50 because the Critical
  cap applies.
- No known HIGH-confidence false positives exist in the fixed v0 TypeScript and
  Python regression corpus.
- If SARIF is emitted in v0-alpha, it validates against SARIF 2.1.0.
- Public badge behavior preserves raw/effective score integrity.

## Cross-Cutting Output Contract

All rule specs, plans, and tasks inherit the Section 3 contract:

- findings preserve `base_severity`, `effective_severity`, and v0.x `severity`
  as an alias for effective severity
- suppressions require a non-empty reason and never erase findings from
  `results.json`
- fingerprints use rule ID, subtype, relative file path, and normalized excerpt;
  non-AST sources use a stable normalized text span, and secrets are redacted
  before hashing or logging
- reports include `raw_score`, `effective_score`, `score_mode`,
  `suppression_count`, `override_count`, and `critical_cap_applied`
- SARIF, when emitted, maps confidence, subtype, base/effective severity,
  suppression state, fingerprint, fix suggestion, and metadata into
  `properties`
- v0 analysis remains TypeScript/Python-only, deterministic, static, and under
  the 30 second performance budget

## Public/Private Boundary

This spec, its plan, and its tasks are private raw SpecKit artifacts in
`mcp-lint-private`. Only scrubbed `specs/**/spec.md` may be exported to
`agentsnative/mcp-lint` after the private scrub pipeline. `plan.md`, `tasks.md`,
research, contracts, data models, and quickstarts remain private.

## Public Validation Sections

### CLI Shape

The public v0-alpha CLI shape is `mcp-lint scan <path>`. Later subcommands are
deferred unless explicitly added by a future public spec.

### Inputs

The scan input is a local repository path containing TypeScript or Python MCP
server code, optional config, and optional inline suppression comments.

### Config

Configuration may set confidence threshold, output location, severity overrides,
and suppression rules. Suppressions require a non-empty reason.

### Outputs

The required outputs are `.mcp-lint/results.json`, `.mcp-lint/report.md`, and
`.mcp-lint/badge.txt`; SARIF is a v0-alpha SHOULD and v0.1 MUST.

### Scoring

Scoring preserves `raw_score`, `effective_score`, `suppression_count`, and
`override_count`. The public badge defaults to `raw_score`.

### Confidence Tiers

The HIGH-confidence-only default is required for v0-alpha output. MEDIUM and LOW
findings are folded or advisory unless explicitly requested.

### Distribution

The public distribution target is an installable package and a minimal GitHub
Action that runs the scan and uploads artifacts.

### Out-of-Scope

Out-of-scope work includes hosted dashboards, leaderboards, certification claims,
dynamic execution, fuzzing, LLM-based detection, autofix patches, and Go/Rust/C#
support in v0.

### Acceptance Criteria

Acceptance requires deterministic static analysis, public-safe outputs,
fixture-backed findings, score/badge integrity, and a passing public validator.

The public/private artifact boundary allows only scrubbed `specs/**/spec.md`
and public-safe governance artifacts into the public repo.
