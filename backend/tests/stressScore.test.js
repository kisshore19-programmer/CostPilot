import examples from "../src/contracts/examples.json" with { type: "json" };
import { calculateStress } from "../src/engine/stressScore.js";

test("income=0 => High, score within 0..100", () => {
  const r = calculateStress(examples.zeroIncome);
  expect(r.riskLevel).toBe("High");
  expect(r.stressScore).toBeGreaterThanOrEqual(0);
  expect(r.stressScore).toBeLessThanOrEqual(100);
});

test("expenses=0 => Low, no crash", () => {
  const r = calculateStress(examples.zeroExpenses);
  expect(r.riskLevel).toBe("Low");
  expect(r.stressScore).toBeGreaterThanOrEqual(0);
  expect(r.stressScore).toBeLessThanOrEqual(100);
});

test("rent increase increases or keeps stress", () => {
  const base = examples.tight;
  const r1 = calculateStress(base);
  const r2 = calculateStress({ ...base, rentMonthly: base.rentMonthly + 300 });
  expect(r2.stressScore).toBeGreaterThanOrEqual(r1.stressScore);
});

test("savings increase decreases or keeps stress", () => {
  const base = examples.bad;
  const r1 = calculateStress(base);
  const r2 = calculateStress({ ...base, savingsBalance: base.savingsBalance + 5000 });
  expect(r2.stressScore).toBeLessThanOrEqual(r1.stressScore);
});

test("debt increase increases or keeps stress", () => {
  const base = examples.tight;
  const r1 = calculateStress(base);
  const r2 = calculateStress({ ...base, debtMonthly: base.debtMonthly + 400 });
  expect(r2.stressScore).toBeGreaterThanOrEqual(r1.stressScore);
});

test("pressureSources includes Rent for rent-heavy case", () => {
  const r = calculateStress(examples.rentHeavy);
  expect(r.pressureSources).toContain("Rent");
  expect(r.pressureSources.length).toBeLessThanOrEqual(2);
});

test("clamp: extreme inputs keep stress in 0..100", () => {
  const crazy = {
    incomeMonthly: 1,
    rentMonthly: 1_000_000,
    utilitiesMonthly: 1_000_000,
    transportMonthly: 1_000_000,
    foodMonthly: 1_000_000,
    debtMonthly: 1_000_000,
    subscriptionsMonthly: 1_000_000,
    savingsBalance: 0
  };
  const r = calculateStress(crazy);
  expect(r.stressScore).toBeGreaterThanOrEqual(0);
  expect(r.stressScore).toBeLessThanOrEqual(100);
});
