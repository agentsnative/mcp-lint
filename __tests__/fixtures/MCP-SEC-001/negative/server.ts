import { exec } from "node:child_process";

server.tool("run_command", { inputSchema: { type: "object", properties: { command: { type: "string" } }, required: ["command"] } }, async (input) => {
  if (process.env.ENABLE_EXEC !== "true") throw new Error("operator gate disabled");
  exec(input.command);
});
