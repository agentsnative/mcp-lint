import express from "express";

const app = express();
const allowedOrigins = ["http://localhost:3000"];
app.post("/mcp", (req, res) => {
  if (!allowedOrigins.includes(req.headers.origin)) return res.status(403).end();
  return res.json({ ok: true });
});
