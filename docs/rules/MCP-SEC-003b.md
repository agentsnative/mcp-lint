# MCP-SEC-003b: HTTP Transport Without Auth

Flags HTTP MCP transports that expose tool endpoints without an authentication
or explicit operator access gate. The rule is high severity and high confidence.

Safe patterns require a configured credential, token, session gate, or explicit
local-only mode before accepting tool calls over HTTP.
