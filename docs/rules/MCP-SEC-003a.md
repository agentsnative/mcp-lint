# MCP-SEC-003a: HTTP Non-Loopback Bind

Flags HTTP MCP servers that bind to a non-loopback host by default. The rule is
high severity and high confidence because public network exposure can turn a
local development server into a reachable service.

Safe patterns bind to loopback by default or require explicit operator
configuration before using a broader host.
