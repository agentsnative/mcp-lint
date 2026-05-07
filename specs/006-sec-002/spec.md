<!--
Public-safe spec.
Do not add raw prompts, private paths, or undisclosed vulnerability evidence.
-->

---
rule_id: MCP-SEC-002
severity: high
confidence: medium
phase: Week-2 / v0.1 deferred
---

# Feature Spec: MCP-SEC-002 Path Traversal in File Tools

Feature slug: `006-sec-002`  
Phase: Week-2 / v0.1 deferred  

## Summary

Detect MCP file tools that accept agent-controlled paths and reach file-system
APIs without a visible containment check. This rule is deferred out of Day-7
v0-alpha because file-path dataflow has higher false-positive risk.

## Rule Contract

- Rule ID: `MCP-SEC-002`
- Base severity: High
- Confidence: MEDIUM by default; LOW when a plausible but unproven guard exists
- Languages: TypeScript and Python
- Detection: data flow plus safe-pattern recognition

## What The Rule Looks For

Identify path-like inputs and trace them to file APIs:

- TypeScript `fs.*`, `fs.promises.*`, stream creators, sync variants
- Python `open`, `pathlib.Path(...).read_text/write_text`, `os.*`, `shutil.*`

Flag when no containment gate runs before the file operation.

## Containment Signals

Accept visible guards such as:

- TypeScript `path.resolve(allowedRoot, userPath).startsWith(allowedRoot)`
- SDK or local helper that gates execution
- Python `Path.resolve().is_relative_to(allowed)`
- Python `os.path.commonpath(...) == allowed`

Local helpers only downgrade or clear findings when the helper return value or
exception actually gates execution. No-op validators do not count.

## Finding Shape

Findings use:

- `rule_id: "MCP-SEC-002"`
- `base_severity: "high"`
- `confidence: "medium" | "low"`
- file API location
- `tool_name`
- `metadata.path_param_name`
- fix suggestion with containment helper

## Cross-Cutting Contract

Every finding also follows the Section 3 canonical contract: include
`effective_severity`, v0.x `severity`, relative location, suppression fields
with mandatory reason when suppressed, `score_impact`, `raw_score_impact`, and
rule-specific fields only under `metadata`. Fingerprints use normalized path
source-to-sink evidence. SARIF output maps confidence, subtype when present,
base/effective severity, suppression state, fingerprint, fix suggestion, and
path metadata into `properties`. This rule remains folded by default because it
is Week-2/v0.1 MEDIUM/LOW confidence work.

## Fixtures Required

- Positive: path input reaches file read without containment
- Positive: path input reaches write/delete without containment
- Positive: containment helper no-op does not gate execution
- Negative: realpath/commonpath containment
- Negative: resolved path gated by allowed root
- Synthetic: symlink limitation documented

## Public/Private Boundary

This rule remains private v0.1 planning. Public export must scrub undisclosed
real-world path evidence and exact locations.

## Public Export Sections

### Rule Intent

Detect path parameters that reach file APIs without containment under an
approved project-local root.

### User Scenario

A maintainer wants a folded Week-2 signal when file tools may read, write, or
delete paths outside the intended workspace.

### Functional Requirements

Report MEDIUM by default, require real containment guards for downgrades, and do
not treat no-op validators as safe.

### Safe Patterns

Safe patterns include `realpath`/`commonpath`, resolved-root containment, and
project-local helpers that actually gate file access.

### Edge Cases

Symlinks, path normalization order, helper wrappers, dynamic roots, and read vs
write/delete sinks require explicit limitations.

### Fixture Expectations

Fixtures cover read/write/delete positives, real containment negatives,
no-op-helper positives, and symlink limitation documentation.

### Acceptance Criteria

Findings include path parameter metadata, file API location, confidence,
fingerprint, and folded MEDIUM behavior.

### Success Criteria

The rule identifies likely path traversal risk without blocking v0-alpha or
claiming complete filesystem proof.
