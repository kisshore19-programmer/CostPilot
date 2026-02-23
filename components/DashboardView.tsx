import React, { useEffect, useState } from 'react';
import { UserProfile, ViewState, SmartGoal } from '../types';
import { api, StressResult, MonthlyInputs } from '../services/api';
import { TrendingUp, CheckCircle2, AlertCircle, Compass, ArrowRight, Zap, RefreshCw, Target, Plus, X, Calendar, AlertTriangle, Trash2, Car, ShieldCheck, Home, Plane, GraduationCap, Briefcase } from 'lucide-react';

const DashboardView: React.FC<{ userProfile: UserProfile; updateProfile?: (profile: Partial<UserProfile>) => void; setView: (view: ViewState) => void }> = ({ userProfile, updateProfile, setView }) => {
  const [loading, setLoading] = useState(true);
  const [stressData, setStressData] = useState<StressResult | null>(null);
  const [signals, setSignals] = useState<any>(null);
  const [subsidyCount, setSubsidyCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<{ label: string, value: number, color: string } | null>(null);

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: 0, deadlineMonths: 12, category: 'General' });

  const categories = [
    { name: 'Car/Vehicle', icon: Car },
    { name: 'Emergency', icon: ShieldCheck },
    { name: 'House', icon: Home },
    { name: 'Vacation', icon: Plane },
    { name: 'Education', icon: GraduationCap },
    { name: 'Investment', icon: Briefcase },
    { name: 'General', icon: Target },
  ];

  const smartGoals = userProfile.smartGoals || [];
  const requiredMonthlyTotal = smartGoals.reduce((sum, g) => sum + (g.targetAmount / g.deadlineMonths), 0);
  const fixedCommitments = userProfile.rent + (userProfile.subscriptions || 0);
  const safeAvailableForGoals = userProfile.income - fixedCommitments;

  const handleAddGoal = async () => {
    if (!newGoal.name || newGoal.targetAmount <= 0 || newGoal.deadlineMonths <= 0 || !updateProfile) return;

    if (editingGoalId) {
      const updatedGoals = smartGoals.map(g =>
        g.id === editingGoalId
          ? { ...g, name: newGoal.name, targetAmount: newGoal.targetAmount, deadlineMonths: newGoal.deadlineMonths, category: newGoal.category }
          : g
      );
      await updateProfile({ smartGoals: updatedGoals });
      setEditingGoalId(null);
    } else {
      const goal: SmartGoal = {
        id: Date.now().toString(),
        name: newGoal.name,
        targetAmount: newGoal.targetAmount,
        deadlineMonths: newGoal.deadlineMonths,
        category: newGoal.category,
        createdAt: Date.now()
      };
      await updateProfile({ smartGoals: [...smartGoals, goal] });
    }

    setIsAddingGoal(false);
    setNewGoal({ name: '', targetAmount: 0, deadlineMonths: 12, category: 'General' });
  };

  const handleEditGoal = (goal: SmartGoal) => {
    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount,
      deadlineMonths: goal.deadlineMonths,
      category: goal.category || 'General'
    });
    setEditingGoalId(goal.id);
    setIsAddingGoal(true);
  };

  const handleCancelGoal = () => {
    setIsAddingGoal(false);
    setEditingGoalId(null);
    setNewGoal({ name: '', targetAmount: 0, deadlineMonths: 12, category: 'General' });
  };

  const handleDeleteGoal = async (id: string) => {
    if (!updateProfile) return;
    await updateProfile({ smartGoals: smartGoals.filter(g => g.id !== id) });
  };

  // Linear interpolation helper (mirrors backend stressScore.js)
  const lerp = (value: number, x1: number, x2: number, y1: number, y2: number) => {
    if (value <= x1) return y1;
    if (value >= x2) return y2;
    return y1 + ((value - x1) / (x2 - x1)) * (y2 - y1);
  };

  const calculateFinancialStressScore = (profile: UserProfile) => {
    const income = Math.max(0, profile.income);
    const rent = Math.max(0, profile.rent);
    const utilities = Math.max(0, profile.utilities || 0);
    const transport = Math.max(0, profile.transportCost || 0);
    const food = Math.max(0, profile.food || 0);
    const debt = Math.max(0, profile.debt || 0);
    const subs = Math.max(0, profile.subscriptions || 0);
    const generalSavings = Math.max(0, profile.savings || 0);

    // Smart Goals: committed monthly contribution per goal
    const smartGoalMonthly = (profile.smartGoals || []).reduce(
      (sum: number, g: any) => sum + (g.targetAmount > 0 && g.deadlineMonths > 0 ? g.targetAmount / g.deadlineMonths : 0),
      0
    );

    // Wealth+ strategies: committed monthly investment allocations
    const wealthPlusMonthly = (profile.wealthPlusStrategies || []).reduce(
      (sum: number, s: any) => sum + (s.monthlyAmount || 0),
      0
    );

    // Total monthly committed outflow:
    //   core bills + smart goal contributions + wealth+ allocations
    //   (profile.savings is a balance, not a monthly bill — it goes into the buffer below)
    const totalExpenses = rent + utilities + transport + food + debt + subs
      + generalSavings + smartGoalMonthly + wealthPlusMonthly;

    // Buffer = emergency savings only (the safety net you can draw on).
    // General savings is now a monthly commitment above, not a reserve.
    const buffer = Math.max(0, profile.emergencySavings || 0);

    // --- Expense Ratio sub-score: 0=no stress → 100=critical ---
    const expenseRatio = income > 0 ? totalExpenses / income : 999;
    let expenseSub: number;
    if (expenseRatio <= 0.5) expenseSub = lerp(expenseRatio, 0, 0.5, 0, 10);
    else if (expenseRatio <= 0.7) expenseSub = lerp(expenseRatio, 0.5, 0.7, 10, 30);
    else if (expenseRatio <= 0.85) expenseSub = lerp(expenseRatio, 0.7, 0.85, 30, 60);
    else if (expenseRatio <= 1.0) expenseSub = lerp(expenseRatio, 0.85, 1.0, 60, 85);
    else expenseSub = Math.min(100, lerp(expenseRatio, 1.0, 1.2, 85, 100));

    // --- Buffer months: how many months saved ÷ monthly outflow ---
    const bufferMonths = totalExpenses > 0 ? buffer / totalExpenses : 12;
    let bufferSub: number;
    if (bufferMonths >= 6) bufferSub = lerp(bufferMonths, 6, 12, 10, 0);
    else if (bufferMonths >= 3) bufferSub = lerp(bufferMonths, 3, 6, 35, 10);
    else if (bufferMonths >= 1) bufferSub = lerp(bufferMonths, 1, 3, 70, 35);
    else bufferSub = lerp(bufferMonths, 0, 1, 100, 70);

    // --- Debt ratio sub-score ---
    const debtRatio = income > 0 ? debt / income : 0;
    let debtSub: number;
    if (debtRatio <= 0.1) debtSub = lerp(debtRatio, 0, 0.1, 0, 10);
    else if (debtRatio <= 0.2) debtSub = lerp(debtRatio, 0.1, 0.2, 10, 35);
    else if (debtRatio <= 0.35) debtSub = lerp(debtRatio, 0.2, 0.35, 35, 70);
    else debtSub = Math.min(100, lerp(debtRatio, 0.35, 0.5, 70, 100));

    // Weighted stress score (mirrors backend weights)
    const raw = 0.55 * expenseSub + 0.25 * bufferSub + 0.20 * debtSub;
    const score = Math.min(100, Math.max(0, Math.round(raw)));

    // Risk bands (0-33 Low, 34-66 Moderate, 67-100 Critical)
    let category = "Critical";
    let color = "bg-red-500";
    let textColor = "text-red-400";
    if (score <= 33) { category = "Low Stress"; color = "bg-emerald-500"; textColor = "text-emerald-400"; }
    else if (score <= 66) { category = "Moderate Stress"; color = "bg-amber-500"; textColor = "text-amber-400"; }

    return { score, category, color, textColor };
  };

  const getRealisticAnalysis = (goal: SmartGoal) => {
    const required = goal.targetAmount / goal.deadlineMonths;
    const margin = safeAvailableForGoals - requiredMonthlyTotal + required;
    if (required > safeAvailableForGoals * 0.5) return { status: 'Danger', text: 'Highly aggressive. Uses over 50% of your free income.', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
    if (margin < 0) return { status: 'Unrealistic', text: 'Requires more free income than possible.', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
    if (required > safeAvailableForGoals * 0.3) return { status: 'Challenging', text: 'Requires strict discipline.', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { status: 'Realistic', text: 'Healthy progression. Very achievable.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  };

  const fetchData = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7851/ingest/b113cee4-9fd7-4c43-84f5-997eb73d90d2', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9cfd23' }, body: JSON.stringify({ sessionId: '9cfd23', location: 'DashboardView.tsx:13', message: 'fetchData called', data: { hasUserProfile: !!userProfile }, timestamp: Date.now(), runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion
    setLoading(true);
    setError(null);
    try {
      const inputs: MonthlyInputs = {
        incomeMonthly: userProfile.income,
        rentMonthly: userProfile.rent,
        utilitiesMonthly: userProfile.utilities || 0,
        transportMonthly: userProfile.transportCost || 0,
        foodMonthly: userProfile.food || 0,
        debtMonthly: userProfile.debt || 0,
        subscriptionsMonthly: userProfile.subscriptions || 0,
        savingsBalance: userProfile.savings || 0
      };

      const fullProfile = { ...inputs, ...userProfile };
      const result = await api.getAnalysis(fullProfile);

      setStressData(result.financials.stress);
      setSignals(result.financials.signals);
      setSubsidyCount(result.subsidies.matches.length);
      setError(null);
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7851/ingest/b113cee4-9fd7-4c43-84f5-997eb73d90d2', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9cfd23' }, body: JSON.stringify({ sessionId: '9cfd23', location: 'DashboardView.tsx:36', message: 'fetchData error caught', data: { errorMessage: error.message, errorCode: error.code, hasResponse: !!error.response, responseStatus: error.response?.status }, timestamp: Date.now(), runId: 'run1', hypothesisId: 'A,B,C,D,E' }) }).catch(() => { });
      // #endregion
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        setError("Backend server is not running. Please start it with 'npm run dev:backend' or 'npm run dev'.");
      } else if (error.response?.status === 500) {
        setError("Server error occurred. Please check the backend logs.");
      } else if (error.response?.status === 400) {
        setError(error.response.data?.error || "Invalid request. Please check your profile data.");
      } else {
        setError(error.message || "Failed to connect to the analysis engine. Please check your internet connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 animate-fade-in text-white relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="relative">
          <div className="h-20 w-20 rounded-full border border-white/20 bg-white/5 backdrop-blur-md"></div>
          <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin"></div>
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 animate-pulse" size={24} />
        </div>
        <div className="flex flex-col items-center space-y-2">
          <p className="text-xl font-bold tracking-tight">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!loading && error && !stressData && !signals) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center p-6 text-white relative">
        <div className="bg-[#151c2c] p-10 rounded-3xl border border-slate-800 shadow-2xl max-w-lg w-full">
          <AlertCircle className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connection Interrupted</h2>
          <p className="text-slate-400 mb-8">{error}</p>
          <button onClick={fetchData} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex justify-center items-center gap-2">
            <RefreshCw size={18} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const goalSegments = smartGoals.map((goal, index) => ({
    label: `SMART GOAL (${goal.name.toUpperCase()})`,
    value: goal.targetAmount / goal.deadlineMonths,
    color: [
      '#14b8a6', // Teal
      '#06b6d4', // Cyan
      '#0891b2', // Cyan 600
    ][index % 3]
  }));

  const activeStrategies = userProfile.wealthPlusStrategies || [];
  const strategySegments = activeStrategies.map((s, index) => ({
    label: `WEALTH+ (${s.label.toUpperCase()})`,
    value: s.monthlyAmount,
    color: [
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6', // Violet
    ][index % 3]
  }));

  const strategyTotal = activeStrategies.reduce((sum, s) => sum + s.monthlyAmount, 0);
  const expenseTotal = (userProfile.rent || 0) + (userProfile.utilities || 0) + (userProfile.transportCost || 0) + (userProfile.food || 0) + (userProfile.debt || 0) + (userProfile.subscriptions || 0) + (userProfile.savings || 0) + requiredMonthlyTotal + strategyTotal;
  const trueBalanceLeft = Math.max(0, userProfile.income - expenseTotal);
  const calculatedStress = calculateFinancialStressScore(userProfile);

  const claimedSubsidies = userProfile.claimedSubsidies || [];
  const subsidyMonthlyTotal = claimedSubsidies.reduce((sum, s) => sum + s.monthlyBenefit, 0);

  // Calculate applied lifestyle savings by category
  const lifestyleSavingsByCategory: Record<string, number> = {};
  (userProfile.appliedLifestyleOptimizations || []).forEach(opt => {
    const cat = opt.category.toLowerCase().trim();
    // Normalize transportation to transport
    const normalizedCat = cat === 'transportation' ? 'transport' : cat;
    lifestyleSavingsByCategory[normalizedCat] = (lifestyleSavingsByCategory[normalizedCat] || 0) + opt.monthlySavings;
  });
  const totalLifestyleSavings = Object.values(lifestyleSavingsByCategory).reduce((a, b) => a + b, 0);

  const profileSegments = [
    { label: 'BALANCE LEFT', value: trueBalanceLeft + totalLifestyleSavings, color: '#3b82f6' },
    ...goalSegments,
    ...strategySegments,
    { label: 'GENERAL SAVINGS', value: userProfile.savings || 0, color: '#ec4899' },
    { label: 'HOUSING', value: Math.max(0, (userProfile.rent || 0) - (lifestyleSavingsByCategory['housing'] || 0)), color: '#f97316' },
    {
      label: 'TRANSPORT',
      value: Math.max(0, (userProfile.transportCost || 0) - (lifestyleSavingsByCategory['transport'] || 0)),
      color: '#10b981',
      description: (lifestyleSavingsByCategory['transport'] || 0) > 0
        ? `RM${(userProfile.transportCost || 0).toFixed(2)} budget - RM${lifestyleSavingsByCategory['transport'].toFixed(2)} optimized savings`
        : undefined
    },
    { label: 'FOOD', value: Math.max(0, (userProfile.food || 0) - (lifestyleSavingsByCategory['food'] || 0)), color: '#eab308' },
    { label: 'UTILITIES', value: Math.max(0, (userProfile.utilities || 0) - (lifestyleSavingsByCategory['utilities'] || 0)), color: '#8b5cf6' },
    { label: 'DEBT', value: userProfile.debt || 0, color: '#ef4444' },
    { label: 'SUBSCRIPTIONS', value: Math.max(0, (userProfile.subscriptions || 0) - (lifestyleSavingsByCategory['subscriptions'] || 0)), color: '#6366f1' },
    ...(userProfile.engineStatus?.subsidies ? [{ label: 'SUBSIDIES', value: subsidyMonthlyTotal, color: '#14b8a6' }] : []),
  ].filter(s => s.value > 0);

  // Use the profile segments to display. If they all 0 except income, it would look weird,
  // but we enforce realistic defaults in our design.
  const segments = profileSegments;

  const total = segments.reduce((acc, s) => acc + s.value, 0);

  // SVG parameters
  const radius = 94;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const gap = 2; // Reduced gap for a cleaner look
  let currentOffset = 0;

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans text-slate-800 dark:text-slate-100">

      {/* Top Split Layout */}
      <div className="flex flex-col xl:flex-row gap-6 mb-8 mt-2">

        {/* Left Card: Income Breakdown Chart */}
        <div className="bg-white dark:bg-[#101726] rounded-[2rem] p-8 border-slate-200 dark:border-white/5 flex flex-col md:flex-row gap-10 items-center justify-center xl:justify-start flex-1 shadow-lg min-h-[380px]">

          {/* Chart Container */}
          <div className="relative w-64 h-64 shrink-0 flex items-center justify-center mt-2 group">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 240 240">
              {segments.map((seg, i) => {
                const fraction = total > 0 ? seg.value / total : 0;
                const arcLength = fraction * circumference;

                // Ensure segments are visible even if very small
                const minDrawLength = 4;
                const drawLength = Math.max(minDrawLength, arcLength - gap);

                const strokeDashoffset = -currentOffset;
                currentOffset += arcLength;

                const isHovered = hoveredSegment?.label === seg.label;
                const isActive = !!hoveredSegment;

                return (
                  <circle
                    key={seg.label}
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${drawLength} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                    className={`transition-all duration-300 ease-out transition-transform`}
                    style={{
                      cursor: 'pointer',
                      opacity: isActive && !isHovered ? 0.3 : 1,
                      transformOrigin: 'center',
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                    }}
                    onMouseEnter={() => setHoveredSegment(seg)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                );
              })}
            </svg>
            {/* Center text inside donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              {hoveredSegment ? (
                <>
                  <span className="text-[10px] font-bold tracking-wider uppercase mb-1 drop-shadow-sm transition-colors duration-300" style={{ color: hoveredSegment.color }}>
                    {hoveredSegment.label}
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white drop-shadow-md transition-all duration-300 transform scale-105">
                    RM{hoveredSegment.value.toLocaleString(undefined, { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1 drop-shadow-sm transition-colors duration-300">
                    Total Income
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white drop-shadow-md transition-all duration-300">
                    RM{userProfile.income.toLocaleString(undefined, { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Text & Legend */}
          <div className="flex-1 w-full flex flex-col justify-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-800 dark:text-white leading-none mb-2">RM{userProfile.income.toLocaleString(undefined, { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 })}</h2>
            <p className="text-[#64748b] text-base mb-8 font-medium">Total Monthly Income</p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              {segments.map(seg => {
                const isHovered = hoveredSegment?.label === seg.label;
                const isActive = !!hoveredSegment;
                return (
                  <div
                    key={seg.label}
                    className="flex items-start gap-2.5 transition-all cursor-pointer"
                    style={{ opacity: isActive && !isHovered ? 0.4 : 1 }}
                    onMouseEnter={() => setHoveredSegment(seg)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm" style={{ backgroundColor: seg.color }}></div>
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-bold text-[#64748b] uppercase tracking-widest leading-none mb-1.5">{seg.label}</p>
                      <p className="text-[15px] font-bold text-slate-800 dark:text-white leading-none">RM{seg.value.toLocaleString(undefined, { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Stack: KPIs */}
        <div className="flex flex-col gap-6 w-full xl:w-[360px] shrink-0">

          {/* Card 1: Stress Score */}
          <div className="bg-white dark:bg-[#101726] rounded-[2rem] p-8 border-slate-200 dark:border-[#1e293b] flex justify-between items-center shadow-lg h-full relative overflow-hidden group/stress">

            <div className="flex flex-col justify-center relative z-10">
              <h3 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
                {calculatedStress.score}%
              </h3>
              <div className="flex items-center gap-2.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm text-slate-800 dark:text-white ${calculatedStress.color}`}>
                  {calculatedStress.category.toUpperCase()}
                </span>
                <span className="text-[#64748b] text-xs sm:text-sm font-medium">Financial Stress score</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-full border ${calculatedStress.textColor.replace('text-', 'border-').replace('400', '500/30')} flex items-center justify-center ${calculatedStress.textColor.replace('400', '500')} relative z-10 shrink-0`}>
              <AlertCircle size={22} strokeWidth={2} />
            </div>
          </div>

          {/* Card 2: Subsidies (Only if engine is active) */}
          {userProfile.engineStatus?.subsidies && (
            <div className="bg-white dark:bg-[#101726] rounded-[2rem] p-8 border-slate-200 dark:border-[#1e293b] flex justify-between items-center shadow-lg h-full relative overflow-hidden">
              <div className="flex flex-col justify-center relative z-10 space-y-4">
                <div>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                    {subsidyCount || 0}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">
                      SUBSIDIES
                    </span>
                    <span className="text-[#64748b] text-[10px] font-bold uppercase tracking-tight">Qualified</span>
                  </div>
                </div>

                <div className="w-12 h-[1px] bg-white/10"></div>

                <div>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                    {claimedSubsidies.length}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      SUBSIDIES
                    </span>
                    <span className="text-[#64748b] text-[10px] font-bold uppercase tracking-tight">Claimed</span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-500 relative z-10 shrink-0">
                <CheckCircle2 size={24} strokeWidth={2} />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom Banners Area */}
      <div className="flex flex-col gap-6">

        {/* Optimization Engine Banner */}
        <div
          className="relative overflow-hidden bg-gradient-to-r from-[#8c35ff] to-[#b55cff] rounded-[2rem] p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer group shadow-[0_12px_40px_-10px_rgba(140,53,255,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(140,53,255,0.7)] hover:-translate-y-1 transition-all duration-300 gap-6"
          onClick={() => setView(ViewState.OPTIMIZATION2)}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:bg-white/20 transition-colors pointer-events-none"></div>

          <div className="flex items-center gap-5 sm:gap-6 relative z-10 w-full sm:w-auto">
            <div className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center shadow-sm backdrop-blur-md shrink-0">
              <Zap className="text-slate-800 dark:text-white" size={32} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight mb-1">Optimization Engine</h3>
              <p className="text-slate-800 dark:text-white/80 text-sm sm:text-base font-medium">AI-powered financial tuning across transport, housing, subsidies & lifestyle</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold opacity-90 group-hover:opacity-100 group-hover:pr-2 transition-all relative z-10 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end sm:justify-start text-lg">
            Launch Engine <ArrowRight size={22} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Wealth+ Banner */}
        <div
          className="relative overflow-hidden bg-gradient-to-r from-[#059669] to-[#10b981] rounded-[2rem] p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer group shadow-[0_12px_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.7)] hover:-translate-y-1 transition-all duration-300 gap-6 mb-10"
          onClick={() => setView(ViewState.WEALTH_PLUS)}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:bg-white/20 transition-colors pointer-events-none"></div>

          <div className="flex items-center gap-5 sm:gap-6 relative z-10 w-full sm:w-auto">
            <div className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center shadow-sm backdrop-blur-md shrink-0">
              <TrendingUp className="text-slate-800 dark:text-white" size={32} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight mb-1">Wealth+</h3>
              <p className="text-slate-800 dark:text-white/80 text-sm sm:text-base font-medium">Unlock your potential with short & long term growth strategies</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold opacity-90 group-hover:opacity-100 group-hover:pr-2 transition-all relative z-10 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end sm:justify-start text-lg">
            Explore <ArrowRight size={22} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Smart Goals Section - Liquid Glass UI */}
        <div className="mt-8 mb-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              <Target className="text-blue-500" size={28} /> Smart Goals
            </h3>
          </div>

          <div className="flex flex-col gap-6">
            {smartGoals.map(goal => {
              const analysis = getRealisticAnalysis(goal);
              const monthlyRequired = goal.targetAmount / goal.deadlineMonths;
              const CategoryIcon = categories.find(c => c.name === goal.category)?.icon || Target;

              return (
                <div key={goal.id} className="relative overflow-hidden bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] p-6 sm:p-7 shadow-2xl flex flex-col sm:flex-row items-center justify-between group transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 gap-6">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:bg-blue-500/20 transition-colors pointer-events-none"></div>

                  <div className="flex items-center gap-5 sm:gap-6 relative z-10 w-full sm:w-auto flex-1">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 border border-white/10 text-slate-800 dark:text-white rounded-[20px] flex items-center justify-center shadow-inner backdrop-blur-md shrink-0">
                      <CategoryIcon size={28} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white tracking-tight leading-tight">{goal.name}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10">{goal.category}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Savings Goal</span>
                          <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">RM{goal.targetAmount.toString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-500" />
                          <span className="text-sm font-medium text-slate-400">{goal.deadlineMonths} Mo</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-white/10 pl-4 sm:pl-6 ml-0">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monthly:</span>
                          <span className="text-lg font-bold text-blue-400">RM{monthlyRequired.toLocaleString(undefined, { useGrouping: false, maximumFractionDigits: 0 })}/mo</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`px-5 py-3 rounded-2xl flex items-center gap-3 relative z-10 transition-colors border backdrop-blur-md sm:min-w-[280px] w-full sm:w-auto ${analysis.bg}`}>
                    <div className="shrink-0">
                      {analysis.status === 'Realistic' ? <CheckCircle2 size={18} className={analysis.color} strokeWidth={2.5} /> : <AlertTriangle size={18} className={analysis.color} strokeWidth={2.5} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[11px] font-bold ${analysis.color} uppercase tracking-wide leading-none mb-1`}>{analysis.status}</h4>
                      <p className={`text-[12px] ${analysis.color} font-medium opacity-90 leading-tight truncate`}>{analysis.text}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-20">
                    <button onClick={() => handleEditGoal(goal)} className="text-slate-500 hover:text-blue-400 transition-colors p-2.5 hover:bg-blue-500/10 rounded-full shrink-0">
                      <Plus size={18} className="rotate-45" /> {/* Just using an icon for edit or pen if I had one */}
                    </button>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="text-slate-500 hover:text-red-400 transition-colors p-2.5 hover:bg-red-500/10 rounded-full shrink-0">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Smart Goals Addition Trigger / Box */}
            {!isAddingGoal ? (
              <div
                onClick={() => setIsAddingGoal(true)}
                className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer group shadow-[0_12px_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.7)] hover:-translate-y-1 transition-all duration-300 gap-6 mt-8"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:bg-white/20 transition-colors pointer-events-none"></div>

                <div className="flex items-center gap-5 sm:gap-6 relative z-10 w-full sm:w-auto">
                  <div className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center shadow-sm backdrop-blur-md shrink-0">
                    <Plus className="text-slate-800 dark:text-white" size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-white tracking-tight mb-1">Add a new financial goal</h3>
                    <p className="text-slate-800 dark:text-white/80 text-sm sm:text-base font-medium">Define your next milestone and track your progress towards financial freedom</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-800 dark:text-white font-semibold opacity-90 group-hover:opacity-100 group-hover:pr-2 transition-all relative z-10 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end sm:justify-start text-lg">
                  Set New Goal <ArrowRight size={22} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden bg-[#131b2f] border border-blue-500/50 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_0_40px_rgba(59,130,246,0.2)] flex flex-col mt-8 animate-fade-in ring-1 ring-blue-500/20 w-full">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className="text-xl font-medium text-slate-800 dark:text-white tracking-tight flex items-center gap-2 pr-4"><Target size={20} className="text-blue-500" /> {editingGoalId ? 'Edit Smart Goal' : 'Configure Smart Goal'}</h3>
                  <button onClick={handleCancelGoal} className="text-slate-400 hover:text-slate-800 dark:text-white transition-colors bg-white/5 border border-white/10 backdrop-blur-md p-2 rounded-full hover:bg-white/10"><X size={18} strokeWidth={2.5} /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Goal Category</label>
                      <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
                        {categories.map((cat) => {
                          const Icon = cat.icon;
                          const selected = newGoal.category === cat.name;
                          return (
                            <button
                              key={cat.name}
                              onClick={() => setNewGoal({ ...newGoal, category: cat.name })}
                              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${selected ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#0b101b] border-slate-800 text-slate-500 hover:border-slate-600'}`}
                              title={cat.name}
                            >
                              <Icon size={20} className="mb-1" />
                              <span className="text-[10px] font-black uppercase tracking-tighter truncate w-full text-center">{cat.name.split('/')[0]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Goal Name</label>
                      <input type="text" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} placeholder="e.g. Dream Car Deposit" className="w-full bg-[#0b101b] text-slate-800 dark:text-white px-5 py-4 rounded-xl border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold text-base shadow-inner placeholder-slate-600" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Target Amount (RM)</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">RM</span>
                        <input type="number" value={newGoal.targetAmount || ''} onChange={e => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })} placeholder="10000" className="w-full bg-[#0b101b] text-slate-800 dark:text-white px-5 py-4 pl-14 rounded-xl border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold text-base shadow-inner placeholder-slate-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Timeframe (Months)</label>
                        <span className="text-blue-400 font-bold text-base bg-blue-500/10 px-4 py-1 rounded-full border border-blue-500/20">{newGoal.deadlineMonths} Months</span>
                      </div>
                      <div className="relative pt-2 pb-2">
                        <input
                          type="range"
                          min="1"
                          max="60"
                          step="1"
                          value={newGoal.deadlineMonths}
                          onChange={e => setNewGoal({ ...newGoal, deadlineMonths: Number(e.target.value) })}
                          className="w-full h-2 bg-[#0b101b] rounded-lg appearance-none cursor-pointer accent-blue-500 border border-slate-800"
                        />
                        <div className="flex justify-between mt-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                          <span>1 Month</span>
                          <span>60 Months</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button onClick={handleAddGoal} disabled={!newGoal.name || newGoal.targetAmount <= 0 || newGoal.deadlineMonths <= 0} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-slate-800 dark:text-white rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-2 disabled:bg-blue-900/50 disabled:text-blue-400 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                        {editingGoalId ? 'Update Goal' : 'Activate Goal'} <ArrowRight size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;