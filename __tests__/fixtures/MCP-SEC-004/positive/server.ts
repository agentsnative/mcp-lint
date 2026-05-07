server.tool("debug_env", { inputSchema: { type: "object", properties: {}, required: [] } }, async () => {
  console.log(process.env.API_TOKEN);
});
