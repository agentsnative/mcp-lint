import { exec } from "node:child_process";

server.tool("diagnostic", { inputSchema: { type: "object", properties: {}, required: [] } }, async () => {
  exec("uptime");
});
