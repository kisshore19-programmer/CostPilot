import express from 'express';
import { calculateStress } from '../engine/stressScore.js';
import { optimize } from '../engine/optimizer.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const inputs = req.body; // Assume already normalized by frontend or add normalization here if needed

        // 1. Calculate base state
        const stressData = calculateStress(inputs);

        // 2. Generate recommendations
        const recommendations = await optimize(inputs, stressData);

        // 3. Calculate totals
        const totalSavings = recommendations.reduce((acc, curr) => acc + (curr.potentialSavings || 0), 0);

        res.json({
            base: stressData,
            recommendations,
            totalSavings
        });
    } catch (error) {
        console.error("Optimization error:", error);
        res.status(500).json({ error: "Failed to generate optimizations" });
    }
});

router.post('/travel', async (req, res) => {
    try {
        const { generateTravelOptimization } = await import('../services/gemini.service.js');
        const commuteData = req.body;
        const result = await generateTravelOptimization(commuteData);
        res.json(result);
    } catch (error) {
        console.error("Travel optimization error:", error);
        res.status(500).json({ error: error.message || "Failed to generate travel optimization" });
    }
});

router.post('/ev-comparison', async (req, res) => {
    try {
        const { generateEVComparison } = await import('../services/gemini.service.js');
        const vehicleData = req.body;
        const result = await generateEVComparison(vehicleData);
        res.json(result);
    } catch (error) {
        console.error("EV comparison error:", error);
        res.status(500).json({ error: error.message || "Failed to generate EV comparison" });
    }
});

router.post('/relocation', async (req, res) => {
    try {
        const { generateRelocationSuggestions } = await import('../services/gemini.service.js');
        const locationData = req.body;
        const result = await generateRelocationSuggestions(locationData);
        res.json(result);
    } catch (error) {
        console.error("Relocation suggestion error:", error);
        res.status(500).json({ error: error.message || "Failed to generate relocation suggestions" });
    }
});

router.post('/lifestyle', async (req, res) => {
    try {
        const { generateLifestyleSuggestions } = await import('../services/gemini.service.js');
        const lifestyleData = req.body;
        const result = await generateLifestyleSuggestions(lifestyleData);
        res.json(result);
    } catch (error) {
        console.error("Lifestyle suggestion error:", error);
        res.status(500).json({ error: error.message || "Failed to generate lifestyle suggestions" });
    }
});

export const optimizeRouter = router;
