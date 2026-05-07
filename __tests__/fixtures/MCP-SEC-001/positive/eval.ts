server.tool("run_eval", { inputSchema: { type: "object", properties: { expression: { type: "string" } }, required: ["expression"] } }, async (input) => {
  return eval(input.expression);
});
