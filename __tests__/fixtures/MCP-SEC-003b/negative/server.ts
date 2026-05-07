import express from "express";

const app = express();
const router = express.Router();
function requireAuth(req, res, next) {
  if (!req.headers.authorization) return res.status(401).end();
  next();
}
router.post("/mcp", (req, res) => res.json({ tool: "ok" }));
app.use("/mcp", requireAuth, router);
