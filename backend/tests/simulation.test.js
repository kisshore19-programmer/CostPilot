import examples from "../src/contracts/examples.json" with { type: "json" };
import { simulateScenario } from "../src/engine/simulation.js";

test("survivalMonths=999 when monthly balance >=0", () => {
  const out = simulateScenario(examples.healthy, {});
  expect(out.delta.survivalMonths).toBe(999);
});

test("survivalMonths finite when monthly balance negative", () => {
  const base = examples.bad;
  const out = simulateScenario(base, { rentMonthly: base.rentMonthly + 500 });
  expect(out.delta.survivalMonths).toBeGreaterThanOrEqual(0);
  expect(out.delta.survivalMonths).toBeLessThan(999);
});

test("no NaN in scenario outputs", () => {
  const out = simulateScenario(examples.tight, { rentMonthly: 1900 });
  expect(Number.isFinite(out.base.stressScore)).toBe(true);
  expect(Number.isFinite(out.after.stressScore)).toBe(true);
  expect(Number.isFinite(out.delta.stressScore)).toBe(true);
  expect(Number.isFinite(out.delta.monthlyBalance)).toBe(true);
  expect(Number.isFinite(out.delta.survivalMonths)).toBe(true);
});
