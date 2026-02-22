**Cost-of-Living Navigator – Data & Realism Assumptions (Malaysia Context)**

Owner: Role 4 – Data, Maps & Integration Lead

---

# 1️⃣ Geographic Scope

This project models cost-of-living scenarios within:

* Kuala Lumpur (KLCC / City Centre)
* Greater KL Suburbs (Subang, Shah Alam, Cheras, Setapak)
* B40 / Public Housing contexts (PPR, low-cost flats)

All figures are in **MYR (RM)** and reflect 2024–2025 market conditions.

---

# 2️⃣ Housing Assumptions

## KL City Centre (e.g., KLCC, Bukit Bintang)

* 1-bedroom condo: RM 2300 – RM 2800
* Studio / older unit: RM 1800 – RM 2200
* Utilities (condo): RM 250 – RM 350

Assumption used in system:

* City center professional rent ≈ RM 2500

Justification:
Urban premium + proximity to CBD reduces commute cost but increases rental burden.

---

## KL Suburbs (e.g., Subang, Cheras, Shah Alam)

* 2-bedroom apartment: RM 1200 – RM 1600
* Utilities: RM 200 – RM 300

Assumption used in system:

* Suburb commuter rent ≈ RM 1300

Justification:
Lower rental cost but higher transportation burden due to commuting.

---

## Public / Low-Cost Housing (PPR / B40)

* Rental range: RM 400 – RM 700
* Utilities: RM 150 – RM 200

Assumption used:

* B40 rent ≈ RM 600

Justification:
Aligned with Malaysia B40 housing structure.

---

# 3️⃣ Transport Cost Assumptions

Transport is derived from distance to workplace.

## Public Transport Model

Estimated cost formula:

```
Monthly Cost = distance_km × 0.15 × 22 working days
```

Typical MRT/LRT monthly pass:

* RM 100 – RM 200

City center case:

* 3–6 km commute
* Monthly ≈ RM 150 – RM 250

---

## Private Car Model

Estimated cost formula:

```
Monthly Cost = distance_km × 0.45 × 22 days
```

Includes:

* Fuel
* Tolls
* Maintenance
* Parking

Typical suburban commute (20–30 km daily):

* RM 600 – RM 900

---

# 4️⃣ Food Assumptions

Single working adult:

* Eating out + groceries: RM 800 – RM 1000

Family / single parent:

* RM 1000 – RM 1300

Fresh graduate (moderate spending):

* RM 600 – RM 800

---

# 5️⃣ Debt Assumptions

Debt includes:

* PTPTN
* Car loan
* Credit card minimums
* Personal loans

Healthy debt ratio:

* ≤ 20% of income

High risk:

* > 35% of income

---

# 6️⃣ Savings Buffer Assumptions

Financial safety guideline:

* 3 months expenses = minimum stability
* 6 months expenses = healthy buffer

System uses:

* < 1 month → High Risk
* 1–3 months → Moderate
* ≥ 6 months → Low Risk

---

# 7️⃣ Housing vs Transport Trade-Off Logic

Urban economic principle:

Higher rent near city centre
→ Lower transport cost
→ Higher expense ratio due to rent burden

Lower suburban rent
→ Higher transport cost
→ Increased exposure to fuel/toll inflation

This trade-off is intentionally modeled to demonstrate real-world urban planning economics.

---

# 8️⃣ Affordability Benchmarks Used

Rental affordability rule:

* Recommended rent ≤ 30% of income

Transport affordability:

* Recommended ≤ 20% of income

Debt ratio safe zone:

* ≤ 20%

These thresholds align with financial planning best practices.

---

# 9️⃣ Policy Context (Malaysia)

System aligns conceptually with:

* B40 income threshold (~ RM 4,850 household)
* PPR public housing programs
* PR1MA affordable housing initiatives
* My50 public transport pass

No live policy database is used in v1 (deterministic engine only).

---

# 🔟 Design Philosophy

* Deterministic scoring (no hidden ML)
* Transparent assumptions
* Auditable formulas
* Realistic Malaysian market grounding
* AI used only for explanation, not computation

---
