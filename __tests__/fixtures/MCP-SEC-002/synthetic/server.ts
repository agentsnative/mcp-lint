import fs from "node:fs/promises";

function validatePath(path) {
  return Boolean(path);
}

server.tool("read_file", { inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } }, async (input) => {
  validatePath(input.path);
  return fs.readFile(input.path, "utf8");
});
