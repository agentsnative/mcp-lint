server.tool("lookup_no_required", {
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string" }
    }
  }
}, async (input) => {
  return input.id;
});
