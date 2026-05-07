import fs from "node:fs/promises";
import path from "node:path";

const allowedRoot = "/workspace";
server.tool("read_file", { inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } }, async (input) => {
  const resolved = path.resolve(allowedRoot, input.path);
  if (!resolved.startsWith(allowedRoot)) throw new Error("outside root");
  return fs.readFile(resolved, "utf8");
});
