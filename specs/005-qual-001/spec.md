<!--
Public-safe spec generated from private SpecKit output.
Do not add raw prompts, private paths, or undisclosed vulnerability evidence.
Source path intentionally omitted from public output.
-->

---
rule_id: MCP-QUAL-001
severity: high
confidence: high
phase: v0-alpha
---

# Feature Spec: MCP-QUAL-001 Hard Schema Checks

Feature slug: `005-qual-001`  
Source section: Section 2.8  
Phase: v0-alpha  
Generation mode: manual SpecKit-style artifact, private workspace only

## Summary

Detect hard, objective defects in MCP tool input schemas. Subjective description
quality and broad prose concerns belong to `MCP-QUAL-003`, not this rule.

## Rule Contract

- Rule ID: `MCP-QUAL-001`
- Base severity: High for hard defects; Medium for parameterless strictness
  recommendation
- Confidence: HIGH for hard defects; MEDIUM for parameterless strictness
- Languages: TypeScript Zod and Python Pydantic / MCP schema types
- Detection: AST parse of input schema plus handler field use

## Subtypes

- `missing_schema`
- `unconstrained_object`
- `no_required`
- `url_as_string`
- `parameterless_tool_accepts_any_object`

## What The Rule Looks For

Emit a finding when:

- a tool registration omits input schema
- schema is an unconstrained object while the handler reads arguments
- schema declares properties but no required fields while handler dereferences
  those fields
- URL-shaped field is plain string rather than URL/URI validator
- parameterless tool accepts any object instead of strict empty object

## Safe Patterns

Do not flag:

- tools with explicit properties and required fields matching handler usage
- URL fields with URL validators or documented custom URI validators
- parameterless tools with strict empty-object schema
- generated schemas traced one level to equivalent safe shape

## Finding Shape

Findings use:

- `rule_id: "MCP-QUAL-001"`
- subtype
- severity and confidence per subtype
- schema-definition location
- `tool_name`
- fix suggestion with Zod or Pydantic correction

## Cross-Cutting Contract

Every finding also follows the Section 3 canonical contract: include
`effective_severity`, v0.x `severity`, relative location, suppression fields
with mandatory reason when suppressed, `score_impact`, `raw_score_impact`, and
rule-specific schema context under `metadata`. Fingerprints use the normalized
schema definition or the tool registration span for missing-schema cases. SARIF
output maps confidence, subtype, base/effective severity, suppression state,
fingerprint, fix suggestion, and schema metadata into `properties`.

## Fixtures Required

- Positive: missing schema
- Positive: unconstrained object
- Positive: no required fields
- Positive: URL as plain string
- Positive: parameterless open object
- Negative: strict empty parameterless schema
- Negative: URL validator present
- Golden output: subtype-specific severity and confidence

## Public/Private Boundary

Public export may keep generic schema defects and synthetic examples. Private
corpus provenance and undisclosed evidence must be scrubbed.

## Public Export Sections

### Rule Intent

Detect hard, objective defects in MCP tool input schemas.

### User Scenario

A maintainer wants schema findings that are reproducible and not based on
subjective prose quality.

### Functional Requirements

Flag missing schemas, unconstrained objects, missing required fields, URL fields
typed as plain strings, and parameterless tools accepting open objects.

### Safe Patterns

Explicit required fields, URL validators, strict empty schemas, and traceable
generated schemas with equivalent safety are accepted.

### Edge Cases

Generated schemas, handler dereferences, optional fields, and parameterless
tools require deterministic subtype handling.

### Fixture Expectations

Fixtures cover every subtype, strict empty schema negatives, URL validator
negatives, and subtype-specific severity/confidence golden outputs.

### Acceptance Criteria

Findings include subtype, schema location, tool name, fix suggestion,
fingerprint, and score impact.

### Success Criteria

The rule improves tool input contracts while leaving subjective description
quality to `MCP-QUAL-003`.
