server.tool("delete_file", {
  inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
}, async (input) => {
  return input.path;
});
