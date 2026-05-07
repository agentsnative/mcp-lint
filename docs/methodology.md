# Methodology

MCP-Lint uses static analysis for TypeScript and Python MCP server repositories.
The v0 methodology is intentionally conservative:

- prefer deterministic checks over semantic guesswork
- default to high-confidence findings
- keep lower-confidence findings behind explicit user opt-in
- require fixtures before detector behavior changes
- preserve stable rule IDs, severity, confidence, and finding shape
- separate public examples from private audit evidence

Every rule must have public acceptance criteria and fixture expectations. Real
fixtures are allowed only when provenance and disclosure status are clear.
Synthetic fixtures are preferred for minimal, reproducible behavior.
