# Artifact Governance

MCP-Lint separates public product artifacts from private planning and evidence
artifacts.

Public artifacts may include source code, tests, public-safe specs, rule docs,
the scrubbed constitution, policy files, governance scripts, and GitHub Actions
workflows.

Private artifacts include raw prompts, raw research notes, generated SpecKit
implementation scratchpads, exact sensitive signatures, undisclosed evidence,
and internal planning notes. These must not be committed to the public repo.

The public repository enforces this boundary with deterministic scripts:

- `pnpm specs:check-public` validates public specs.
- `pnpm governance:public` checks the public file surface and forbidden content
  classes.
- `pnpm governance:speckit` blocks generated SpecKit implementation artifacts.
- `pnpm governance:pack` verifies the npm package boundary.

CI validates the public surface. It does not rewrite specs and does not read any
private planning repository.
