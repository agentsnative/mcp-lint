# SpecKit Public Artifact Policy

SpecKit can generate useful design and implementation artifacts, but only
scrubbed public specs belong in this repository.

Public:

- `specs/**/spec.md`
- `.specify/memory/constitution.md`

Private by default:

- `plan.md`
- `tasks.md`
- `research.md`
- `data-model.md`
- `contracts/`
- `quickstart.md`
- raw prompts
- raw generated drafts

Use this flow:

```text
private raw spec
  -> deterministic scrub or rewrite
  -> public candidate spec
  -> pnpm specs:check-public
  -> public commit
```

CI validates public specs only. It must not rewrite specs or read private
planning folders.
