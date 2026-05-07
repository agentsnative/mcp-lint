# MCP-Lint Agent Contract

Before editing behavior, read:

- `.specify/memory/constitution.md`
- `docs/artifact-governance.md`
- relevant `specs/**/spec.md`
- relevant `docs/rules/MCP-*.md`

Hard rules:

- Do not commit raw prompts, raw research notes, undisclosed vulnerability evidence, private paths, or private strategy notes.
- Public repo may contain scrubbed `specs/**/spec.md` and scrubbed `.specify/memory/constitution.md`.
- Public repo must not contain generated SpecKit `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `contracts/`, or `quickstart.md` by default.
- Public repo syncs must copy only already-scrubbed `specs/**/spec.md`; private SpecKit rewrite tooling is intentionally not included here.
- CI validates public specs with `scripts/specs/validate-public-specs.ts`; CI must not rewrite specs.
- Use fixture-first TDD for detector, rule, reporter, scoring, suppression, and config changes.
- Rule implementation changes require positive, negative, and synthetic fixture updates plus test assertions.
- Reporter changes require golden output checks where relevant.
- Do not change rule IDs, severity, confidence, or build order unless a spec change explicitly requires it.

Before finishing:

- Run `pnpm specs:check-public` for spec-sensitive work.
- Run `pnpm governance:check` for governance-sensitive work.
- Run `pnpm test` when code changes.
- Run `pnpm build` when CLI or package behavior changes.
