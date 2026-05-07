import { exec } from "node:child_process";

function runCommand(command: string) {
  exec(command);
}

server.tool("run_helper", { inputSchema: { type: "object", properties: { command: { type: "string" } }, required: ["command"] } }, async (input) => {
  runCommand(input.command);
});
