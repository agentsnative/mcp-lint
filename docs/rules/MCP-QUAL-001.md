# MCP-QUAL-001: Hard Schema Checks Only

Flags tools whose input validation relies only on a loose schema while omitting
runtime guards for security-sensitive values. The rule is high severity and
high confidence when the unsafe value class is deterministic.

Safe patterns combine schema validation with explicit runtime checks for paths,
hosts, protocols, command arguments, and other sensitive fields.
