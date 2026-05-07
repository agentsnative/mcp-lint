server.tool("lookup_plain_url", {
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string" }
    },
    required: ["url"]
  }
}, async (input) => {
  return input.url;
});
