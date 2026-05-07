<!--
Public-safe spec generated from private SpecKit output.
Do not add raw prompts, private paths, or undisclosed vulnerability evidence.
Source path intentionally omitted from public output.
-->

---
rule_id: MCP-QUAL-002
severity: medium
confidence: medium
phase: Week-2 / v0.1 deferred
---

# Feature Spec: MCP-QUAL-002 Destructive Tool Missing Safety Metadata

Feature slug: `008-qual-002`  
Source section: Section 2.6  
Phase: Week-2 / v0.1 deferred  
Generation mode: manual SpecKit-style artifact, private workspace only

## Summary

Detect tools that appear mutating or destructive but lack explicit MCP safety
metadata or a safe-by-default preview path. This is a metadata and client UX
quality rule, not a claim that annotations are a security boundary.

## Rule Contract

- Rule ID: `MCP-QUAL-002`
- Base severity: Medium
- Confidence: MEDIUM
- Languages: TypeScript and Python
- Detection: two-of-two heuristic over tool name and schema shape

## What The Rule Looks For

Emit a finding only when both are true:

1. Tool name starts with a mutating verb such as delete, remove, send, create,
   update, write, execute, invoke, run, or similar.
2. Input schema contains at least one field that looks like a mutation target,
   such as id, target, recipient, URL, path, file, key, or name.

Then check for meaningful safety signals.

## Meaningful Safety Signals

Treat as safe when at least one is present:

- explicit `destructiveHint`
- relevant `idempotentHint` or `openWorldHint`
- `readOnlyHint: true` for read-only behavior
- `dry_run` or `preview` defaulting to true
- trusted out-of-band operator approval outside ordinary tool input

Do not treat `readOnlyHint: false` alone as sufficient metadata.

## Finding Shape

Findings use:

- `rule_id: "MCP-QUAL-002"`
- `base_severity: "medium"`
- `confidence: "medium"`
- tool registration location
- `tool_name`
- `metadata.matched_verb`
- `metadata.matched_field`
- fix suggestion with annotations and safe-by-default preview

## Cross-Cutting Contract

Every finding also follows the Section 3 canonical contract: include
`effective_severity`, v0.x `severity`, relative location, suppression fields
with mandatory reason when suppressed, `score_impact`, `raw_score_impact`, and
rule-specific fields only under `metadata`. Fingerprints use normalized tool
registration plus matched verb/field evidence. SARIF output maps confidence,
subtype if added later, base/effective severity, suppression state, fingerprint,
fix suggestion, matched verb, and matched field into `properties`. This rule is
Week-2/v0.1 only and remains folded by default.

## Fixtures Required

- Positive: mutating verb plus target field without metadata
- Negative: create-report style read-only schema
- Negative: destructive hint present
- Negative: preview defaults true
- Synthetic: `readOnlyHint: false` alone still flags

## Public/Private Boundary

Public export may keep generic metadata guidance. Private corpus evidence and
undisclosed tool names must be scrubbed unless publication is approved.

## Public Export Sections

### Rule Intent

Detect destructive tool operations that lack visible safety metadata or safe
preview defaults.

### User Scenario

A maintainer wants a Week-2 quality signal when mutating tools are not clearly
marked or safely gated.

### Functional Requirements

Treat annotations as hints, require two-signal evidence for findings, and do not
treat `readOnlyHint:false` alone as sufficient safety metadata.

### Safe Patterns

Safe patterns include explicit destructive/idempotent/openWorld hints, preview
or dry-run default true, or trusted operator approval outside the agent path.

### Edge Cases

Ambiguous verbs, report-generation tools, schema field names, and partial
annotations require conservative confidence.

### Fixture Expectations

Fixtures cover mutating verbs plus target fields, read-only report negatives,
destructive hint negatives, preview default negatives, and `readOnlyHint:false`
positives.

### Acceptance Criteria

Findings include matched verb/field metadata, confidence, fingerprint, and safe
fix guidance.

### Success Criteria

The rule nudges maintainers toward clear destructive safety metadata without
treating annotations as hard security guarantees.
