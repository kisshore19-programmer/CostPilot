export function fallbackExplain(type, facts) {
  if (type === "scenario") {
    const ds = facts.deltaStressScore ?? 0;
    const dm = facts.deltaMonthlyBalance ?? 0;
    const sm = facts.survivalMonths ?? 999;

    return {
      headline: ds > 0 ? `Stress increases by ${ds}` : `Stress changes by ${ds}`,
      reason: `Monthly balance changes by RM${dm}.`,
      tradeoff: sm === 999 ? "Cashflow is non-negative in this scenario." : `Estimated survival: ${sm} months if income stops.`,
      confidence: 60
    };
  }

  if (type === "stress") {
    const score = facts.stressScore ?? 0;
    const sources = Array.isArray(facts.pressureSources) ? facts.pressureSources.join(" + ") : "key expenses";

    return {
      headline: `Stress score is ${score}`,
      reason: `Main pressure comes from ${sources}.`,
      tradeoff: "Reducing top pressure categories improves score fastest.",
      confidence: 60
    };
  }

  if (type === 'recommendation' || type === 'optimize') {
    const savings = facts.delta?.monthlyBalance || 0;
    return {
      context: `Optimizing your **${facts.title || 'budget'}** is a proven way to free up cash. Given your profile, this could save you *RM ${savings}* monthly. Consider exploring cheaper options in your area or adjusting your daily habits to lock in these savings.`,
      highlight_box: {
        title: "KEY INSIGHT",
        tags: ["Savings Potential", "Actionable"],
        description: `Moving to a more affordable option or reducing this expense saves *RM ${savings}* per month.`
      },
      outcome_headline: `Estimated *RM ${savings}* increase in monthly cash flow`,
      outcome_bullets: [
        `Increased monthly cash buffer by RM ${savings}`,
        "Reduced financial stress score instantly",
        "Improved long-term savings rate"
      ],
      tradeoff: "May require a one-time adjustment or slightly longer commute.",
      confidence: 50
    };
  }

  return {
    headline: "Recommendation summary",
    reason: `Optimizing ${facts.type || 'expenses'} can increase your monthly balance by RM ${facts.savings || '...'}`,
    tradeoff: "Higher savings usually requires reducing discretionary spending.",
    confidence: 55
  };
}
