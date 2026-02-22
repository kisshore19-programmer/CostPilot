const FIELDS = [
  "incomeMonthly",
  "rentMonthly",
  "utilitiesMonthly",
  "transportMonthly",
  "foodMonthly",
  "debtMonthly",
  "subscriptionsMonthly",
  "savingsBalance"
];

export function validateAndNormalizeMonthlyInputs(raw) {
  if (raw == null || typeof raw !== "object") {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const clean = {};
  for (const f of FIELDS) {
    const v = raw[f];
    const n = v === undefined || v === null || v === "" ? 0 : Number(v);

    if (!Number.isFinite(n)) return { ok: false, error: `Field '${f}' must be a number` };
    if (n < 0) return { ok: false, error: `Field '${f}' must be >= 0` };

    clean[f] = n;
  }
  return { ok: true, cleanInputs: clean };
}
