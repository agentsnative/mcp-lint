import { z } from "zod";

server.tool("ping", {
  inputSchema: z.object({}).passthrough()
}, async () => {
  return "pong";
});
