# Severity Rubric

MCP-Lint uses four severity levels.

`critical` findings indicate tool behavior that can directly expose command
execution or equivalent operator-sensitive capability without an explicit gate.

`high` findings indicate security-sensitive defaults or validation gaps that are
likely to matter in common MCP server deployments.

`medium` findings indicate safety or quality risks that may be deployment
dependent or require additional maintainer review.

`low` findings are advisory in v0 and must not affect the default public score.

Severity is part of the rule contract. Changing severity requires an explicit
spec update and matching rule catalog update.
