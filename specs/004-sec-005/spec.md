<!--
Public-safe spec generated from private SpecKit output.
Do not add raw prompts, private paths, or undisclosed vulnerability evidence.
Source path intentionally omitted from public output.
-->

---
rule_id: MCP-SEC-005
severity: high
confidence: high
phase: v0-alpha
---

# Feature Spec: MCP-SEC-005 SSRF URL Fetch Without Guard

Feature slug: `004-sec-005`  
Source section: Section 2.4  
Phase: v0-alpha  
Generation mode: manual SpecKit-style artifact, private workspace only

## Summary

Detect MCP tools that accept user-supplied URLs and fetch them without a visible
SSRF guard.

## Rule Contract

- Rule ID: `MCP-SEC-005`
- Base severity: High
- Confidence: HIGH for unguarded user-supplied URL fetch; MEDIUM for incomplete
  guard subtype
- Languages: TypeScript and Python
- Detection: data flow within tool body and one-hop guard recognition

## What The Rule Looks For

Identify tool input parameters likely to be URLs:

- names matching URL/URI/endpoint/webhook/callback/host
- schema formats such as `uri`, `url`, Zod `.url()`, or Pydantic `HttpUrl`

Trace those values into HTTP clients:

- TypeScript `fetch`, `axios`, `node-fetch`, `got`, `undici`, `http.get`,
  `https.get`, and legacy `request`
- Python `requests`, `httpx`, `urllib.request.urlopen`, and `aiohttp`

Flag when no visible guard runs before the fetch.

## Sufficient Guard Signals

Treat as safe when a guard is visible before fetch:

- function name matching safe URL / SSRF / allow URL validation intent
- positive host allowlist
- known SSRF protection library
- inline guard that parses URL, restricts schemes, resolves DNS, blocks private
  and loopback ranges, rechecks redirects, and limits timeout/size

Vendor relay suppression counts as safe only with a documented reason.

## Finding Shape

Findings use:

- `rule_id: "MCP-SEC-005"`
- optional subtype such as `incomplete_ssrf_guard`
- `base_severity: "high"`
- `confidence`
- fetch-call location
- `tool_name`
- `metadata.url_param_name`
- `metadata.required_blocks`
- fix suggestion with robust SSRF guard requirements

## Cross-Cutting Contract

Every finding also follows the Section 3 canonical contract: include
`effective_severity`, v0.x `severity`, relative location, suppression fields
with mandatory reason when suppressed, `score_impact`, `raw_score_impact`, and
rule-specific fields only under `metadata`. Fingerprints use normalized URL
source-to-sink evidence and must not include exploit-ready payloads. SARIF output
maps confidence, subtype, base/effective severity, suppression state,
fingerprint, fix suggestion, URL parameter metadata, and required-block metadata
into `properties`.

## Fixtures Required

- Positive: user URL to direct fetch
- Negative: allowlisted host guard
- Negative: vendor-handled suppression fixture
- Synthetic: incomplete guard downgrade
- Golden output: metadata includes URL parameter and required blocked ranges

## Public/Private Boundary

Public export must not include exploit-ready payloads or undisclosed exact
evidence. Generic SSRF patterns and synthetic fixtures are public-safe after scrub.

## Public Export Sections

### Rule Intent

Detect user-supplied URLs that reach fetch or HTTP client calls without a visible
SSRF guard.

### User Scenario

A maintainer wants to know when a tool can fetch arbitrary network locations
based on agent-provided input.

### Functional Requirements

Trace tool URL parameters to HTTP sinks, require robust guard evidence, and
downgrade incomplete or vendor-handled cases where appropriate.

### Safe Patterns

Safe guards parse the URL, allow schemes, resolve DNS, block private/loopback
and link-local ranges, re-check redirects, and set timeout/size limits.

### Edge Cases

String denylist-only guards, partial allowlists, redirect behavior, and
provider-managed clients require careful confidence assignment.

### Fixture Expectations

Fixtures cover direct fetch positives, complete guard negatives, vendor-handled
suppression, incomplete guard downgrades, and golden metadata output.

### Acceptance Criteria

Findings include URL parameter metadata, required-block guidance, suppression
behavior, fingerprint, and public-safe fix suggestions.

### Success Criteria

The public spec guides maintainers toward robust SSRF prevention without
publishing exploit-ready payloads.
