<!--
Public-safe spec generated from private SpecKit output.
Do not add raw prompts, private paths, or undisclosed vulnerability evidence.
Source path intentionally omitted from public output.
-->

---
rule_id: MCP-SEC-003a
severity: high
confidence: high
phase: v0-alpha
---

# Feature Spec: MCP-SEC-003a HTTP Non-Loopback Bind

Feature slug: `001-sec-003a`  
Source section: Section 2.1  
Phase: v0-alpha  
Generation mode: manual SpecKit-style artifact, private workspace only

## Summary

Detect MCP HTTP transports that bind to a non-loopback network interface by
default. This covers Streamable HTTP and legacy HTTP+SSE compatibility patterns.

## Rule Contract

- Rule ID: `MCP-SEC-003a`
- Base severity: High
- Default confidence: HIGH for literal/framework-default exposure; MEDIUM for
  unresolved dynamic host/default cases
- Languages: TypeScript and Python
- Detection: static string scan, AST traversal, and a small framework-default
  table

## What The Rule Looks For

For TypeScript, detect HTTP server or MCP HTTP transport bind expressions using:

- `"0.0.0.0"`
- `"*"`
- `"::"`
- empty string
- omitted or undefined host only when a known framework default is non-loopback

For Python, detect equivalent patterns in `uvicorn.run`, FastAPI/Starlette
wrappers, `http.server`, and FastMCP HTTP transport setup.

## Confidence Rules

Emit HIGH when:

- a literal non-loopback bind exists, or
- a known framework default is non-loopback and host is omitted.

Emit MEDIUM when:

- host comes from env/config and no default can be resolved, or
- a wrapper makes the default uncertain.

Do not assume every omitted host is unsafe.

## Safe Patterns

Do not flag:

- explicit `127.0.0.1`, `localhost`, or `::1`
- config defaults documented as loopback
- env-host values with a visible loopback fallback
- stdio-only servers

## Finding Shape

Findings use:

- `rule_id: "MCP-SEC-003a"`
- `base_severity: "high"`
- `effective_severity`
- `confidence: "high" | "medium"`
- location of the bind expression
- stable fingerprint over rule ID, file, and normalized bind expression
- fix suggestion showing loopback bind and pointing intentional exposure toward
  explicit auth and documentation

## Cross-Cutting Contract

Every finding also follows the Section 3 canonical contract: include
`effective_severity`, v0.x `severity`, relative location, suppression fields
with mandatory reason when suppressed, `score_impact`, `raw_score_impact`, and
rule-specific fields only under `metadata`. Fingerprints use the normalized bind
expression with the non-AST fallback when needed. SARIF output maps confidence,
subtype, base/effective severity, suppression state, fingerprint, fix
suggestion, and metadata into `properties`.

## Fixtures Required

- Positive: literal `0.0.0.0`, `::`, omitted host with non-loopback default
- Negative: `127.0.0.1`, `localhost`, `::1`, stdio-only
- Synthetic: minimal TS and Python bind examples
- Golden output: HIGH literal case and MEDIUM dynamic case

## Public/Private Boundary

Real-world corpus evidence stays private until disclosure and fixture provenance
allow publication. Public export must remove undisclosed repository-specific
evidence and exact file/line details.

## Public Export Sections

### Rule Intent

Detect MCP HTTP servers that bind to non-loopback interfaces by default.

### User Scenario

A maintainer wants a local or CI signal when a server is reachable beyond
loopback without an intentional exposure decision.

### Functional Requirements

Flag literal non-loopback binds at HIGH confidence, downgrade unresolved dynamic
host/default cases to MEDIUM, and keep TypeScript/Python analysis static.

### Safe Patterns

Loopback-only binds, stdio-only servers, and explicitly documented intentional
exposure with appropriate auth are safe patterns.

### Edge Cases

Framework default hosts, omitted host arguments, IPv6 wildcard binds, and
dynamic host variables require explicit confidence handling.

### Fixture Expectations

Fixtures cover literal wildcard binds, loopback negatives, stdio-only negatives,
framework-default cases, and dynamic-host downgrade behavior.

### Acceptance Criteria

The rule reports stable findings with correct rule ID, severity, confidence,
fingerprint, suppression handling, and score impact.

### Success Criteria

Public output explains the exposure risk and gives maintainers a loopback-first
fix without implying certification.
