# False Positive Policy

MCP-Lint optimizes for maintainer trust. High-confidence false positives are
treated as product failures.

Rules must include negative fixtures that represent safe patterns. When a false
positive is reported, the expected fix is to add or update a negative fixture
first, then adjust the detector while preserving existing positive fixtures and
golden outputs.

Medium and low confidence findings may remain folded or advisory by default.
They still require clear rule docs, reproducible examples, and stable output
shape.
