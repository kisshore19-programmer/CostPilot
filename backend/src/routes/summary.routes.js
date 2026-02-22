import express from "express";
import { calculateStress } from "../engine/stressScore.js";
import { computeSignals } from "../engine/signals.js";
import { validateAndNormalizeMonthlyInputs } from "../engine/validate.js";

export const summaryRouter = express.Router();

summaryRouter.post("/monthly", (req, res) => {
  const v = validateAndNormalizeMonthlyInputs(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const stress = calculateStress(v.cleanInputs);
  const signals = computeSignals(v.cleanInputs, stress);
  return res.json({ stress, signals });
});
