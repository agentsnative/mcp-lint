import cors from "cors";
import express from "express";

const app = express();
app.use(cors({ origin: "*" }));
app.post("/mcp", (req, res) => res.json({ ok: true }));
