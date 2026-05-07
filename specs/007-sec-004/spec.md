<!--
Public-safe spec.
Do not add raw prompts, private paths, or undisclosed vulnerability evidence.
-->

---
rule_id: MCP-SEC-004
severity: high
confidence: medium
phase: Week-2 / v0.1 deferred
---

# Feature Spec: MCP-SEC-004 Secret Handling Hygiene

Feature slug: `007-sec-004`  
Phase: Week-2 / v0.1 deferred  

## Summary

Detect secret-handling mistakes in MCP servers using phased sub-detectors. The
first v0.1 implementation should prioritize high-precision sub-detectors before
broader secret heuristics.

## Rule Contract

- Rule ID: `MCP-SEC-004`
- Base severity: High except structured advisory may be Medium
- Confidence: HIGH, MEDIUM, or LOW by subtype
- Languages: TypeScript and Python
- Detection: independent sub-detectors

## Subtypes

Phase first:

- `query_param_secret`
- `direct_env_logging`

Later v0.1 expansion:

- `provider_pattern_hardcoded_secret`
- `generic_entropy_secret`
- `variable_name_logging_secret`
- `structured_object_logging_advisory`

## What The Rule Looks For

- Secret-shaped query parameters in URL literals and URL builders
- Direct logging of `process.env`, `os.environ`, or secret-shaped env values
- Provider token patterns in source, docs, examples, and config
- Generic entropy near secret-shaped variable names
- Logger arguments with secret-shaped variables
- Structured request/response/config logging as LOW advisory where specific
  secret fields are not visible

## Safe Patterns

Do not flag:

- redacted log values
- public-safe placeholders outside query-param-secret patterns when not
  provider-shaped
- test/fixture secrets with explicit suppression reason or downgraded fixture
  path handling

Secret values must be redacted before output, hashing, or debug logging.

## Finding Shape

Findings use:

- `rule_id: "MCP-SEC-004"`
- subtype
- severity and confidence per subtype
- `metadata.matched_pattern` without raw secret value
- tailored message and fix suggestion
- redacted fingerprint normalization

## Cross-Cutting Contract

Every finding also follows the Section 3 canonical contract: include
`effective_severity`, v0.x `severity`, relative location, suppression fields
with mandatory reason when suppressed, `score_impact`, `raw_score_impact`, and
rule-specific fields only under `metadata`. Fingerprints, debug output, and
SARIF properties must use redacted values only; raw secret values must never be
hash preimages or output text. SARIF output maps confidence, subtype,
base/effective severity, suppression state, fingerprint, fix suggestion,
matched-pattern metadata, and redaction status into `properties`.

## Fixtures Required

- Positive: query parameter API key
- Positive: direct env logging
- Positive: provider token pattern
- Negative: redacted logger call
- Synthetic: fixture/test downgrade
- Golden output: no raw secret appears in results or fingerprint preimage logs

## Public/Private Boundary

Secret values and exact private signatures must never be exported. Public specs
may include generic regex classes and redacted synthetic examples after scrub.

## Public Export Sections

### Rule Intent

Detect public-safe classes of secret hygiene problems without exposing raw secret
values.

### User Scenario

A maintainer wants redacted findings for query-parameter secrets, direct
environment logging, and phased hardcoded secret patterns.

### Functional Requirements

Phase query-parameter secret and direct env logging detectors first, redact all
secret values, and keep broader entropy heuristics deferred or lower confidence.

### Safe Patterns

Redacted logging, test fixture downgrades, and documented dummy values are safe
when deterministic evidence supports the classification.

### Edge Cases

Synthetic fixtures, test-only values, logger wrappers, and exact provider token
patterns require strict redaction and confidence handling.

### Fixture Expectations

Fixtures cover query parameter positives, env logging positives, redacted logger
negatives, test downgrade behavior, and golden output with no raw secret.

### Acceptance Criteria

Findings never include raw secrets in messages, metadata, fingerprints, SARIF,
or debug logs.

### Success Criteria

The rule improves secret hygiene while preserving responsible disclosure and
public-safe output.
