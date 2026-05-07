<!--
Public-safe spec generated from private SpecKit output.
Do not add raw prompts, private paths, or undisclosed vulnerability evidence.
Source path intentionally omitted from public output.
-->

---
rule_id: MCP-QUAL-003
severity: medium
confidence: low
phase: Week-2 / v0.1 deferred
---

# Feature Spec: MCP-QUAL-003 Tool Description Prose Quality

Feature slug: `009-qual-003`  
Source section: Section 2.9  
Phase: Week-2 / v0.1 deferred  
Generation mode: manual SpecKit-style artifact, private workspace only

## Summary

Surface low-quality tool descriptions as advisory findings. Findings are LOW
confidence and have `score_impact: 0` in v0.

## Rule Contract

- Rule ID: `MCP-QUAL-003`
- Base severity: Medium
- Confidence: LOW
- Score impact: 0
- Languages: TypeScript and Python
- Detection: deterministic heuristics over tool description strings

## Subtypes

- `missing_description`
- `description_too_short`
- `unfilled_template`
- `injection_shaped`
- `description_repeats_name`
- `code_block_in_description`
- `domain_mismatch`

## What The Rule Looks For

For each tool description, detect:

- missing field
- less than 20 characters
- placeholder tokens
- prompt-injection-shaped substrings
- description that only repeats the tool name
- fenced code block in description
- domain mismatch within the same file/tool family

Domain mismatch stays heuristic and LOW confidence.

## Reporting Rules

- Report in an Advisory section.
- Do not affect `raw_score` or `effective_score` in v0.
- Keep all findings folded by default unless advisory output is requested.

## Finding Shape

Findings use:

- `rule_id: "MCP-QUAL-003"`
- subtype
- `base_severity: "medium"`
- `confidence: "low"`
- `score_impact: 0`
- tool registration location
- fix suggestion with a concise description template

## Cross-Cutting Contract

Every finding also follows the Section 3 canonical contract: include
`effective_severity`, v0.x `severity`, relative location, suppression fields
with mandatory reason when suppressed, `raw_score_impact: 0`, and rule-specific
fields only under `metadata`. Fingerprints use the normalized description string
or stable tool registration span. SARIF output maps LOW confidence, subtype,
base/effective severity, suppression state, fingerprint, fix suggestion, and
description metadata into `properties`. This rule is advisory only and must not
change `raw_score` or `effective_score` in v0.

## Fixtures Required

- Positive: missing description
- Positive: too short
- Positive: unfilled template
- Positive: injection-shaped substring
- Positive: domain mismatch
- Negative: well-written description
- Golden output: advisory section with zero score impact

## Public/Private Boundary

Public export may keep generic prose heuristics and synthetic examples. Private
copy-paste evidence must be scrubbed unless approved.

## Public Export Sections

### Rule Intent

Surface objective low-quality description patterns as advisory, zero-score
findings.

### User Scenario

A maintainer wants optional guidance for unclear tool descriptions without
changing the v0 trust score.

### Functional Requirements

Report LOW-confidence advisory findings only, keep `score_impact: 0`, and keep
domain mismatch or copy-paste checks heuristic.

### Safe Patterns

Clear, specific descriptions that explain tool behavior, inputs, and side
effects are safe from this advisory rule.

### Edge Cases

Non-English descriptions, generated descriptions, repeated tool names, template
tokens, and injection-shaped text require LOW confidence only.

### Fixture Expectations

Fixtures cover missing, too short, placeholder, injection-shaped, domain
mismatch, and well-written negative cases.

### Acceptance Criteria

Findings appear only in advisory output, preserve zero score impact, and do not
affect raw or effective score.

### Success Criteria

Maintainers receive useful prose feedback without converting subjective quality
into a badge penalty.
