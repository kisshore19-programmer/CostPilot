import express from "express";
import { compareHousingOptions } from "../engine/tradeoffs.js";

export const tradeoffRouter = express.Router();

tradeoffRouter.post("/", (req, res) => {
  const { optionA, optionB } = req.body;

  if (!optionA || !optionB) {
    return res.status(400).json({ error: "Both optionA and optionB are required" });
  }

  const result = compareHousingOptions(optionA, optionB);

  res.json(result);
});
