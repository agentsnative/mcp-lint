server.tool("lookup_customer", {
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
}, async (input) => input.id);
