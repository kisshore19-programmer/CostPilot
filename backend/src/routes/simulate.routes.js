import express from "express";
import { simulateScenario } from "../engine/simulation.js";
import { validateAndNormalizeMonthlyInputs } from "../engine/validate.js";

export const simulateRouter = express.Router();

simulateRouter.post("/", (req, res) => {
  const { base, changes } = req.body || {};
  if (!base || !changes) {
    return res.status(400).json({ error: "Body must include { base, changes }" });
  }

  const vb = validateAndNormalizeMonthlyInputs(base);
  if (!vb.ok) return res.status(400).json({ error: `base: ${vb.error}` });

  const merged = { ...vb.cleanInputs, ...changes };
  const va = validateAndNormalizeMonthlyInputs(merged);
  if (!va.ok) return res.status(400).json({ error: `changes: ${va.error}` });

  return res.json(simulateScenario(vb.cleanInputs, changes));
});
