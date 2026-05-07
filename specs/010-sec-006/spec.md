<!--
Public-safe spec.
Do not add raw prompts, private paths, or undisclosed vulnerability evidence.
-->

---
rule_id: MCP-SEC-006
severity: high
confidence: high
phase: Week-2 / v0.1 deferred
---

# Feature Spec: MCP-SEC-006 HTTP Origin Validation Missing

Feature slug: `010-sec-006`  
Phase: Week-2 / v0.1 deferred  

## Summary

Detect MCP HTTP transports that lack visible Origin header validation. This
protects local and network-exposed HTTP MCP servers from browser-origin and
DNS-rebinding style attack paths.

## Rule Contract

- Rule ID: `MCP-SEC-006`
- Base severity: High
- Confidence: HIGH when HTTP MCP endpoint exists and no Origin validation is
  visible; MEDIUM for dynamic middleware uncertainty
- Languages: TypeScript and Python
- Detection: static AST plus middleware/header-check presence

## What The Rule Looks For

For Streamable HTTP and legacy HTTP+SSE MCP routes, inspect the request path for
Origin validation before tool execution:

- TypeScript Express/Fastify/Node middleware checking `Origin`
- concrete CORS allowlist middleware
- custom guard naming related to origin, CORS, CSRF, or rebinding
- Python FastAPI/Starlette middleware or dependency with equivalent behavior

## Safe Patterns

Safe when one is visible:

- explicit allowlist of trusted origins
- strict localhost-only origin policy
- CORS middleware configured with concrete origins, not wildcard
- custom middleware comparing request Origin before MCP route execution

Not safe:

- wildcard CORS on MCP routes
- logging Origin without enforcement
- tool-handler-only Origin checks
- relying only on localhost bind

## Finding Shape

Findings use:

- `rule_id: "MCP-SEC-006"`
- `base_severity: "high"`
- `confidence: "high" | "medium"`
- HTTP MCP route mount location
- related rules `MCP-SEC-003a` and `MCP-SEC-003b`
- fix suggestion with strict Origin allowlist middleware

## Cross-Cutting Contract

Every finding also follows the Section 3 canonical contract: include
`effective_severity`, v0.x `severity`, relative location, suppression fields
with mandatory reason when suppressed, `score_impact`, `raw_score_impact`, and
rule-specific fields only under `metadata`. Fingerprints use normalized HTTP MCP
route mount plus Origin validation evidence. SARIF output maps confidence,
subtype if added later, base/effective severity, suppression state, fingerprint,
fix suggestion, related rules, and Origin metadata into `properties`. This rule
is Week-2/v0.1 only and must not block v0-alpha.

## Fixtures Required

- Positive: Streamable HTTP route without Origin check
- Positive: legacy HTTP+SSE route with wildcard CORS
- Negative: concrete Origin allowlist
- Negative: stdio-only server
- Synthetic: auth exists but Origin validation missing

## Public/Private Boundary

Use synthetic fixtures for v0.1 until disclosure/provenance is ready. Public
export must distinguish CORS presence from enforced Origin validation.

## Public Export Sections

### Rule Intent

Detect MCP HTTP endpoints that lack visible Origin validation for browser-origin
and DNS-rebinding style protection.

### User Scenario

A maintainer wants to know when Streamable HTTP or legacy HTTP+SSE MCP routes
trust requests without checking the Origin header.

### Functional Requirements

Cover Streamable HTTP and legacy HTTP+SSE, require enforced Origin validation
for safety, and do not treat generic CORS presence as sufficient.

### Safe Patterns

Concrete Origin allowlists, strict localhost Origin policies, and custom guards
that compare the Origin header before MCP execution are safe.

### Edge Cases

Wildcard CORS, auth without Origin checks, tool-handler-only checks, and
localhost binds without Origin enforcement require explicit confidence handling.

### Fixture Expectations

Fixtures cover missing Origin checks, wildcard CORS, allowlist negatives,
stdio-only negatives, and auth-without-Origin synthetic cases.

### Acceptance Criteria

Findings include route metadata, related rules, confidence, fingerprint, and
strict Origin allowlist fix guidance.

### Success Criteria

The rule adds v0.1 HTTP hardening without blocking v0-alpha or confusing CORS
configuration with DNS-rebinding protection.
