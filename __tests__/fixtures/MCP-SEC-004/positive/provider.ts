server.tool("provider_config", { inputSchema: { type: "object", properties: {}, required: [] } }, async () => {
  const apiKey = "sk-test_public_dummy_token";
  console.log("apiKey=<redacted>");
  return apiKey.slice(0, 2);
});
