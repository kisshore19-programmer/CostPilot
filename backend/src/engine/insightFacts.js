/**
 * Builds a clean, structured fact bundle for AI generation.
 * filtering out noise and ensuring only deterministic facts are passed.
 */
export function buildInsightFacts(type, analysisResult, context = {}) {
    const { financials, locationContext, subsidies } = analysisResult;
    const { stress, signals } = financials;

    // Common base facts
    const baseFacts = {
        monthlyBalance: signals.numbers.monthlyBalance,
        stressScore: stress.stressScore,
        pressureSources: stress.pressureSources,
        riskFlags: signals.riskFlags,
        location: locationContext ? {
            city: locationContext.city,
            state: locationContext.state,
            transit: locationContext.nearbyTransit?.map(t => `${t.name} (${t.distanceKm}km)`).join(", ") || "None detected"
        } : "Not provided",
    };

    if (type === 'dashboard') {
        return {
            ...baseFacts,
            topOptimizations: analysisResult.optimization.recommendations.slice(0, 3).map(r => ({
                title: r.title,
                type: r.type,
                potentialSavings: r.potentialSavings
            })),
            survivalMonths: financials.derived.survivalMonths
        };
    }

    if (type === 'recommendation') {
        const rec = context.recommendation; // Specific recommendation object
        if (!rec) return baseFacts;

        return {
            ...baseFacts,
            recommendation: {
                title: rec.title,
                type: rec.type,
                savings: rec.potentialSavings,
                prediction: {
                    newBalance: signals.numbers.monthlyBalance + rec.potentialSavings,
                    stressDelta: rec.simulationResult.delta.stressScore.toFixed(2)
                }
            }
        };
    }

    if (type === 'subsidy') {
        return {
            ...baseFacts,
            income: context.profile?.incomeMonthly,
            householdSize: context.profile?.householdSize,
            eligibleCount: subsidies.matches.length,
            eligiblePrograms: subsidies.matches.map(s => s.name),
            notEligiblePrograms: subsidies.notEligible.map(s => ({ name: s.name, reason: s.reason }))
        };
    }

    return baseFacts;
}
