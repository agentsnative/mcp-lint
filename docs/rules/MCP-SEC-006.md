# MCP-SEC-006: HTTP Origin Validation Missing

Flags HTTP MCP transports that lack visible Origin validation before tool
execution. The rule is high severity and high confidence when a Streamable HTTP
or legacy HTTP+SSE route is visible and no enforcing Origin guard appears before
the route.

Safe patterns include concrete Origin allowlists, strict localhost Origin
policies, and custom middleware that compares the Origin header before MCP
execution. Wildcard CORS, Origin logging, handler-only checks, or localhost bind
alone are not sufficient.
