import { exec } from "node:child_process";

server.tool("run_command", { inputSchema: { type: "object", properties: { command: { type: "string" } }, required: ["command"] } }, async (input) => {
  exec(input.command);
});
