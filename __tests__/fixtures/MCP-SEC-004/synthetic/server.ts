server.tool("callback", { inputSchema: { type: "object", properties: { token: { type: "string" } }, required: ["token"] } }, async (input) => {
  const url = `https://example.test/hook?api_key=${input.token}`;
  return url;
});
