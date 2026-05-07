import cors from "cors";
import express from "express";

const app = express();
app.use(cors({ origin: ["http://localhost:3000"] }));
app.post("/mcp", (req, res) => res.json({ ok: true }));
