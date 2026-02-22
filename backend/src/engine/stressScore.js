import { RISK_BANDS, WEIGHTS } from "./constants.js";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Linear interpolation helper
function lerp(value, x1, x2, y1, y2) {
  if (value <= x1) return y1;
  if (value >= x2) return y2;
  return y1 + ((value - x1) / (x2 - x1)) * (y2 - y1);
}

function scoreExpenseRatio(r) {
  // 0.5 -> 10, 0.7 -> 30, 0.85 -> 60, 1.0 -> 85, 1.2 -> 100
  if (r <= 0.5) return lerp(r, 0, 0.5, 0, 10);
  if (r <= 0.7) return lerp(r, 0.5, 0.7, 10, 30);
  if (r <= 0.85) return lerp(r, 0.7, 0.85, 30, 60);
  if (r <= 1.0) return lerp(r, 0.85, 1.0, 60, 85);
  return lerp(r, 1.0, 1.2, 85, 100);
}

function scoreDebtRatio(r) {
  if (r <= 0.1) return lerp(r, 0, 0.1, 0, 10);
  if (r <= 0.2) return lerp(r, 0.1, 0.2, 10, 35);
  if (r <= 0.35) return lerp(r, 0.2, 0.35, 35, 70);
  return lerp(r, 0.35, 0.5, 70, 100);
}

function scoreBufferMonths(m) {
  // Higher buffer is better (lower score)
  if (m >= 6) return lerp(m, 6, 12, 10, 0);
  if (m >= 3) return lerp(m, 3, 6, 35, 10);
  if (m >= 1) return lerp(m, 1, 3, 70, 35);
  return lerp(m, 0, 1, 100, 70);
}

function riskLevelFromScore(score) {
  for (const b of RISK_BANDS) {
    if (score <= b.max) return b.level;
  }
  return "High";
}

function topPressureSources(inputs, totalExpenses) {
  if (totalExpenses <= 0) return [];
  const cats = [
    ["Rent", inputs.rentMonthly],
    ["Utilities", inputs.utilitiesMonthly],
    ["Transport", inputs.transportMonthly],
    ["Food", inputs.foodMonthly],
    ["Debt", inputs.debtMonthly],
    ["Subscriptions", inputs.subscriptionsMonthly]
  ];

  const shares = cats
    .map(([name, val]) => ({ name, share: val / totalExpenses }))
    .filter(x => x.share >= 0.05) // ignore <5%
    .sort((a, b) => b.share - a.share)
    .slice(0, 2)
    .map(x => x.name);

  return shares;
}

export function calculateStress(inputs) {
  const income = inputs.incomeMonthly ?? 0;

  const totalExpenses =
    (inputs.rentMonthly ?? 0) +
    (inputs.utilitiesMonthly ?? 0) +
    (inputs.transportMonthly ?? 0) +
    (inputs.foodMonthly ?? 0) +
    (inputs.debtMonthly ?? 0) +
    (inputs.subscriptionsMonthly ?? 0);

  const expenseRatio = income > 0 ? totalExpenses / income : 999;
  const debtRatio = income > 0 ? (inputs.debtMonthly ?? 0) / income : 999;
  const bufferMonths = totalExpenses > 0 ? (inputs.savingsBalance ?? 0) / totalExpenses : 12;

  const expenseSub = scoreExpenseRatio(expenseRatio);
  const debtSub = scoreDebtRatio(debtRatio);
  const bufferSub = scoreBufferMonths(bufferMonths);

  const raw =
    WEIGHTS.expense * expenseSub +
    WEIGHTS.buffer * bufferSub +
    WEIGHTS.debt * debtSub;

  const stressScore = Number(clamp(raw, 0, 100).toFixed(1));
  const riskLevel = riskLevelFromScore(stressScore);

  return {
    stressScore,
    riskLevel,
    expenseRatio: Number(expenseRatio.toFixed(3)),
    bufferMonths: Number(bufferMonths.toFixed(2)),
    debtRatio: Number(debtRatio.toFixed(3)),
    pressureSources: topPressureSources(inputs, totalExpenses)
  };
}
