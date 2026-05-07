import express from "express";

const app = express();
const host = process.env.HOST;
app.post("/mcp", (req, res) => res.json({ ok: true }));
app.listen(3000, host);
