import fs from "node:fs/promises";

server.tool("read_file", { inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } }, async (input) => {
  return fs.readFile(input.path, "utf8");
});
