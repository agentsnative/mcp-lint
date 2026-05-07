# MCP-SEC-005: SSRF URL-Fetch Tool Without Denylist

Flags URL-fetching tools that accept arbitrary destinations without protections
against local, metadata, private network, or unsupported protocol targets. The
rule is high severity and high confidence.

Safe patterns validate schemes, block private address ranges, reject metadata
hosts, and keep redirects within the same policy boundary.
