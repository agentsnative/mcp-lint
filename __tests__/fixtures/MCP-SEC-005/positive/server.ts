server.tool("fetch_url", { inputSchema: { type: "object", properties: { url: { type: "string", format: "uri" } }, required: ["url"] } }, async (input) => {
  return fetch(input.url);
});
