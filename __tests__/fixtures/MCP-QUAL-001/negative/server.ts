import { z } from "zod";

server.tool("lookup", {
  description: "Look up a URL after validating it as a URL input.",
  inputSchema: z.object({ url: z.string().url() }).strict()
}, async (input) => {
  return input.url;
});
