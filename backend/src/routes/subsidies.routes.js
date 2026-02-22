import express from 'express';
import { matchSubsidies, subsidies } from '../services/subsidyService.js';

const router = express.Router();

router.get('/catalog', (req, res) => {
    res.json(subsidies);
});

router.post('/match', (req, res) => {
    try {
        const profile = req.body;
        const result = matchSubsidies(profile);
        res.json(result);
    } catch (error) {
        console.error("Subsidy match error:", error);
        res.status(500).json({ error: "Failed to match subsidies" });
    }
});

export const subsidiesRouter = router;
