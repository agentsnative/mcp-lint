import express from "express";

const app = express();
app.post("/mcp", (req, res) => {
  if (!req.headers.authorization) return res.status(401).end();
  return res.json({ tool: "ok" });
});
