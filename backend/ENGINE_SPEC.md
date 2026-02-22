# Core Engine Spec (v1) — Cost-of-Living Navigator

Owner: Person 2 (AI / Reasoning Lead)  
Scope: Deterministic stress scoring, scenario simulation, signals, and AI-based explanations.  
Out of scope: UI, Maps, Subsidy policy logic, Vertex AI training, BigQuery pipelines, Document AI processing.

---

## 1) Inputs (Monthly, MYR)

All inputs are numeric and must be >= 0.  
Missing or blank values are normalised to 0 after validation.

- incomeMonthly  
- rentMonthly  
- utilitiesMonthly  
- transportMonthly  
- foodMonthly  
- debtMonthly  
- subscriptionsMonthly  
- savingsBalance  

---

## 2) Derived Values



totalExpenses =
rentMonthly + utilitiesMonthly + transportMonthly +
foodMonthly + debtMonthly + subscriptionsMonthly

expenseRatio = totalExpenses / incomeMonthly
(if incomeMonthly = 0 → expenseRatio = 999)

debtRatio = debtMonthly / incomeMonthly
(if incomeMonthly = 0 → debtRatio = 999)

bufferMonths = savingsBalance / totalExpenses
(if totalExpenses = 0 → bufferMonths = 12)

monthlyBalance = incomeMonthly - totalExpenses


---

## 3) Stress Score (0–100)

### Subscore thresholds

#### Expense Subscore
- expenseRatio ≤ 0.50 → 10  
- ≤ 0.70 → 30  
- ≤ 0.85 → 60  
- ≤ 1.00 → 85  
- > 1.00 → 100  

#### Debt Subscore
- debtRatio ≤ 0.10 → 10  
- ≤ 0.20 → 35  
- ≤ 0.35 → 70  
- > 0.35 → 100  

#### Buffer Subscore (inverse)
- bufferMonths ≥ 6 → 10  
- ≥ 3 → 35  
- ≥ 1 → 70  
- < 1 → 100  

---

### Final Weighted Score



stressScore =
0.55 * expenseSubscore +
0.25 * bufferSubscore +
0.20 * debtSubscore


- Result is clamped to range 0–100 and rounded to nearest integer.

---

## 4) Risk Bands

- 0–33 → Low  
- 34–66 → Moderate  
- 67–100 → High  

---

## 5) Pressure Sources

- For each category (Rent, Utilities, Transport, Food, Debt, Subscriptions):


share = categoryAmount / totalExpenses

- Ignore categories with share < 5%
- Return **top 2 categories by share** as pressureSources

---

## 6) Scenario Simulation

### Endpoint


POST /simulate
Body: { base, changes }


- `base`: full MonthlyInputs
- `changes`: partial MonthlyInputs (overrides base)

### Computation
- Apply changes to base and recompute all values



monthlyBalance = incomeMonthly - totalExpenses

survivalMonths =
if monthlyBalance >= 0 → 999
else → savingsBalance / (-monthlyBalance)


### Output


{
base: StressResult,
after: StressResult,
delta: {
stressScore,
monthlyBalance,
survivalMonths
}
}


---

## 7) Signals (Decision Flags)

Derived deterministically from inputs and stress result.

### Overspending Flags (share of income)
- Food > 25%
- Transport > 18%
- Subscriptions > 8%
- If incomeMonthly = 0 → flags default to true

### Risk Flags
- expensesOverIncome → expenseRatio > 1
- lowBuffer → bufferMonths < 2
- highDebt → debtRatio > 0.2

### Numbers
- monthlyBalance
- savingsPotential (reserved for future logic, currently 0)

---

## 8) Explainability (AI Layer)

### Endpoint


POST /explain
Body: {
type: "stress" | "scenario" | "optimize",
facts: object
}


### Output


{
headline: string,
reason: string,
tradeoff: string,
confidence: number (0–100)
}


### Rules
- Gemini is used **only** to generate explanations.
- Gemini does NOT compute scores, eligibility, or recommendations.
- All numerical logic comes from the deterministic engine.
- If Gemini fails or is unavailable, the system returns a deterministic fallback explanation.

---

## 9) API Summary

- `POST /summary/monthly` → `{ stress, signals }`
- `POST /simulate` → `{ base, after, delta }`
- `POST /explain` → explanation JSON only

---

## 10) Validation & Edge Cases

- Request body must be a JSON object
- Non-numeric fields → HTTP 400
- Negative values → HTTP 400
- Missing/blank fields default to 0 after validation
- incomeMonthly = 0:
  - expenseRatio = 999
  - debtRatio = 999
  - valid score returned (High risk)
- totalExpenses = 0:
  - expenseRatio = 0
  - bufferMonths = 12
  - valid score returned (Low risk)
- survivalMonths:
  - monthlyBalance ≥ 0 → 999
  - monthlyBalance < 0 → savingsBalance / (-monthlyBalance)

---

## 11) Design Principles

- Deterministic, explainable, auditable logic
- No hidden ML decisions
- AI used only for explanation, not computation
- Thresholds based on finance fundamentals and risk acceleration
- Stable contracts to support frontend and demo reliability
