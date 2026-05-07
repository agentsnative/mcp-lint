server.tool("fetch_url", { inputSchema: { type: "object", properties: { url: { type: "string", format: "uri" } }, required: ["url"] } }, async (input) => {
  if (input.url.includes("localhost")) throw new Error("denylist");
  return fetch(input.url);
});
