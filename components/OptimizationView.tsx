import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, ViewState } from '../types';
import { api, ScenarioResult, MonthlyInputs, OptimizationRecommendation, SubsidyMatch, ExplainResponse } from '../services/api';

// --- SAFE HELPER COMPONENTS ---

// 1. CSS-only Icon (No imports)
const CssIcon = ({ type }: { type: string }) => {
  let colorClass = "bg-slate-200 text-slate-600";
  let text = "OPT";

  switch (type) {
    case 'housing':
      colorClass = "bg-blue-100 text-blue-600";
      text = "🏠";
      break;
    case 'transport':
      colorClass = "bg-indigo-100 text-indigo-600";
      text = "🚌";
      break;
    case 'debt':
      colorClass = "bg-red-100 text-red-600";
      text = "💳";
      break;
    case 'lifestyle':
      colorClass = "bg-pink-100 text-pink-600";
      text = "☕";
      break;
    default:
      colorClass = "bg-emerald-100 text-emerald-600";
      text = "💡";
  }

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${colorClass}`}>
      {text}
    </div>
  );
};

// 2. Safe Recommendation Card
const SafeRecommendationCard = ({ rec, index, onSimulate, onInsight, onAccept, simulating, simulationResult, insightLoading, insights, accepting }: any) => {
  try {
    if (!rec || !rec.simulationResult) return null;

    const isAccepting = accepting?.[index];

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-4 hover:shadow-md transition-shadow">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
          <div className="flex gap-4">
            <CssIcon type={rec.type} />
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{rec.title}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{rec.type} OPTIMIZATION</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full">
              Save RM{rec.potentialSavings.toLocaleString(undefined, { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 })}/mo
            </span>
          </div>
        </div>

        <div className="p-5">
          <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            {rec.reason}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="text-xs text-slate-500 uppercase font-bold">Current Stress</span>
              <div className="text-2xl font-black text-slate-700 dark:text-slate-200">
                {rec.simulationResult.base?.stressScore ?? '-'}
              </div>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
              <span className="text-xs text-emerald-600 uppercase font-bold">Projected Stress</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {rec.simulationResult.after?.stressScore ?? '-'}
                {rec.simulationResult.delta?.stressScore !== 0 && (
                  <span className="text-sm font-normal ml-2 text-emerald-500">
                    ({rec.simulationResult.delta.stressScore.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Live Simulation feedback */}
          {simulationResult && simulationResult.delta.monthlyBalance === rec.potentialSavings && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm font-medium flex items-center gap-2">
              <span>✅ Impact Verified: +RM{simulationResult.delta.monthlyBalance.toLocaleString(undefined, { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 })} balance</span>
            </div>
          )}

          <div className="flex gap-3 justify-end items-center">
            <button
              onClick={() => onAccept(index, rec)}
              disabled={isAccepting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              title="Apply this recommendation to your profile"
            >
              {isAccepting ? (
                <>
                  <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                  Accepting...
                </>
              ) : (
                <>
                  Accept
                </>
              )}
            </button>

            {!insights[index] && (
              <button
                onClick={(e) => onInsight(index, rec, e)}
                disabled={insightLoading[index]}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {insightLoading[index] ? "..." : "AI Insight"}
              </button>
            )}
          </div>

          {insights[index] && (
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-blue-100 dark:border-blue-900 p-6 relative shadow-sm animate-fade-in">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="border-l-4 border-blue-600 pl-3">
                  <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Impact Analysis</h4>
                  <div className="flex gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  </div>
                </div>
                <div className="text-4xl opacity-20 hover:opacity-100 transition-opacity cursor-help" title="AI Generated">
                  🤖
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Context Column */}
                <div>
                  <h5 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">Context</h5>
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                    {insights[index].context?.split('*').map((part, i) =>
                      i % 2 === 1 ? <span key={i} className="font-bold text-slate-900 dark:text-white">{part}</span> : part
                    )}
                  </div>

                  {insights[index].highlight_box && (
                    <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-indigo-600 text-lg">📍</span>
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-wide">
                          {insights[index].highlight_box.title}
                        </span>
                      </div>
                      {insights[index].highlight_box.tags && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {insights[index].highlight_box.tags.map((tag, t) => (
                            <span key={t} className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {insights[index].highlight_box.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Outcome Column */}
                <div>
                  <h5 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">Outcome</h5>
                  {insights[index].outcome_headline && (
                    <p className="font-bold text-slate-900 dark:text-white mb-4 text-base">
                      {insights[index].outcome_headline}
                    </p>
                  )}
                  <ul className="space-y-3">
                    {insights[index].outcome_bullets?.map((bullet, b) => (
                      <li key={b} className="flex gap-3 items-start">
                        <div className="mt-0.5 min-w-[16px] text-emerald-500">
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-300">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Trade-off Footer */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <span className="inline-block px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-md mb-2">
                  Trade-off
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {insights[index].tradeoff}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (e) {
    return <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded">Error rendering recommendation</div>;
  }
};

// 3. Safe Stats Section
const SafeStatsSection = ({ signals, baseStress }: any) => {
  try {
    const monthlyBalance = signals?.numbers?.monthlyBalance ?? 0;
    const overspending = signals?.overspending || {};
    const riskFlags = signals?.riskFlags || {};
    const pressureSources = baseStress?.pressureSources || [];

    const RISK_LABELS: Record<string, string> = {
      lowBuffer: "Low Savings Buffer",
      highDebt: "High Debt Ratio",
      expensesOverIncome: "Living Beyond Means"
    };

    // Helper to get safe risk keys if riskFlags is an object
    const riskKeys = Array.isArray(riskFlags) ? riskFlags : Object.keys(riskFlags).filter(k => riskFlags[k]);

    return (
      <div className="space-y-6">
        {/* Savings Summary */}
        <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-white shadow-xl">
          <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Financial Health</h3>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-3xl font-bold">RM{monthlyBalance.toLocaleString(undefined, { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
              <div className="text-sm text-slate-400">Est. Monthly Balance</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${monthlyBalance >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
              {monthlyBalance >= 0 ? "SURPLUS" : "DEFICIT"}
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            ⚠️ Risk Factors
          </h3>

          {/* Legend */}
          <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
              <span className="text-slate-600 dark:text-slate-400">Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-slate-600 dark:text-slate-400">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-600 dark:text-slate-400">High</span>
            </div>
          </div>

          <ul className="space-y-2">
            {riskKeys.map((flag: string, i: number) => (
              <li key={i} className="text-sm text-orange-700 dark:text-orange-400 font-medium flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                <span>{RISK_LABELS[flag] || flag}</span>
              </li>
            ))}
            {/* Only show pressure sources if stress is at least Moderate (33+) */}
            {baseStress?.stressScore >= 33 && pressureSources.map((source: string, i: number) => (
              <li key={`p-${i}`} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0"></div>
                <span>Pressure from {source}</span>
              </li>
            ))}
            {riskKeys.length === 0 && (baseStress?.stressScore < 33 || pressureSources.length === 0) && (
              <li className="text-sm text-slate-400 italic flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0"></div>
                <span>No major risks detected.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  } catch (e) {
    return <div className="p-4 bg-red-50 text-red-700 rounded">Error loading stats</div>;
  }
};


interface OptimizationViewProps {
  userProfile: UserProfile;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setView: (view: ViewState) => void;
}

const OptimizationView: React.FC<OptimizationViewProps> = ({ userProfile, updateProfile, setView }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [subsidies, setSubsidies] = useState<SubsidyMatch[]>([]);
  const [notEligibleSubsidies, setNotEligibleSubsidies] = useState<SubsidyMatch[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);

  const [simulationResult, setSimulationResult] = useState<ScenarioResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  const [signals, setSignals] = useState<any>(null);
  const [baseStress, setBaseStress] = useState<any>(null);
  const [locationContext, setLocationContext] = useState<any>(null);

  const [insights, setInsights] = useState<Record<number, ExplainResponse>>({});
  const [insightLoading, setInsightLoading] = useState<Record<number, boolean>>({});

  const [subsidyInsight, setSubsidyInsight] = useState<any>(null);
  const [subsidyInsightLoading, setSubsidyInsightLoading] = useState(false);

  const loadSubsidyInsight = async () => {
    setSubsidyInsightLoading(true);
    try {
      const facts = {
        income: userProfile.income,
        householdSize: userProfile.householdSize,
        subsidies: subsidies,
        notEligible: notEligibleSubsidies
      };
      const result = await api.getExplanation('subsidy', facts);
      setSubsidyInsight(result);
    } catch (e) {
      console.error(e);
    } finally {
      setSubsidyInsightLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSimulationResult(null);
    setSubsidyInsight(null); // Reset when refreshing
    try {
      const inputs: MonthlyInputs = {
        incomeMonthly: userProfile.income || 0,
        rentMonthly: userProfile.rent || 0,
        utilitiesMonthly: userProfile.utilities || 0,
        transportMonthly: userProfile.transportCost || 0,
        foodMonthly: userProfile.food || 0,
        debtMonthly: userProfile.debt || 0,
        subscriptionsMonthly: userProfile.subscriptions || 0,
        savingsBalance: userProfile.savings || 0
      };

      const fullProfile = { ...inputs, ...userProfile };
      const result = await api.getAnalysis(fullProfile);

      if (!result) throw new Error("No data returned");

      setRecommendations(result.optimization?.recommendations || []);
      setTotalSavings(result.optimization?.totalSavings || 0);
      setBaseStress(result.optimization?.base?.stress || null);

      setSubsidies(result.subsidies?.matches || []);
      setNotEligibleSubsidies(result.subsidies?.notEligible || []);

      setSignals(result.financials?.signals || null);
      setLocationContext(result.locationContext || null);

    } catch (e: any) {
      console.error("View Error", e);
      setError(e.message || "Failed to load analysis.");
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSimulateRecommendation = async (rec: OptimizationRecommendation) => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const base: MonthlyInputs = {
        incomeMonthly: userProfile.income || 0,
        rentMonthly: userProfile.rent || 0,
        utilitiesMonthly: userProfile.utilities || 0,
        transportMonthly: userProfile.transportCost || 0,
        foodMonthly: userProfile.food || 0,
        debtMonthly: userProfile.debt || 0,
        subscriptionsMonthly: userProfile.subscriptions || 0,
        savingsBalance: userProfile.savings || 0
      };

      const result = await api.simulateScenario(base, rec.changes);
      setSimulationResult(result);
    } catch (error) {
      console.error("Simulation failed", error);
    } finally {
      setSimulating(false);
    }
  };

  const handleApplyAll = async () => {
    if (recommendations.length === 0) return;
    const mergedChanges = recommendations.reduce((acc, r) => ({ ...acc, ...r.changes }), {} as Partial<MonthlyInputs>);

    const patch: Partial<UserProfile> = {};
    if (mergedChanges.rentMonthly !== undefined) patch.rent = mergedChanges.rentMonthly;
    if (mergedChanges.utilitiesMonthly !== undefined) patch.utilities = mergedChanges.utilitiesMonthly;
    if (mergedChanges.transportMonthly !== undefined) patch.transportCost = mergedChanges.transportMonthly;
    if (mergedChanges.foodMonthly !== undefined) patch.food = mergedChanges.foodMonthly;
    if (mergedChanges.debtMonthly !== undefined) patch.debt = mergedChanges.debtMonthly;
    if (mergedChanges.subscriptionsMonthly !== undefined) patch.subscriptions = mergedChanges.subscriptionsMonthly;
    if (mergedChanges.savingsBalance !== undefined) patch.savings = mergedChanges.savingsBalance;

    // Mark all recommendation types as optimized
    const allTypes = new Set([...optimizedCategories, ...recommendations.map(r => r.type)]);
    patch.optimizedCategories = Array.from(allTypes);

    try {
      await updateProfile(patch);
      setView(ViewState.DASHBOARD);
    } catch (err) {
      console.error("Failed to apply changes", err);
    }
  };

  const loadInsight = async (idx: number, rec: OptimizationRecommendation, e: React.MouseEvent) => {
    e.stopPropagation();
    setInsightLoading(x => ({ ...x, [idx]: true }));
    try {
      if (!rec.simulationResult) return;
      const facts = {
        base: rec.simulationResult.base,
        after: rec.simulationResult.after,
        delta: rec.simulationResult.delta,
        changes: rec.changes,
        title: rec.title,
        reason: rec.reason,
        profile: { income: userProfile.income },
        location: locationContext
      };

      const out = await api.getExplanation('optimize', facts);
      setInsights(x => ({ ...x, [idx]: out }));
    } catch (e) {
      console.error("Failed to get insight", e);
    } finally {
      setInsightLoading(x => ({ ...x, [idx]: false }));
    }
  };

  // Track which categories have been optimized (persisted in user profile)
  const [optimizedCategories, setOptimizedCategories] = useState<Set<string>>(() => {
    // Initialize from user profile if it exists
    return new Set(userProfile.optimizedCategories || []);
  });
  const [accepting, setAccepting] = useState<Record<number, boolean>>({});

  // Sync optimizedCategories when userProfile changes (e.g., after clearing in Settings)
  useEffect(() => {
    setOptimizedCategories(new Set(userProfile.optimizedCategories || []));
  }, [userProfile.optimizedCategories]);

  const handleAccept = async (index: number, rec: OptimizationRecommendation) => {
    setAccepting(prev => ({ ...prev, [index]: true }));
    try {
      const patch: Partial<UserProfile> = {};
      const changes = rec.changes;

      // Map API changes to user profile structure
      if (changes.rentMonthly !== undefined) patch.rent = changes.rentMonthly;
      if (changes.utilitiesMonthly !== undefined) patch.utilities = changes.utilitiesMonthly;
      if (changes.transportMonthly !== undefined) patch.transportCost = changes.transportMonthly;
      if (changes.foodMonthly !== undefined) patch.food = changes.foodMonthly;
      if (changes.debtMonthly !== undefined) patch.debt = changes.debtMonthly;
      if (changes.subscriptionsMonthly !== undefined) patch.subscriptions = changes.subscriptionsMonthly;
      if (changes.savingsBalance !== undefined) patch.savings = changes.savingsBalance;

      // Mark this category as optimized and persist to backend
      const newOptimizedCategories = new Set(optimizedCategories);
      newOptimizedCategories.add(rec.type);
      patch.optimizedCategories = Array.from(newOptimizedCategories) as string[];

      await updateProfile(patch);

      // Update local state to immediately hide the card
      setOptimizedCategories(newOptimizedCategories);

    } catch (err) {
      console.error("Failed to accept recommendation", err);
      setError("Failed to apply changes. Please try again.");
    } finally {
      setTimeout(() => {
        setAccepting(prev => ({ ...prev, [index]: false }));
      }, 500);
    }
  };

  // Filter out recommendations for categories that were just optimized
  const visibleRecommendations = recommendations.filter(rec => !optimizedCategories.has(rec.type));

  // Calculate remaining savings (total minus already accepted)
  const remainingSavings = visibleRecommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Analysis...</div>;
  if (error) return <div className="p-10 text-red-500 font-bold text-center">Connection Error: {error} <button onClick={fetchData} className="ml-4 underline">Retry</button></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Optimization Plan</h1>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold">
            <span>Found RM{remainingSavings.toLocaleString(undefined, { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 })}/mo in potential savings</span>
          </div>
        </div>

        <button
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
          onClick={fetchData}
        >
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          {visibleRecommendations.length > 0 ? (
            visibleRecommendations.map((rec, index) => (
              <SafeRecommendationCard
                key={index}
                rec={rec}
                index={index}
                onSimulate={handleSimulateRecommendation}
                onInsight={loadInsight}
                onAccept={handleAccept}
                accepting={accepting}
                simulating={simulating}
                simulationResult={simulationResult}
                insightLoading={insightLoading}
                insights={insights}
              />
            ))
          ) : (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 font-medium">No optimization opportunities found right now.</p>
              <p className="text-slate-400 text-sm mt-2">Check back as your income or expenses change.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">

          <SafeStatsSection signals={signals} baseStress={baseStress} />

          {/* Subsidies Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">
              Available Subsidies
            </h3>

            <div className="space-y-4">
              {subsidies.map((sub, idx) => (
                <div key={idx} className="p-3 border border-emerald-100 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{sub.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{sub.benefitText}</p>
                  {sub.link && (
                    <a href={sub.link} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wide">
                      Apply Now
                    </a>
                  )}
                </div>
              ))}
              {subsidies.length === 0 && <p className="text-sm text-slate-500 italic">No eligible subsidies found.</p>}

              {/* AI Subsidy Insight */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                {!subsidyInsight && !subsidyInsightLoading && (
                  <button
                    onClick={loadSubsidyInsight}
                    className="w-full py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>🤖</span> Why do I qualify?
                  </button>
                )}
                {subsidyInsightLoading && <div className="text-center text-xs text-slate-400 animate-pulse">Analyzing eligibility rules...</div>}

                {subsidyInsight && (
                  <div className="mt-3 text-xs bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg animate-fade-in text-indigo-800 dark:text-indigo-300">
                    <div className="font-bold mb-1">Eligibility Analysis:</div>
                    <ul className="list-disc pl-4 space-y-1 mb-2">
                      {subsidyInsight.eligible?.map((e: any, i: number) => (
                        <li key={i}><b>{e.name}</b>: {e.why_eligible}</li>
                      ))}
                    </ul>
                    {subsidyInsight.not_eligible?.length > 0 && (
                      <>
                        <div className="font-bold mt-2 mb-1 text-slate-600 dark:text-slate-400">Missed Opportunities:</div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                          {subsidyInsight.not_eligible.map((e: any, i: number) => (
                            <li key={i}>{e.name}: {e.reason}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Apply Action */}
          <div className="bg-teal-700 dark:bg-teal-800 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-teal-100 text-sm font-bold uppercase tracking-wide mb-2">Ready to optimize?</h3>
            <p className="text-teal-50 text-sm mb-6">Apply all recommended changes to your profile budget.</p>
            <button
              onClick={handleApplyAll}
              disabled={visibleRecommendations.length === 0}
              className="w-full bg-white text-teal-800 font-black py-4 rounded-xl hover:bg-teal-50 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg">
              Apply All Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OptimizationView;