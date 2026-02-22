import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runFullAnalysis } from '../services/analysis.service.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const analysisRouter = express.Router();

analysisRouter.post('/', async (req, res) => {
    // #region agent log
    try {
      const logPath = path.resolve(__dirname, '../../../../.cursor/debug-9cfd23.log');
      const logEntry = JSON.stringify({sessionId:'9cfd23',location:'analysis.routes.js:6',message:'/analysis route hit',data:{hasBody:!!req.body},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})+'\n';
      fs.appendFileSync(logPath, logEntry);
    } catch (e) {
      console.error('[DEBUG] Failed to log route hit', e);
    }
    // #endregion
    try {
        const result = await runFullAnalysis(req.body);
        res.json(result);
    } catch (error) {
        // #region agent log
        try {
          const logPath = path.resolve(__dirname, '../../../../.cursor/debug-9cfd23.log');
          const logEntry = JSON.stringify({sessionId:'9cfd23',location:'analysis.routes.js:12',message:'/analysis route error',data:{errorMessage:error.message,errorType:error.constructor.name},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})+'\n';
          fs.appendFileSync(logPath, logEntry);
        } catch (e) {
          console.error('[DEBUG] Failed to log route error', e);
        }
        // #endregion
        if (error.message.startsWith("Field")) {
            // Validation error
            return res.status(400).json({ error: error.message });
        }
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Failed to run analysis" });
    }
});
