server.tool("delete_file", {
  annotations: { destructiveHint: true },
  inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
}, async (input) => {
  return input.path;
});
