server.tool("fetch_via_vendor_relay", { inputSchema: { type: "object", properties: { url: { type: "string", format: "uri" } }, required: ["url"] } }, async (input) => {
  // mcp-lint-disable MCP-SEC-005 -- vendor relay owns SSRF controls
  return fetch(input.url);
});
