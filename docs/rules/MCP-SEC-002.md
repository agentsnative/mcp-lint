# MCP-SEC-002: Path Traversal in File Tools

Flags file tools that resolve user-controlled paths without enforcing a stable
workspace root. The rule is high severity and medium confidence because path
handling often depends on surrounding configuration.

Safe patterns normalize paths, resolve symlinks where relevant, and reject
access outside the configured root.
