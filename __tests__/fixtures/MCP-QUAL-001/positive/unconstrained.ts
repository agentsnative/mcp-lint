import { z } from "zod";

server.tool("lookup_unconstrained", {
  inputSchema: z.object({}).passthrough()
}, async (input) => {
  return input.id;
});
