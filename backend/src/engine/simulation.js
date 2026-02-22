import { calculateStress } from "./stressScore.js";

function totalExpenses(i) {
  return (i.rentMonthly ?? 0) +
    (i.utilitiesMonthly ?? 0) +
    (i.transportMonthly ?? 0) +
    (i.foodMonthly ?? 0) +
    (i.debtMonthly ?? 0) +
    (i.subscriptionsMonthly ?? 0);
}

function monthlyBalance(i) {
  return (i.incomeMonthly ?? 0) - totalExpenses(i);
}

function survivalMonths(i) {
  const bal = monthlyBalance(i);
  if (bal >= 0) return 999; // effectively safe
  const burn = -bal;
  const savings = i.savingsBalance ?? 0;
  return burn > 0 ? savings / burn : 999;
}

export function simulateScenario(base, changes) {
  const afterInputs = { ...base, ...changes };

  const baseStress = calculateStress(base);
  const afterStress = calculateStress(afterInputs);

  const baseBal = monthlyBalance(base);
  const afterBal = monthlyBalance(afterInputs);

  return {
    base: baseStress,
    after: afterStress,
    delta: {
      stressScore: Number((afterStress.stressScore - baseStress.stressScore).toFixed(2)),
      monthlyBalance: Number((afterBal - baseBal).toFixed(2)),
      survivalMonths: Number(survivalMonths(afterInputs).toFixed(2))
    }
  };
}
