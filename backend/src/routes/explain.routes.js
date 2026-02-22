import express from "express";
import { explainWithGemini } from "../engine/geminiExplain.js";

export const explainRouter = express.Router();

explainRouter.post("/", async (req, res) => {
  const { type, facts } = req.body || {};
  if (!type || typeof type !== "string") return res.status(400).json({ error: "Missing 'type'" });
  if (!facts || typeof facts !== "object") return res.status(400).json({ error: "Missing 'facts' object" });

  const out = await explainWithGemini(type, facts);
  return res.json(out);
});
