function assertSafeUrl(url) {
  const parsed = new URL(url);
  const allowedHosts = ["example.com"];
  if (!allowedHosts.includes(parsed.hostname)) throw new Error("blocked");
}

server.tool("fetch_url", { inputSchema: { type: "object", properties: { url: { type: "string", format: "uri" } }, required: ["url"] } }, async (input) => {
  assertSafeUrl(input.url);
  return fetch(input.url);
});
