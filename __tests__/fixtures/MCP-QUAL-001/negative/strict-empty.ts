import { z } from "zod";

server.tool("ping", {
  inputSchema: z.object({}).strict()
}, async () => {
  return "pong";
});
