# MCP-SEC-001: Shell / Eval / Exec Exposed Without Operator Gate

Flags MCP tools that expose shell, eval, subprocess, or equivalent execution
capabilities without an explicit operator gate. The rule is critical severity
and high confidence.

Safe patterns require explicit allowlists, confirmation gates, constrained
commands, or other maintainable controls before execution.
