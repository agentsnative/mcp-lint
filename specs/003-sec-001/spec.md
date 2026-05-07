<!--
Public-safe spec generated from private SpecKit output.
Do not add raw prompts, private paths, or undisclosed vulnerability evidence.
Source path intentionally omitted from public output.
-->

---
rule_id: MCP-SEC-001
severity: critical
confidence: high
phase: v0-alpha
---

# Feature Spec: MCP-SEC-001 Shell / Eval / Exec Without Operator Gate

Feature slug: `003-sec-001`  
Source section: Section 2.3  
Phase: v0-alpha  
Generation mode: manual SpecKit-style artifact, private workspace only

## Summary

Detect MCP tools whose registered handler invokes shell, eval, or arbitrary code
execution APIs without an operator-controlled gate that the agent cannot satisfy
through ordinary tool arguments.

## Rule Contract

- Rule ID: `MCP-SEC-001`
- Base severity: Critical for shell/local arbitrary code execution; High or
  Critical for other subtypes depending on execution context
- Confidence: HIGH when untrusted tool input reaches a dangerous API; MEDIUM for
  constant-argument cases
- Languages: TypeScript and Python
- Detection: AST scan inside tool registration body plus one-level helper tracing

## Subtypes

- `shell_exec`
- `language_eval`
- `vm_eval`
- `browser_context_eval`
- `unsafe_deserialization`

## What The Rule Looks For

Within MCP tool registration handlers, detect:

- TypeScript `eval`, `new Function`, `child_process.exec/execSync`,
  `spawn` or `spawnSync` with `shell: true`, and `vm.*` execution calls
- Python `eval`, `exec`, `subprocess.*` with `shell=True`, `os.system`,
  `os.popen`, `compile` followed by `exec`, and `pickle.loads`
- one-hop helper functions that wrap those APIs

## Operator Gate Rules

Do not flag when a trusted operator-controlled gate is visible before the
dangerous call:

- env or CLI/config flag that defaults to false
- allowlist of safe commands
- host-side approval outside ordinary tool input

Do not treat an agent-controllable input such as `confirm: true` as a gate.

## Finding Shape

Findings use:

- `rule_id: "MCP-SEC-001"`
- subtype
- `base_severity`
- `effective_severity`
- `confidence`
- `tool_name`
- `metadata.execution_context`
- `metadata.escalation_reason` when severity escalates
- stable fingerprint over rule, subtype, file, and normalized dangerous call

## Cross-Cutting Contract

Every finding also follows the Section 3 canonical contract: include v0.x
`severity` as an alias for `effective_severity`, relative location, suppression
fields with mandatory reason when suppressed, `score_impact`,
`raw_score_impact`, and rule-specific context only under `metadata`.
Fingerprints use the normalized dangerous call or helper definition plus subtype.
SARIF output maps confidence, subtype, base/effective severity, suppression
state, fingerprint, fix suggestion, execution context, and escalation metadata
into `properties`.

## Fixtures Required

- Positive: tool input reaches shell execution
- Positive: language eval in tool handler
- Positive: helper function one-hop to dangerous API
- Negative: operator env/config gate before call
- Negative: startup script outside tool body
- Negative: sandboxed workbook formula evaluation
- Synthetic: constant-argument downgrade case

## Public/Private Boundary

Private regression evidence must not be exported until disclosure/provenance is
ready. Public specs may describe generic dangerous APIs and safe gate patterns.

## Public Export Sections

### Rule Intent

Detect shell, eval, VM, browser-context evaluation, and unsafe deserialization
from MCP tool handlers without an operator-controlled gate.

### User Scenario

A maintainer wants a high-confidence warning when agent-controllable input can
reach dangerous local execution APIs.

### Functional Requirements

Flag dangerous APIs inside tool handlers and one-hop helpers, reject
agent-controllable `confirm:true` as a gate, and downgrade constant-argument
cases where direct agent control is absent.

### Safe Patterns

Operator-controlled environment/config gates, explicit out-of-band approval, and
non-tool startup scripts are safe or out of scope when statically visible.

### Edge Cases

Helper wrappers, constant dangerous arguments, sandboxed evaluation, and
non-handler execution paths require subtype-specific confidence handling.

### Fixture Expectations

Fixtures cover shell execution, language eval, VM eval, browser eval, unsafe
deserialization, helper tracing, operator-gate negatives, and constant-argument
downgrades.

### Acceptance Criteria

Findings preserve subtype, severity, confidence, fingerprint, fix suggestion,
and raw/effective score behavior.

### Success Criteria

The rule helps maintainers add operator gates without overstating safe startup
or sandboxed code paths.
