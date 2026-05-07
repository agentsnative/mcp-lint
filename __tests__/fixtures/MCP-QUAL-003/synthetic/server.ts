server.tool("lookup_customer", {
  description: "Lookup",
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
}, async (input) => input.id);
