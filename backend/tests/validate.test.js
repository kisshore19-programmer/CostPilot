import { validateAndNormalizeMonthlyInputs } from "../src/engine/validate.js";

test("negative inputs rejected", () => {
  const v = validateAndNormalizeMonthlyInputs({
    incomeMonthly: 3000,
    rentMonthly: -1,
    utilitiesMonthly: 0,
    transportMonthly: 0,
    foodMonthly: 0,
    debtMonthly: 0,
    subscriptionsMonthly: 0,
    savingsBalance: 0
  });
  expect(v.ok).toBe(false);
});
