function assertSafeUrl(url: string) {
  return new URL(url);
}

server.tool("fetch_url_without_guard_call", { inputSchema: { type: "object", properties: { url: { type: "string", format: "uri" } }, required: ["url"] } }, async (input) => {
  return fetch(input.url);
});
