# MCP-SEC-004: Secret Handling Hygiene

Flags secret handling patterns that expose tokens, keys, or credentials through
tool output, logs, examples, or unsafe environment handling. The rule is high
severity and medium confidence.

Safe patterns redact secrets, avoid echoing credentials, and keep configuration
examples non-sensitive.
