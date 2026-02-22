export function computeSignals(inputs, stress) {
  const income = inputs.incomeMonthly ?? 0;

  const totalExpenses =
    (inputs.rentMonthly ?? 0) +
    (inputs.utilitiesMonthly ?? 0) +
    (inputs.transportMonthly ?? 0) +
    (inputs.foodMonthly ?? 0) +
    (inputs.debtMonthly ?? 0) +
    (inputs.subscriptionsMonthly ?? 0);

  const monthlyBalance = income - totalExpenses;

  const foodShare = income > 0 ? (inputs.foodMonthly ?? 0) / income : 1;
  const transportShare = income > 0 ? (inputs.transportMonthly ?? 0) / income : 1;
  const subsShare = income > 0 ? (inputs.subscriptionsMonthly ?? 0) / income : 1;

  return {
    overspending: {
      Food: foodShare > 0.25,
      Transport: transportShare > 0.18,
      Subscriptions: subsShare > 0.08
    },
    riskFlags: {
      lowBuffer: stress.bufferMonths < 2,
      highDebt: stress.debtRatio > 0.2,
      expensesOverIncome: stress.expenseRatio > 1
    },
    numbers: {
      monthlyBalance: Number(monthlyBalance.toFixed(2)),
      savingsPotential: 0 // leave 0 for MVP; later derived from recommendations
    }
  };
}
