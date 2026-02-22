import { fallbackExplain } from "../src/engine/explainFallback.js";

test("fallback explain returns required keys", () => {
  const out = fallbackExplain("stress", { stressScore: 50, pressureSources: ["Rent"] });
  expect(typeof out.headline).toBe("string");
  expect(typeof out.reason).toBe("string");
  expect(typeof out.tradeoff).toBe("string");
  expect(typeof out.confidence).toBe("number");
});
