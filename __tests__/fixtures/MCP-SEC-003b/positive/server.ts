import express from "express";

const app = express();
app.post("/mcp", (req, res) => res.json({ tool: "ok" }));
