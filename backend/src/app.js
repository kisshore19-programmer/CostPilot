import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { summaryRouter } from "./routes/summary.routes.js";
import { simulateRouter } from "./routes/simulate.routes.js";
import { explainRouter } from "./routes/explain.routes.js";
import { tradeoffRouter } from "./routes/tradeoff.routes.js";
import { optimizeRouter } from "./routes/optimize.routes.js";
import { subsidiesRouter } from "./routes/subsidies.routes.js";
import { mapsRouter } from "./routes/maps.routes.js";
import { analysisRouter } from "./routes/analysis.routes.js";
import { wealthRouter } from "./routes/wealth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/analysis", analysisRouter); // New Unified Endpoint
app.use("/summary", summaryRouter);
app.use("/simulate", simulateRouter);

app.use("/explain", explainRouter);
app.use("/tradeoff", tradeoffRouter);
app.use("/optimize", optimizeRouter);
app.use("/subsidies", subsidiesRouter);
app.use("/maps", mapsRouter);
app.use("/wealth", wealthRouter);


const PORT = process.env.PORT || 3001;

// #region agent log
// Log startup attempt
try {
  const logPath = path.resolve(__dirname, '../../../.cursor/debug-9cfd23.log');
  const logEntry = JSON.stringify({ sessionId: '9cfd23', location: 'app.js:39', message: 'Backend attempting to start', data: { port: PORT, envPort: process.env.PORT, dirname: __dirname }, timestamp: Date.now(), runId: 'run1', hypothesisId: 'A,B' }) + '\n';
  fs.appendFileSync(logPath, logEntry);
} catch (e) {
  console.error('[DEBUG] Failed to write startup log', e);
}
// #endregion

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  // #region agent log
  console.log('[DEBUG] Backend server started', { port: PORT, envPort: process.env.PORT });
  try {
    const logPath = path.resolve(__dirname, '../../../.cursor/debug-9cfd23.log');
    const logEntry = JSON.stringify({ sessionId: '9cfd23', location: 'app.js:50', message: 'Backend server started successfully', data: { port: PORT, envPort: process.env.PORT }, timestamp: Date.now(), runId: 'run1', hypothesisId: 'A' }) + '\n';
    fs.appendFileSync(logPath, logEntry);
  } catch (e) {
    console.error('[DEBUG] Failed to write log file', e);
  }
  // #endregion
});

// Nodemon restart trigger
