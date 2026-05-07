# MCP-Lint

MCP-Lint V0 is an experimental static lint signal for TypeScript and Python MCP server repositories.
It produces deterministic JSON, Markdown, SARIF, and README badge artifacts. It does not execute target
servers, does not certify security, and may produce false positives. Unsupported languages are not scored.

## What V0 scores

Public V0 scoring is intentionally narrow. By default, the public score only includes alpha scored rules:

```text
MCP-SEC-003a
MCP-SEC-003b
MCP-SEC-001
MCP-SEC-005
MCP-QUAL-001
```

Week-2 / v0.1 and lower-confidence rules still appear in reports as preview or advisory findings, but they
do not affect the public badge score unless scoring policy changes in a later release.

## Runtime-only default scope

The default scan mode is `runtime`: it ignores tests, fixtures, scripts, examples, build config, generated
files, type declarations, and common non-runtime app folders such as `ui/`, `frontend/`, `client/`, and `web/`.
Reports include `runtime_file_count`, `ignored_file_count`, and `ignored_files_by_reason` so coverage is explicit.

Use `--all-files` only for local investigation:

```bash
mcp-lint scan . --all-files
```

## CLI

```bash
mcp-lint rules
mcp-lint scan .
```

A normal evaluated scan writes:

```text
.mcp-lint/results.json
.mcp-lint/report.md
.mcp-lint/results.sarif
.mcp-lint/badge.txt
```

Unsupported or no-runtime repositories are reported as not evaluated instead of receiving a clean score:

```text
mcp-lint: not evaluated status=unsupported_language detected=go
```

## GitHub Action

```yaml
- uses: agentsnative/mcp-lint@v0
  with:
    path: .
```

The action executes the built CLI under `dist/cli.js`, so root `dist/**` is part of the public release surface.

## Repository governance

The repository includes public artifact policy, public-safe SpecKit validation, fixture-backed tests, and package
gates under `policy/`, `scripts/`, `specs/`, and `docs/`.

Useful commands:

```bash
pnpm specs:check-public
pnpm governance:check
pnpm verify
```

Public CI validates only public-safe artifacts. Raw prompts, private planning notes, generated implementation
scratchpads, local scan outputs, and undisclosed evidence must stay outside this repository.
