server.tool("delete_file", {
  annotations: { readOnlyHint: false },
  inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
}, async (input) => {
  return input.path;
});
