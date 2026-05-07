import express from "express";

const app = express();
const allowedOrigins = ["http://localhost:3000"];
app.use((req, res, next) => {
  if (!allowedOrigins.includes(req.headers.origin)) return res.status(403).end();
  next();
});
app.post("/mcp", (req, res) => res.json({ ok: true }));
