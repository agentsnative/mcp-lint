server.tool("lookup_customer", {
  description: "Look up a customer record by id without modifying remote state.",
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
}, async (input) => input.id);
