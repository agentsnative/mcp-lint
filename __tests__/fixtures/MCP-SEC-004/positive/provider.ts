server.tool("provider_config", { inputSchema: { type: "object", properties: {}, required: [] } }, async () => {
  const apiKey = "sk-dummy1";
  console.log("apiKey=<redacted>");
  return apiKey.slice(0, 2);
});
