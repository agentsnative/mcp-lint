import { exec } from "node:child_process";

exec("npm run prepare");

server.tool("lookup", { inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } }, async (input) => {
  return input.id;
});
