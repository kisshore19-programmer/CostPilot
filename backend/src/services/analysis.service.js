import { calculateStress } from "../engine/stressScore.js";
import { computeSignals } from "../engine/signals.js";
import { validateAndNormalizeMonthlyInputs } from "../engine/validate.js";
import { optimize } from "../engine/optimizer.js";
import { matchSubsidies } from "./subsidyService.js";
import { locationService } from "./location.service.js";

/**
 * Orchestrates the full financial analysis:
 * 1. Validation
 * 2. Stress Score
 * 3. Signal Generation
 * 4. Subsidy Matching
 * 5. Deterministic Optimization
 * 6. Location Context (if provided)
 */
export async function runFullAnalysis(rawBody) {
    // 1. Validate Financial Inputs
    const v = validateAndNormalizeMonthlyInputs(rawBody);
    if (!v.ok) {
        throw new Error(v.error);
    }
    const cleanFinancials = v.cleanInputs;

    // 2. Extract Profile Inputs (with defaults)
    const profile = {
        ...cleanFinancials, // Subsidies might need income
        incomeMonthly: cleanFinancials.incomeMonthly,
        age: Number(rawBody.age) || 0,
        employmentStatus: rawBody.employmentStatus || "",
        state: rawBody.state || "",
        householdSize: Number(rawBody.householdSize) || 1
    };

    // 3. Core Financials (Stress & Signals)
    const stress = calculateStress(cleanFinancials);
    const signals = computeSignals(cleanFinancials, stress);

    // 4. Subsidies
    const subsidies = matchSubsidies(profile);

    // 5. Optimizations
    const recommendations = await optimize(cleanFinancials, stress);
    const totalSavings = recommendations.reduce((acc, curr) => acc + (curr.potentialSavings || 0), 0);

    // 6. Location Context
    let locationContext = null;
    if (rawBody.location && rawBody.location.lat && rawBody.location.lng) {
        locationContext = await locationService.getContext(rawBody.location.lat, rawBody.location.lng);
    }

    // 7. Construct Response
    return {
        financials: {
            stress,
            signals,
            derived: {
                monthlyBalance: signals.numbers.monthlyBalance,
                survivalMonths: stress.bufferMonths
            }
        },
        subsidies,
        optimization: {
            base: { stress, signals },
            recommendations,
            totalSavings
        },
        locationContext // New field
    };
}
