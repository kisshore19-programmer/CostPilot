import { simulateScenario } from './simulation.js';

import { explainWithGemini } from './geminiExplain.js';

export async function optimize(baseInputs, stressData) {
    const recommendations = [];
    const baseStress = stressData.stressScore;
    const pressureSources = stressData.pressureSources || [];

    // Helper to run sim
    const runSim = (changes, title, type, reason) => {
        const result = simulateScenario(baseInputs, changes);
        // Only keep if it improves stress or balance
        if (result.delta.stressScore < 0 || result.delta.monthlyBalance > 0) {
            recommendations.push({
                type,
                title,
                changes,
                simulationResult: result,
                potentialSavings: result.delta.monthlyBalance,
                reason
            });
        }
    };

    // 1. Rent Optimization (if Rent is a pressure source or high burden)
    if (pressureSources.includes('Rent') || (baseInputs.rentMonthly / baseInputs.incomeMonthly > 0.3)) {
        // Scenario A: Cheaper place / Housemate
        runSim(
            { rentMonthly: Math.round(baseInputs.rentMonthly * 0.75) },
            "Move to Cheaper Unit / Get Housemate",
            "housing",
            "Rent consumes a large portion of your income. Reducing it by 25% has the biggest impact."
        );
        // Scenario B: Aggressive Move
        runSim(
            { rentMonthly: Math.round(baseInputs.rentMonthly * 0.6), transportMonthly: baseInputs.transportMonthly + 150 },
            "Move Further Out (Lower Rent, Higher Transport)",
            "housing",
            "Moving to a cheaper area can save significantly on rent, even with slightly higher transport costs."
        );
    }

    // 2. Transport Optimization
    if (baseInputs.transportMonthly > 400 || pressureSources.includes('Transport')) {
        runSim(
            { transportMonthly: Math.round(baseInputs.transportMonthly * 0.7) },
            "Optimize Commute (Public Transit pass)",
            "transport",
            "Switching to monthly passes or carpooling can reduce transport costs by ~30%."
        );
    }

    // 3. Food / Subscriptions (Identifying fat to trim)
    if (baseInputs.subscriptionsMonthly > 50 || pressureSources.includes('Subscriptions')) {
        runSim(
            { subscriptionsMonthly: Math.round(baseInputs.subscriptionsMonthly * 0.5) },
            "Audit Subscriptions",
            "lifestyle",
            "Cutting unused subscriptions is an easy win for immediate cash flow."
        );
    }

    if (baseInputs.foodMonthly > 800 || pressureSources.includes('Food')) {
        runSim(
            { foodMonthly: Math.round(baseInputs.foodMonthly * 0.8) },
            "Cook More Often",
            "lifestyle",
            "Reducing dining out frequency can save ~20% on food costs."
        );
    }

    // 4. Debt Repayment (if high debt)
    if ((baseInputs.debtMonthly > 0 && stressData.debtRatio > 0.15) || pressureSources.includes('Debt')) {
        // Suggest consolidating or refinancing
        runSim(
            { debtMonthly: Math.round(baseInputs.debtMonthly * 0.85) },
            "Refinance High-Interest Debt",
            "debt",
            "Lowering monthly debt obligations improves cash flow stability."
        );
    }

    // Sort by impact (stress reduction first, then savings)
    recommendations.sort((a, b) => a.simulationResult.delta.stressScore - b.simulationResult.delta.stressScore || b.potentialSavings - a.potentialSavings);

    // Return only the BEST recommendation per type (to avoid redundancy)
    const selected = [];
    const usedTypes = new Set();

    for (const rec of recommendations) {
        if (!usedTypes.has(rec.type)) {
            selected.push(rec);
            usedTypes.add(rec.type);
        }
    }

    const topRecs = selected;

    // AI Personalization for top recommendation
    if (topRecs.length > 0) {
        try {
            const best = topRecs[0];
            const explanation = await explainWithGemini('optimize', {
                title: best.title,
                savings: best.potentialSavings,
                currentStress: baseStress,
                projectedStress: best.simulationResult.after.stressScore,
                type: best.type
            });

            if (explanation && explanation.reason) {
                best.reason = explanation.reason + " (AI Personalized)";
            }
        } catch (e) {
            console.error("Failed to personalize recommendation", e);
        }
    }

    return topRecs;
}
