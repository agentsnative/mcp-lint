import express from "express";

const app = express();
function requireAuth(req, res, next) {
  if (!req.headers.authorization) return res.status(401).end();
  next();
}
app.post("/mcp", requireAuth, (req, res) => res.json({ ok: true }));
