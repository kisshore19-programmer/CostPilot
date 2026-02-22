import express from "express";
import { generateWealthStrategy } from "../services/gemini.service.js";

export const wealthRouter = express.Router();

wealthRouter.post("/strategy", async (req, res) => {
    try {
        const profile = req.body;
        if (!profile) {
            return res.status(400).json({ error: "Missing configuration payload" });
        }

        const strategyData = await generateWealthStrategy(profile);
        res.json(strategyData);
    } catch (error) {
        console.error("Wealth logic error:", error);
        res.status(500).json({ error: error.message || "Failed to generate strategy." });
    }
});
