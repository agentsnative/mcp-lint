<!--
Public-safe spec.
Do not add raw prompts, private paths, or undisclosed vulnerability evidence.
-->

---
rule_id: MCP-SEC-003b
severity: high
confidence: high
phase: v0-alpha
---

# Feature Spec: MCP-SEC-003b HTTP Transport Without Auth

Feature slug: `002-sec-003b`  
Phase: v0-alpha  

## Summary

Detect MCP HTTP transports that mount tool execution routes without visible
authentication middleware in the request path.

## Rule Contract

- Rule ID: `MCP-SEC-003b`
- Base severity: High
- Confidence: HIGH for obvious unprotected MCP routes; MEDIUM for uncertain
  routing; LOW for handler-local auth checks
- Languages: TypeScript and Python
- Detection: static AST plus middleware/request-path presence check

## What The Rule Looks For

For modules that construct an HTTP app/server and mount MCP routes, identify
whether at least one auth-like guard is applied before tool execution:

- Bearer token verification
- OAuth middleware
- API key header check
- JWT verification
- custom middleware or dependency matching auth/verify/guard/protect naming

For Python, include FastAPI Security dependencies, Starlette middleware, FastMCP
auth hooks, and equivalent decorators.

## Confidence Rules

Emit HIGH only when:

- an MCP HTTP route is mounted directly or through a traceable router,
- no auth-like middleware/import/dependency/header check is visible before the
  route, and
- the route is not health-only, metrics-only, or documentation-only.

Emit MEDIUM for dynamic or nested routing uncertainty. Emit LOW when auth is
visible only inside a tool handler.

## Safe Patterns

Do not flag:

- stdio-only servers
- HTTP servers with no MCP route
- parent-router auth protecting the MCP route
- Bearer/OAuth/JWT/API-key middleware in the request path

Query-parameter auth is not safe.

## Finding Shape

Findings use:

- `rule_id: "MCP-SEC-003b"`
- `base_severity: "high"`
- `confidence: "high" | "medium" | "low"`
- location of HTTP app/router mount
- related rule metadata for `MCP-SEC-003a`
- fix suggestion with framework-appropriate Bearer token middleware

## Cross-Cutting Contract

Every finding also follows the Section 3 canonical contract: include
`effective_severity`, v0.x `severity`, relative location, suppression fields
with mandatory reason when suppressed, `score_impact`, `raw_score_impact`, and
rule-specific fields only under `metadata`. Fingerprints use normalized route
mount and middleware path evidence. SARIF output maps confidence, subtype,
base/effective severity, suppression state, fingerprint, fix suggestion,
related rule metadata, and route metadata into `properties`.

## Fixtures Required

- Positive: MCP HTTP route with no auth
- Negative: stdio-only server
- Negative: health-only HTTP server
- Negative: parent-router auth before MCP route
- Synthetic: handler-local auth advisory case

## Public/Private Boundary

Generated evidence remains private. Public export must keep only generic route
patterns, safe examples, and disclosed examples.

## Public Export Sections

### Rule Intent

Detect MCP HTTP tool execution routes that lack visible auth-like middleware.

### User Scenario

A maintainer wants to know when HTTP MCP routes can execute tools without a
request-path authentication gate.

### Functional Requirements

Flag obvious no-auth MCP routes at HIGH confidence, downgrade uncertain nested
routing or handler-local auth cases, and ignore health-only HTTP endpoints.

### Safe Patterns

Bearer token, OAuth, API key, JWT, or equivalent custom middleware applied before
the MCP route is considered safe when statically visible.

### Edge Cases

Parent routers, nested middleware, handler-local checks, and stdio-only servers
must not create noisy HIGH-confidence findings.

### Fixture Expectations

Fixtures cover no-auth route positives, parent-router auth negatives,
health-only negatives, stdio-only negatives, and uncertain handler-auth cases.

### Acceptance Criteria

Findings include route location, confidence, fix guidance, stable fingerprint,
and SARIF metadata without private evidence.

### Success Criteria

Maintainers can identify the missing auth boundary and add a framework-specific
guard before tool execution.
