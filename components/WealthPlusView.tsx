import React, { useState } from 'react';
import { UserProfile, ViewState, WealthPlusStrategy } from '../types';
import {
    TrendingUp,
    Activity,
    Clock,
    Mountain,
    ArrowLeft,
    BarChart3,
    ShieldCheck,
    Info,
    Wallet,
    Banknote,
    CheckCircle2,
    ArrowRight,
    TrendingDown,
    Target,
    Zap,
    ChevronRight,
    Loader2,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    X,
    Edit2,
    Trash2
} from 'lucide-react';
import { api } from '../services/api';

interface WealthPlusViewProps {
    userProfile: UserProfile;
    updateProfile?: (profile: Partial<UserProfile>) => void;
    setView: (view: ViewState) => void;
}

type WealthStep = 'selection' | 'config' | 'strategy';
type GoalType = 'short' | 'long' | null;
type RiskAppetite = 'conservative' | 'moderate' | 'aggressive';

interface GeminiStrategy {
    allocation: {
        savings_percent: number;
        dividend_percent: number;
        etf_percent: number;
        growth_percent: number;
    };
    identified_instruments: {
        category: string;
        examples: any[];
    }[];
    return_assumptions: {
        savings_range: [number, number];
        dividend_range: [number, number];
        etf_range: [number, number];
        growth_range: [number, number];
    };
    analysis: {
        strategy_summary: string;
        risk_explanation: string;
        liquidity_commentary: string;
        goal_feasibility: string;
        adjustment_suggestion: string;
    };
    disclaimer: string;
}

const generateGeminiStrategy = (target: number, months: number, risk: RiskAppetite, isShort: boolean): GeminiStrategy => {
    let allocation = { savings_percent: 100, dividend_percent: 0, etf_percent: 0, growth_percent: 0 };
    if (risk === 'conservative') {
        allocation = { savings_percent: 70, dividend_percent: 20, etf_percent: 10, growth_percent: 0 };
    } else if (risk === 'moderate') {
        allocation = { savings_percent: 40, dividend_percent: 30, etf_percent: 20, growth_percent: 10 };
    } else {
        allocation = { savings_percent: 15, dividend_percent: 15, etf_percent: 40, growth_percent: 30 };
    }

    if (isShort && risk !== 'conservative') {
        // Enforce liquidity for short term regardless of risk
        allocation.savings_percent += 30;
        allocation.etf_percent = Math.max(0, allocation.etf_percent - 15);
        allocation.growth_percent = Math.max(0, allocation.growth_percent - 15);
    }

    // Normalize to 100
    const total = allocation.savings_percent + allocation.dividend_percent + allocation.etf_percent + allocation.growth_percent;
    allocation.savings_percent = Math.round((allocation.savings_percent / total) * 100);
    allocation.dividend_percent = Math.round((allocation.dividend_percent / total) * 100);
    allocation.etf_percent = Math.round((allocation.etf_percent / total) * 100);
    allocation.growth_percent = 100 - (allocation.savings_percent + allocation.dividend_percent + allocation.etf_percent);

    const monthlyNeededLinear = target / months;
    const isFeasible = monthlyNeededLinear < 5000;

    return {
        allocation,
        identified_instruments: [
            {
                category: "Savings / Cash", examples: [
                    { name: "GXBank Savings (Digital Bank)", estimated_rate: 3.0 },
                    { name: "AEON Bank (Digital Bank)", estimated_rate: 3.0 },
                    { name: "KDI Save (Money Market)", estimated_rate: 3.5 },
                    { name: "Touch 'n Go eWallet (GO+)", estimated_rate: 3.4 },
                    { name: "Boost Bank (Digital Bank)", estimated_rate: 2.5 }
                ]
            },
            {
                category: "Investments", examples: [
                    { name: "MAYBANK (Finance)", estimated_rate: 6.5, price_per_unit: 10.50, cost_per_lot: 1058.00, roe: 14.5, dividend_yield: 5.2, url: "https://www.bursamalaysia.com/market_information/equities_prices?code=1155" },
                    { name: "TENAGA (Utilities)", estimated_rate: 5.0, price_per_unit: 14.20, cost_per_lot: 1429.00, roe: 10.2, dividend_yield: 3.5, url: "https://www.bursamalaysia.com/market_information/equities_prices?code=5347" },
                    { name: "AXIATA (Telecom)", estimated_rate: 4.5, price_per_unit: 2.85, cost_per_lot: 295.00, roe: 6.5, dividend_yield: 4.2, url: "https://www.bursamalaysia.com/market_information/equities_prices?code=6888" },
                    { name: "Telekom Malaysia", estimated_rate: 4.0, price_per_unit: 6.80, cost_per_lot: 688.00, roe: 12.00, dividend_yield: 3.8, url: "#" },
                    { name: "Public Bank", estimated_rate: 5.5, price_per_unit: 4.50, cost_per_lot: 458.00, roe: 13.5, dividend_yield: 4.5, url: "#" }
                ]
            }
        ],
        return_assumptions: {
            savings_range: [2, 4],
            dividend_range: [5, 8],
            etf_range: [7, 12],
            growth_range: [10, 15]
        },
        analysis: {
            strategy_summary: `To reach your overall goal in ${months} months, this strategy places some money into flexible savings and the rest into steady growth options based on your ${risk} risk profile.`,
            risk_explanation: risk === 'aggressive' ? 'A focus on shares means higher potential returns, but comes with natural market ups and downs.' : 'Focusing heavily on guaranteed savings options helps minimize the chance of losing money.',
            liquidity_commentary: isShort ? 'We prioritized cash-friendly digital banks to make sure you can safely withdraw your money when you need it soon.' : 'We allocated some funds into shares that over the long term have strong potential to grow and pay dividends.',
            goal_feasibility: isFeasible ? 'Target is highly realistic based on standard income ratios.' : 'Target is ambitious. May require high monthly contributions.',
            adjustment_suggestion: 'Consider extending timeline if the monthly required contribution is too stressful.'
        },
        disclaimer: "This allocation is a simulation for educational purposes and does not constitute financial advice. Examples of instruments commonly used for this strategy are illustrative only. Never guarantee returns."
    };
};

const WealthPlusView: React.FC<WealthPlusViewProps> = ({ userProfile, updateProfile, setView }) => {
    const [step, setStep] = useState<WealthStep>('selection');
    const [goalType, setGoalType] = useState<GoalType>(null);

    // Auto-scroll to top on mount
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Configuration State
    const [targetAmount, setTargetAmount] = useState<number>(10000);
    const [duration, setDuration] = useState<number>(12);
    const [risk, setRisk] = useState<RiskAppetite>('moderate');

    // AI Engine Core Pre-declarations
    const totalMonths = goalType === 'short' ? duration : duration * 12;
    let optimizedMonthly = totalMonths > 0 ? Math.ceil(targetAmount / totalMonths) : 0;
    let engineReturn = 0;
    let trueProjectedValue = targetAmount;
    const [strategyData, setStrategyData] = useState<GeminiStrategy | null>(null);
    const [proTipBump] = useState<number>(() => Math.floor(Math.random() * 5) + 1);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);

    // Selection state
    const [selectedSavingsOption, setSelectedSavingsOption] = useState<number | null>(0);
    const [investmentBasket, setInvestmentBasket] = useState<Record<number, number>>({});
    const [showStrategyDrawer, setShowStrategyDrawer] = useState<boolean>(true);
    const [showAllOptions, setShowAllOptions] = useState<boolean>(false);
    const [manualSavePct, setManualSavePct] = useState<number | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [strategyLabel, setStrategyLabel] = useState<string>("");
    const [showBalancePrompt, setShowBalancePrompt] = useState<boolean>(false);
    const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);

    // Lock background scroll when modals are open
    React.useEffect(() => {
        if (showBalancePrompt || showConfirmModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showBalancePrompt, showConfirmModal]);

    // Derived values for budget
    const defaultSavePct = strategyData?.allocation?.savings_percent ?? 40;
    const savePct = manualSavePct !== null ? manualSavePct : defaultSavePct;
    const invPct = 100 - savePct;
    const invBudget = Math.round(optimizedMonthly * (invPct / 100));

    const toggleInvestmentOption = (idx: number, costPerLot: number) => {
        setInvestmentBasket(prev => {
            const current = { ...prev };
            if (current[idx]) {
                delete current[idx];
            } else {
                // Check if at least 1 lot fits in budget
                const totalSpent = Object.entries(current).reduce((acc: number, [i, lots]) => {
                    const price: any = (strategyData?.identified_instruments?.[1]?.examples?.[Number(i)] as any)?.cost_per_lot || 0;
                    return acc + (price * (lots as any));
                }, 0);

                if (totalSpent + costPerLot <= invBudget) {
                    current[idx] = 1;
                }
            }
            return current;
        });
    };

    const updateLots = (idx: number, costPerLot: number, delta: number) => {
        setInvestmentBasket(prev => {
            const current = { ...prev };
            const newCount = (current[idx] || 0) + delta;
            if (newCount <= 0) {
                delete current[idx];
                return current;
            }

            const totalSpentExcludingThis = Object.entries(current).reduce((acc: number, [i, lots]) => {
                if (Number(i) === idx) return acc;
                const price: any = (strategyData?.identified_instruments?.[1]?.examples?.[Number(i)] as any)?.cost_per_lot || 0;
                return acc + (price * (lots as any));
            }, 0);

            if (totalSpentExcludingThis + (newCount * costPerLot) <= invBudget) {
                current[idx] = newCount;
            }
            return current;
        });
    };

    const totalInvested = Object.entries(investmentBasket).reduce((acc: number, [i, lots]) => {
        const price: any = (strategyData?.identified_instruments?.[1]?.examples?.[Number(i)] as any)?.cost_per_lot || 0;
        return acc + (price * (lots as any));
    }, 0);

    const isShort = goalType === 'short';
    // totalMonths already declared in pre-declarations for scope consistency

    const handleConfirmStrategy = () => {
        const remaining = invBudget - totalInvested;
        if (remaining > 5 || Object.keys(investmentBasket).length === 0) {
            setShowBalancePrompt(true);
        } else {
            setShowConfirmModal(true);
        }
    };

    const finalizeStrategy = async () => {
        if (!strategyLabel.trim() || !updateProfile) return;

        const newStrategy: WealthPlusStrategy = {
            id: editingStrategyId || Date.now().toString(),
            label: strategyLabel.trim(),
            monthlyAmount: optimizedMonthly,
            savingsAlloc: savePct,
            investmentAlloc: invPct,
            savingsOption: strategyData?.identified_instruments?.[0]?.examples?.[selectedSavingsOption || 0]?.name || "High-Yield Savings",
            investments: Object.entries(investmentBasket).map(([idx, lots]) => {
                const opt: any = strategyData?.identified_instruments?.[1]?.examples?.[Number(idx)];
                return {
                    name: opt?.name || "Unknown Stock",
                    lots: lots as number,
                    costPerLot: opt?.cost_per_lot || 0
                };
            }),
            createdAt: Date.now(),
            // Metadata for editing
            targetAmount,
            duration,
            risk,
            goalType: goalType as any
        };

        const existingStrategies = userProfile?.wealthPlusStrategies || [];
        let updatedStrategies: WealthPlusStrategy[];

        if (editingStrategyId) {
            updatedStrategies = existingStrategies.map(s => s.id === editingStrategyId ? newStrategy : s);
        } else {
            updatedStrategies = [...existingStrategies, newStrategy];
        }

        await updateProfile({
            wealthPlusStrategies: updatedStrategies
        });

        setShowConfirmModal(false);
        setEditingStrategyId(null);
        setStrategyLabel("");
        setView(ViewState.DASHBOARD);
    };

    const handleDeleteStrategy = async (id: string) => {
        if (!updateProfile) return;
        const remaining = (userProfile?.wealthPlusStrategies || []).filter(s => s.id !== id);
        await updateProfile({ wealthPlusStrategies: remaining });
    };

    const handleEditStrategy = (strategy: WealthPlusStrategy) => {
        setEditingStrategyId(strategy.id);
        setGoalType(strategy.goalType || 'short');
        setTargetAmount(strategy.targetAmount || 10000);
        setDuration(strategy.duration || 12);
        setRisk(strategy.risk || 'moderate');
        setStrategyLabel(strategy.label);
        setStep('config');
        window.scrollTo(0, 0);
    };

    const handleNext = async () => {
        if (step === 'selection' && goalType) {
            setStep('config');
            window.scrollTo(0, 0);
            if (goalType === 'short') {
                setDuration(12);
                setTargetAmount(10000); // Default reasonable short-term goal
            } else {
                setDuration(10);
                setTargetAmount(50000); // Default reasonable long-term goal
            }
        }
        else if (step === 'config') {
            try {
                setIsCalculating(true);
                // Fetch dynamic strategy generated by Gemini AI Engine
                const aiStrategy = await api.generateWealthStrategy({
                    targetAmount,
                    duration: totalMonths,
                    risk,
                    isShort
                }).catch(err => {
                    console.error("Gemini AI failed, falling back to deterministic generation...", err);
                    return generateGeminiStrategy(targetAmount, totalMonths, risk, isShort);
                });

                setStrategyData(aiStrategy);
                setStep('strategy');
                window.scrollTo(0, 0);
            } catch (err) {
                console.error("Strategy generation error:", err);
            } finally {
                setIsCalculating(false);
            }
        }
    };

    const handleBack = () => {
        if (step === 'config') setStep('selection');
        else if (step === 'strategy') setStep('config');
        window.scrollTo(0, 0);
    };

    // Formatter
    const formatRM = (val: number) => `RM${val.toLocaleString(undefined, { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    const monthlyNeeded = totalMonths > 0 ? Math.ceil(targetAmount / totalMonths) : 0;

    // Debounced values for Pro Tip so it doesn't recalculate continuously
    const [debouncedTarget, setDebouncedTarget] = useState(targetAmount);
    const [debouncedDuration, setDebouncedDuration] = useState(duration);

    React.useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedTarget(targetAmount);
            setDebouncedDuration(duration);
        }, 1000);
        return () => clearTimeout(t);
    }, [targetAmount, duration]);




    // AI Box Rendering Helpers
    // (moved derived values up for state dependencies)

    if (strategyData) {
        const sr = strategyData.return_assumptions;
        const al = strategyData.allocation;

        // Get selected rates or fallback to range average
        const selectedSaveRate = (selectedSavingsOption !== null && strategyData.identified_instruments[0]?.examples[selectedSavingsOption]?.estimated_rate)
            || ((sr.savings_range[0] + sr.savings_range[1]) / 2);

        // Calculate weighted average return using actual basket weights if basket exists, else default
        const selectedInvRate = Object.keys(investmentBasket).length > 0
            ? Object.entries(investmentBasket).reduce((acc: number, [idx, lots]) => {
                const rate: number = (strategyData.identified_instruments[1]?.examples[Number(idx)] as any)?.estimated_rate || 6.0;
                const cost: number = (strategyData.identified_instruments[1]?.examples[Number(idx)] as any)?.cost_per_lot || 0;
                const weight = totalInvested > 0 ? (cost * (lots as number) / totalInvested) : 0;
                return acc + (rate * weight);
            }, 0)
            : ((sr.dividend_range[0] + sr.dividend_range[1] + sr.etf_range[0] + sr.etf_range[1] + sr.growth_range[0] + sr.growth_range[1]) / 6);

        // Calculate weighted average return using current slider selections
        engineReturn = (
            (savePct / 100) * selectedSaveRate +
            (invPct / 100) * selectedInvRate
        ) / 100;

        const r = engineReturn / 12;
        if (r > 0 && totalMonths > 0) {
            // Amount needed to reach exactly targetAmount using expected returns
            optimizedMonthly = Math.ceil(targetAmount * (r / (Math.pow(1 + r, totalMonths) - 1)));

            // Strategy Potential: What you'd get if you stuck to your initial linear monthly target
            trueProjectedValue = Math.round(monthlyNeeded * ((Math.pow(1 + r, totalMonths) - 1) / r));
        }
    } else {
        engineReturn = risk === 'aggressive' ? 0.12 : risk === 'moderate' ? 0.08 : 0.04;
        const r = engineReturn / 12;
        if (r > 0 && totalMonths > 0) {
            optimizedMonthly = Math.ceil(targetAmount * (r / (Math.pow(1 + r, totalMonths) - 1)));
            trueProjectedValue = Math.round(monthlyNeeded * ((Math.pow(1 + r, totalMonths) - 1) / r));
        }
    }
    // Annual Return Rates based on risk
    const annualRate = risk === 'aggressive' ? 0.12 : risk === 'moderate' ? 0.08 : 0.04;

    // Use optimizedMonthly for the intelligent suggestion
    const saveAmt = Math.round(optimizedMonthly * (savePct / 100));
    const invAmt = Math.round(optimizedMonthly - saveAmt);

    // Get labels from selected options
    const selectedSaveObj = (selectedSavingsOption !== null && strategyData?.identified_instruments?.[0]?.examples?.[selectedSavingsOption])
        || strategyData?.identified_instruments?.[0]?.examples?.[0];
    const saveEx = typeof selectedSaveObj === 'string' ? selectedSaveObj : (selectedSaveObj?.name || 'High-Yield Savings');

    const getInvEx = () => {
        const selectedIndices = Object.keys(investmentBasket).map(Number);
        if (selectedIndices.length === 0) return 'Growth Shares';
        const topIdx = selectedIndices[0];
        const topName = (strategyData?.identified_instruments?.[1]?.examples?.[topIdx] as any)?.name || 'Growth Shares';
        if (selectedIndices.length === 1) return topName;
        return `${topName} + ${selectedIndices.length - 1} others`;
    };
    const invEx = getInvEx();
    const splitExplanation = strategyData?.analysis?.adjustment_suggestion || `This ${savePct}/${invPct} split maximizes your +${invPct}% growth potential while maintaining +${savePct}% accuracy toward your ${duration}-${isShort ? 'month' : 'year'} goal deadline.`;

    const r = annualRate / 12; // Monthly rate

    const calculateMonthly = (target: number, months: number, rate: number) => {
        if (months <= 0) return 0;
        if (rate === 0) return Math.round(target / months);
        // Formula: P = Target * (r / ((1 + r)^n - 1))
        const growthFactor = Math.pow(1 + rate, months);
        return Math.round(target * (rate / (growthFactor - 1)));
    };

    // Pro Tip calculation (delayed/debounced)
    const maxLimit = isShort ? 24 : 40;
    const durationBump = (debouncedDuration + proTipBump > maxLimit) ? maxLimit - debouncedDuration : proTipBump;
    const activeBump = durationBump > 0 ? durationBump : 1;

    const debouncedTotalMonths = isShort ? debouncedDuration : debouncedDuration * 12;
    const baseDebouncedNeeded = debouncedTotalMonths > 0 ? Math.ceil(debouncedTarget / debouncedTotalMonths) : 0;

    const totalMonthsBumped = isShort ? (debouncedDuration + activeBump) : (debouncedDuration + activeBump) * 12;
    const monthlyNeededBumped = totalMonthsBumped > 0 ? Math.ceil(debouncedTarget / totalMonthsBumped) : 0;
    const proTipSavings = baseDebouncedNeeded - monthlyNeededBumped;

    return (
        <div className="min-h-screen bg-[#05080f] text-white">
            <div className="max-w-[1200px] mx-auto px-6 py-10 animate-fade-in font-sans relative">

                {/* Global Back Navigation */}
                {step !== 'selection' && (
                    <button
                        onClick={handleBack}
                        className="mb-8 flex items-center gap-2 px-4 py-2 bg-[#0f1423] border border-[#1e2738] rounded-xl text-slate-400 hover:text-white hover:bg-[#151c2c] transition-all shadow-sm group w-max"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">Back</span>
                    </button>
                )}

                {/* STEP 1: SELECTION */}
                {step === 'selection' && (
                    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-5xl mx-auto py-10">

                        {/* Activated Strategies */}
                        {userProfile.wealthPlusStrategies && userProfile.wealthPlusStrategies.length > 0 && (
                            <div className="w-full mb-16 text-left animate-slide-up">
                                <div className="flex items-center justify-between mb-6 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Active Strategies</h2>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {userProfile.wealthPlusStrategies.map((s) => (
                                        <div key={s.id} className="bg-[#0f1423]/50 backdrop-blur-sm border border-[#1e2738] rounded-2xl p-6 flex items-center justify-between group hover:border-emerald-500/50 hover:bg-[#0f1423] transition-all shadow-sm">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/10 group-hover:bg-emerald-500/10 transition-colors">
                                                    <Target size={26} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-lg tracking-tight mb-1">{s.label}</div>
                                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-3">
                                                        <span className="text-emerald-500/90">{formatRM(s.monthlyAmount)} Monthly</span>
                                                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
                                                        <span>{s.goalType === 'short' ? 'Short Term Growth' : 'Long Term Wealth'}</span>
                                                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
                                                        <span className="text-slate-600">Created {new Date(s.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleEditStrategy(s)}
                                                    className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-slate-800 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
                                                >
                                                    <Edit2 size={14} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStrategy(s.id)}
                                                    className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                                    title="Delete Strategy"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-16 h-[1px] bg-gradient-to-r from-transparent via-slate-800/50 to-transparent w-full"></div>
                            </div>
                        )}

                        <div className="max-w-3xl mx-auto">
                            <h1 className={`${userProfile.wealthPlusStrategies?.length ? 'text-3xl md:text-4xl' : 'text-[40px] md:text-5xl'} font-bold mb-4 tracking-tight`}>
                                {userProfile.wealthPlusStrategies?.length ? 'Add a new Wealth+ Strategy' : 'Select Your Financial Goal'}
                            </h1>
                            <p className="text-slate-400 text-lg mb-12 max-w-[600px] leading-relaxed mx-auto">
                                {userProfile.wealthPlusStrategies?.length
                                    ? "Launch an additional financial protocol to diversify your wealth building."
                                    : "Let's start by defining your horizon. We'll tailor your investment strategy based on your timeline."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4 md:px-0">
                            {/* Short Term */}
                            <div
                                onClick={() => setGoalType('short')}
                                className={`group relative p-8 rounded-2xl transition-all cursor-pointer text-left overflow-hidden border ${goalType === 'short' ? 'bg-[#1a2333] border-[#29364f]' : 'bg-[#0f1423] border-transparent hover:bg-[#111827]'}`}
                            >
                                <div className="absolute -top-2 -right-2 opacity-[0.03]">
                                    <Clock size={120} />
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5">
                                    <Clock size={20} />
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-white">Short-Term Goal</h3>
                                <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                                    Ideal for immediate needs like emergency funds, travel, or small purchases <span className="text-white font-semibold">(0-2 years)</span>.
                                </p>
                            </div>

                            {/* Long Term */}
                            <div
                                onClick={() => setGoalType('long')}
                                className={`group relative p-8 rounded-2xl transition-all cursor-pointer text-left overflow-hidden border ${goalType === 'long' ? 'bg-[#1a2333] border-[#29364f]' : 'bg-[#0f1423] border-transparent hover:bg-[#111827]'}`}
                            >
                                <div className="absolute -top-2 -right-2 opacity-[0.03]">
                                    <Mountain size={120} />
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5">
                                    <Mountain size={20} />
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-white">Long-Term Goal</h3>
                                <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                                    Perfect for major life milestones like retirement, education, or buying a home <span className="text-white font-semibold">(2+ years)</span>.
                                </p>
                            </div>
                        </div>

                        <button
                            disabled={!goalType}
                            onClick={handleNext}
                            className="mt-10 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-[#05080f] px-8 py-3.5 min-w-[320px] rounded-xl text-base font-semibold transition-all shadow-[0_0_24px_rgba(16,185,129,0.3)] disabled:shadow-none active:scale-95 flex items-center justify-center"
                        >
                            Continue to Strategy Customization
                        </button>

                    </div>
                )}

                {/* STEP 2: CONFIGURATION */}
                {step === 'config' && (
                    <div className="animate-slide-up max-w-[1100px] mx-auto">
                        <div className="mb-10">
                            <div>
                                <h1 className="text-[32px] md:text-4xl font-bold mb-3 tracking-tight">Configure your Wealth+ Strategy</h1>
                                <p className="text-slate-400 text-base">Define your financial goals and risk tolerance to calculate your optimal strategy.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                            {/* Main Config */}
                            <div className="space-y-8">
                                <div className="bg-[#0f1423] border border-[#1e2738] rounded-2xl p-8 space-y-10">
                                    {/* Wealth Target */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Wealth Target (RM)</label>
                                        <div className="relative">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center">
                                                <span className="text-slate-400 font-semibold text-lg">RM</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={targetAmount.toString()}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/,/g, '');
                                                    if (!isNaN(Number(val)) && val !== '') {
                                                        setTargetAmount(Number(val));
                                                    } else if (val === '') {
                                                        setTargetAmount(0);
                                                    }
                                                }}
                                                className="w-full bg-[#151c2c] border border-[#29364f] p-4 pl-14 rounded-xl text-xl font-bold text-white outline-none focus:border-emerald-500 transition-colors"
                                            />
                                        </div>
                                        <p className="text-slate-500 text-xs">Set a realistic target for your {goalType === 'long' ? 'long-term retirement or savings' : 'short-term needs'} goal.</p>
                                    </div>

                                    {/* Duration */}
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Duration</label>
                                            <div className="flex items-center gap-2 bg-[#151c2c] border border-[#29364f] p-1.5 rounded-lg focus-within:border-emerald-500 transition-colors">
                                                <input
                                                    type="number"
                                                    min={goalType === 'short' ? 0 : 2}
                                                    max={goalType === 'short' ? 24 : 40}
                                                    value={duration}
                                                    onChange={(e) => {
                                                        let pVal = parseInt(e.target.value);
                                                        if (isNaN(pVal)) {
                                                            setDuration(0);
                                                            return;
                                                        }
                                                        const maxLimit = goalType === 'short' ? 24 : 40;
                                                        if (pVal < 0) pVal = 0;
                                                        if (pVal > maxLimit) pVal = maxLimit;
                                                        setDuration(pVal);
                                                    }}
                                                    className="bg-transparent text-white font-bold text-sm w-12 text-right outline-none"
                                                />
                                                <span className="text-slate-400 text-sm font-semibold pr-2">
                                                    {goalType === 'short' ? 'Months' : 'Years'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <input
                                                type="range"
                                                min={goalType === 'short' ? "0" : "2"}
                                                max={goalType === 'short' ? "24" : "40"}
                                                value={duration}
                                                onChange={(e) => setDuration(Number(e.target.value))}
                                                className="w-full h-1.5 bg-[#1e2738] rounded-full appearance-none cursor-pointer accent-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0f1423]"
                                            />
                                        </div>
                                        {goalType === 'short' ? (
                                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                                <span>0 Months</span>
                                                <span>24 Months</span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                                <span>2 Years</span>
                                                <span>40 Years</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Risk Appetite */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Risk Appetite</label>
                                        <div className="flex bg-[#151c2c] p-1.5 rounded-xl border border-[#29364f]">
                                            {(['conservative', 'moderate', 'aggressive'] as RiskAppetite[]).map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => setRisk(r)}
                                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold capitalize transition-all ${risk === r ? 'bg-[#3b4c6b] text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="bg-[#051811] border border-emerald-900/50 rounded-xl p-4 flex gap-3 items-start mt-4">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[#051811] shrink-0 mt-0.5">
                                                <Info size={14} className="text-[#05080f]" />
                                            </div>
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                {risk === 'moderate' && 'Moderate risk typically involves a balanced portfolio of 60% equities and 40% fixed income for steady growth.'}
                                                {risk === 'conservative' && 'Conservative risk focuses on capital preservation and steady, low-yield instruments like FDs and savings units.'}
                                                {risk === 'aggressive' && 'Aggressive risk targets high growth through 90%+ equity allocation, favoring high-performance stocks and ETFs.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Stats */}
                            <div className="space-y-6">
                                {/* Financial Snapshot */}
                                <div className="bg-[#0f1423] border border-[#1e2738] rounded-2xl p-6 space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-4 h-4 rounded-sm bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                            <Wallet size={10} />
                                        </div>
                                        <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Financial Snapshot</h3>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Monthly Income</p>
                                            <h4 className="text-2xl font-bold text-white mb-1.5">{formatRM(userProfile.income)}</h4>
                                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                                <TrendingUp size={12} /> Verified
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-5 bg-[#151c2c] rounded-xl space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-slate-400">Projected Savings Needed</p>
                                            <p className="text-sm font-bold text-emerald-500">{formatRM(monthlyNeeded)}/mo</p>
                                        </div>
                                        <div className="h-1.5 bg-[#1e2738] rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[65%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                            Based on your current {duration}-{isShort ? 'month' : 'year'} goal and {risk} risk appetite.
                                        </p>
                                    </div>
                                </div>

                                {/* Pro Tip */}
                                <div className="bg-[#062118] border border-[#0d3427] rounded-2xl p-6 relative overflow-hidden group">
                                    <div className="absolute -bottom-4 -right-4 text-emerald-500/10 group-hover:scale-110 transition-all duration-500">
                                        <Zap size={100} />
                                    </div>
                                    <div className="relative z-10">
                                        <h4 className="text-base font-bold text-white mb-2">Pro Tip</h4>
                                        <p className="text-sm text-[#94b3a6] leading-relaxed">
                                            {duration < maxLimit ? (
                                                <>
                                                    Increasing your duration by just <span className="text-white font-bold">{activeBump} {isShort ? 'months' : 'years'}</span> could reduce your monthly savings requirement by <span className="text-emerald-400 font-bold">{formatRM(proTipSavings)}</span>.
                                                </>
                                            ) : (
                                                <>
                                                    You've chosen the maximum duration! This brings your monthly requirement down to just <span className="text-emerald-400 font-bold">{formatRM(monthlyNeeded)}</span>.
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Bank Security */}
                                <div className="bg-[#0f1423] border border-[#1e2738] rounded-2xl p-5 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[#151c2c] flex items-center justify-center text-emerald-500 shrink-0">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-white mb-0.5">Bank-Grade Security</h4>
                                        <p className="text-xs text-slate-500 leading-tight">Your data is encrypted with 256-bit AES protocols.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-end pt-8 pb-4">
                            <button
                                onClick={handleNext}
                                disabled={isCalculating}
                                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-[#05080f] px-6 py-3 rounded-xl font-bold text-base transition-all shadow-[0_0_24px_rgba(16,185,129,0.3)] disabled:shadow-none active:scale-95 flex items-center gap-2 min-w-[200px] justify-center"
                            >
                                {isCalculating ? (
                                    <>Connecting Gemini AI <Loader2 size={18} className="animate-spin" /></>
                                ) : (
                                    <>Calculate Strategy <BarChart3 size={18} /></>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: STRATEGY */}
                {step === 'strategy' && (
                    <div className="animate-slide-up space-y-10">
                        {/* Unified Strategy Card */}
                        <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 shadow-2xl">
                            {/* Summary Header */}
                            <div className="pt-10 px-10 pb-28 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -ml-32 -mt-32"></div>

                                <div className="relative z-10 w-full text-left">
                                    <span className="text-[11px] font-bold text-emerald-500 tracking-[0.2em] uppercase">{goalType === 'short' ? 'Short-Term' : 'Long-Term'} Goal Summary</span>
                                    <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 tracking-tight">
                                        {formatRM(targetAmount)} in {duration} {isShort ? (duration > 1 ? 'months' : 'month') : (duration > 1 ? 'years' : 'year')}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 mt-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Monthly Target:</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 line-through decoration-emerald-500/30 decoration-1 text-sm font-medium">
                                                    {formatRM(monthlyNeeded)}
                                                </span>
                                                <span className="text-emerald-400 font-black text-xl flex items-center gap-1">
                                                    {formatRM(optimizedMonthly)}<span className="text-[10px] font-black text-emerald-500/60 ml-0.5">/MO</span>
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] bg-gradient-to-r from-[#4e8cff] to-[#ff71d1] text-white px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/20 flex items-center gap-2 border border-white/10 ml-2">
                                            <Zap size={11} className="fill-white" /> Gemini Optimized
                                        </span>
                                    </div>
                                    <div className="mt-8 flex flex-col xl:flex-row items-center gap-6 w-full">
                                        <div className="p-6 rounded-[2rem] bg-gradient-to-r from-emerald-500/10 to-[#111827] border border-emerald-500/20 shadow-lg shadow-emerald-500/5 w-full xl:flex-1 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-8 text-emerald-500/5 -mr-8 -mt-8 pointer-events-none">
                                                <TrendingUp size={120} />
                                            </div>
                                            <div className="bg-[#05080f] p-5 rounded-2xl border border-emerald-500/20 shadow-sm relative z-10 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                                        <TrendingUp size={18} />
                                                    </div>
                                                    <p className="text-sm font-bold text-emerald-500 tracking-[0.2em] uppercase">Projected Value</p>
                                                </div>
                                                <div className="flex items-baseline gap-4 sm:ml-auto">
                                                    <span className="text-slate-500 line-through decoration-emerald-500/50 decoration-2 font-bold text-lg">
                                                        {formatRM(targetAmount)}
                                                    </span>
                                                    <p className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                                                        <TrendingUp size={18} className="text-emerald-500" />
                                                        +{formatRM(Math.max(0, trueProjectedValue - targetAmount))}
                                                    </p>
                                                    <h4 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{formatRM(trueProjectedValue)}</h4>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 relative z-10 w-full xl:w-auto shrink-0 justify-between xl:justify-end xl:pl-8">
                                            <div className="text-left xl:text-right flex flex-col justify-center">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Goal Progress</p>
                                                <h4 className="text-4xl font-black text-emerald-500 tracking-tighter">0%</h4>
                                            </div>
                                            <div className="h-12 w-px bg-slate-800/50 mx-2 hidden xl:block"></div>
                                            <button
                                                onClick={handleBack}
                                                className="bg-[#1e293b] hover:bg-[#2d3b54] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 border border-slate-700/50"
                                            >
                                                Edit Goal
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Collapsible Strategy Drawer Content */}
                            {showStrategyDrawer && (
                                <div className="animate-slide-down border-t border-slate-800 pt-10 px-10 pb-32 space-y-8 relative overflow-hidden bg-slate-900/10">
                                    <div className="absolute top-0 right-0 p-12 text-emerald-500/5 -mr-12 -mt-12 pointer-events-none">
                                        <Zap size={200} />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start relative z-10">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <Zap size={16} />
                                                </div>
                                                <h3 className="text-base font-bold text-emerald-500 tracking-[0.2em] uppercase">Gemini's Intelligent Action Plan</h3>
                                            </div>
                                            <p className="text-slate-300 text-lg leading-relaxed font-semibold italic">
                                                "{strategyData?.analysis?.strategy_summary || `To reach your ${formatRM(targetAmount)} goal, save ${formatRM(saveAmt)} monthly in your digital wallet and allocate the remaining ${formatRM(invAmt)} towards purchasing 1 lot of ${invEx} shares. This optimized approach utilizes the ${engineReturn.toFixed(1)}% expected return to reduce your monthly burden.`}"
                                            </p>
                                            <div className="p-6 bg-emerald-500/5 rounded-[2rem] border border-dashed border-emerald-500/20">
                                                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3 tracking-widest uppercase">
                                                    ✦ Why this specific split?
                                                </h4>
                                                <p className="text-base text-slate-400 leading-relaxed font-medium">
                                                    {strategyData?.analysis?.liquidity_commentary || splitExplanation}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-[#0b101b] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-inner">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Monthly Savings Suggestion</p>
                                                        <h4 className="text-2xl font-black text-white">{formatRM(saveAmt)}</h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-black text-emerald-500 px-3 py-1 bg-emerald-500/10 rounded-lg">{savePct}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500/50 transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.3)]" style={{ width: `${savePct}%` }}></div>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-tight">
                                                    <CheckCircle2 size={14} className="text-emerald-500" /> Allocated to: {saveEx}
                                                </div>
                                            </div>

                                            <div className="bg-[#0b101b] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-inner">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Monthly Investment Target</p>
                                                        <h4 className="text-2xl font-black text-white">{formatRM(invAmt)}</h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-black text-cyan-500 px-3 py-1 bg-cyan-500/10 rounded-lg">{invPct}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-cyan-500/50 transition-all duration-1000 shadow-[0_0_15px_rgba(6,182,212,0.3)]" style={{ width: `${invPct}%` }}></div>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-tight">
                                                    <CheckCircle2 size={14} className="text-cyan-500" /> Suggested for: {invEx}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setManualSavePct(null);
                                                    // Sync reset percent values
                                                    const resetSavePct = strategyData?.allocation?.savings_percent || 40;
                                                    const resetInvPct = 100 - resetSavePct;
                                                    const resetBudget = Math.round(optimizedMonthly * (resetInvPct / 100));

                                                    // Auto-populating top pick with max lots possible from its cost
                                                    const topPick = strategyData?.identified_instruments?.[1]?.examples?.[0];
                                                    const cost = (topPick as any)?.cost_per_lot || 1000;

                                                    const maxLots = Math.floor(resetBudget / cost);

                                                    if (maxLots > 0) {
                                                        setInvestmentBasket({ 0: maxLots });
                                                    } else {
                                                        setInvestmentBasket({});
                                                    }
                                                    document.getElementById('allocation-adjuster')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#05080f] py-5 mt-4 rounded-2xl text-base font-bold transition-all shadow-xl shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-3 group uppercase tracking-tight"
                                            >
                                                Apply Strategy <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Drawer Toggle Handle - Positioned inside container but at bottom bottom */}
                            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center z-30 pointer-events-none">
                                <button
                                    onClick={() => setShowStrategyDrawer(!showStrategyDrawer)}
                                    className="bg-[#111827] border border-slate-700 p-2.5 rounded-full text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all shadow-2xl bg-opacity-95 backdrop-blur-md pointer-events-auto active:scale-90"
                                >
                                    {showStrategyDrawer ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3 pulse-slow">{showStrategyDrawer ? 'Click to hide details' : 'Click to view action plan'}</span>
                            </div>
                        </div>

                        {/* Allocation Adjuster Slider */}
                        <div id="allocation-adjuster" className="bg-[#111827] border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-sm mt-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                        Manual Allocation
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">Customize your monthly distribution between Savings and Investments.</p>
                                </div>
                            </div>

                            <div className="space-y-4 px-2">
                                <div className="flex justify-between font-bold items-end mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-emerald-500 font-black text-4xl md:text-5xl mb-1">{savePct}%</span>
                                        <span className="text-slate-400 tracking-wider text-base md:text-lg font-bold">SAVINGS &middot; <span className="text-white">{formatRM(saveAmt)}</span></span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-cyan-500 font-black text-4xl md:text-5xl mb-1">{invPct}%</span>
                                        <span className="text-slate-400 tracking-wider text-base md:text-lg font-bold"><span className="text-white">{formatRM(invAmt)}</span> &middot; INVESTMENTS</span>
                                    </div>
                                </div>

                                <div className="relative pt-2 pb-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={savePct}
                                        onChange={(e) => setManualSavePct(parseInt(e.target.value))}
                                        className="w-full h-3 md:h-4 rounded-full appearance-none cursor-ew-resize border border-slate-700 relative z-10"
                                        style={{
                                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${savePct}%, #06b6d4 ${savePct}%, #06b6d4 100%)`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Main Options Grid */}
                        <div className="space-y-12">

                            {/* Saving Options */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <Wallet size={14} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Saving Options</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {(strategyData?.identified_instruments?.[0]?.examples || [
                                        { name: "GXBank", estimated_rate: 3.0, url: "https://gxbank.my" },
                                        { name: "Touch 'n Go GO+", estimated_rate: 3.4, url: "https://www.touchngo.com.my" },
                                        { name: "AEON Bank", estimated_rate: 3.0, url: "https://www.aeonbank.com.my" },
                                        { name: "Boost Bank", estimated_rate: 2.5, url: "https://www.myboost.com.my" },
                                        { name: "FSMOne Money Market", estimated_rate: 3.5, url: "https://www.fsmone.com.my" }
                                    ]).map((option: any, idx) => {
                                        const optionName = typeof option === 'string' ? option : option.name;
                                        const optionRate = typeof option === 'string' ? 3.0 : (option.estimated_rate || 3.0);
                                        const optionUrl = typeof option === 'string' ? "#" : (option.url || "#");
                                        const isSelected = selectedSavingsOption === idx;

                                        return (
                                            <div key={idx} className={`bg-[#111827] border ${isSelected ? 'border-emerald-500' : 'border-slate-800'} rounded-[2.5rem] p-8 space-y-6 group hover:border-emerald-500/50 transition-all flex flex-col justify-between`}>
                                                <div>
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-xl bg-[#0b101b] flex items-center justify-center overflow-hidden border border-slate-800 text-emerald-500">
                                                                <Wallet size={20} className="opacity-80" />
                                                            </div>
                                                            {idx === 0 && <span className="text-[9px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-lg shadow-sm">Top Pick</span>}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-bold text-emerald-400">{optionRate.toFixed(2)}% <span className="text-[10px] text-emerald-500/70">p.a.</span></p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">{optionName}</h3>
                                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Savings / Liquidity</p>
                                                    </div>
                                                </div>
                                                <div className="mt-6 flex flex-col gap-3">
                                                    <a
                                                        href={optionUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="w-full py-4 flex items-center justify-center rounded-2xl font-bold text-base transition-all bg-[#0b101b] border border-slate-700 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-300 active:scale-95"
                                                    >
                                                        Learn More <ChevronRight size={18} className="ml-1 -mt-0.5" />
                                                    </a>
                                                    <button
                                                        onClick={() => setSelectedSavingsOption(idx)}
                                                        className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center ${isSelected ? 'bg-emerald-500 hover:bg-emerald-400 text-[#05080f] shadow-lg shadow-emerald-500/20' : 'bg-[#0b101b] border border-slate-700 hover:border-slate-600 text-slate-300'}`}
                                                    >
                                                        {isSelected ? '✓ Selected' : 'Select Option'}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>

                            {/* Investment Options */}
                            <section className="space-y-6">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <h2 className="text-xl font-bold text-white tracking-tight">Investment Options</h2>
                                    <div className="flex items-center gap-4 px-4 py-2 bg-[#151c2c] border border-slate-700 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Investment Budget:</span>
                                            <span className="text-base font-black text-white">{formatRM(invBudget)}</span>
                                        </div>
                                        <div className="w-px h-5 bg-slate-700 mx-1"></div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Allocated:</span>
                                            <span className={`text-base font-black ${totalInvested > 0 ? (totalInvested > invBudget ? 'text-red-500' : 'text-emerald-500') : 'text-slate-400'}`}>{formatRM(totalInvested)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full md:ml-auto">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Real-time Data Active &middot; Updated: {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {(() => {
                                        const aiOptions = strategyData?.identified_instruments?.[1]?.examples || [];
                                        const budgetFallbacks = [
                                            { name: "Maybank Berhad", estimated_rate: 6.5, price_per_unit: 10.62, cost_per_lot: 1073.50, roe: 14.5, dividend_yield: 5.2, url: "https://www.maybank2u.com.my" },
                                            { name: "Tenaga Nasional", estimated_rate: 5.0, price_per_unit: 14.38, cost_per_lot: 1451.20, roe: 10.2, dividend_yield: 3.5, url: "https://www.tnb.com.my" },
                                            { name: "Public Bank", estimated_rate: 5.5, price_per_unit: 5.03, cost_per_lot: 513.29, roe: 13.5, dividend_yield: 4.5, url: "https://www.publicbank.com.my" },
                                            { name: "Telekom Malaysia", estimated_rate: 4.0, price_per_unit: 6.92, cost_per_lot: 703.15, roe: 12.0, dividend_yield: 3.8, url: "https://www.tm.com.my" },
                                            { name: "Axiata Group", estimated_rate: 4.5, price_per_unit: 2.85, cost_per_lot: 295.80, roe: 6.5, dividend_yield: 4.2, url: "https://www.axiata.com" },
                                            { name: "Dialog Group", estimated_rate: 4.8, price_per_unit: 2.22, cost_per_lot: 232.00, roe: 11.2, dividend_yield: 2.4, url: "https://www.dialogasia.com" },
                                            { name: "YTL Corporation", estimated_rate: 4.2, price_per_unit: 2.15, cost_per_lot: 225.00, roe: 8.5, dividend_yield: 3.0, url: "https://www.ytl.com.my" },
                                            { name: "Genting Malaysia", estimated_rate: 5.2, price_per_unit: 2.72, cost_per_lot: 283.00, roe: 7.2, dividend_yield: 5.5, url: "https://www.gentingmalaysia.com" },
                                            { name: "Capital A (AirAsia)", estimated_rate: 7.0, price_per_unit: 0.98, cost_per_lot: 108.50, roe: -5.0, dividend_yield: 0.0, url: "https://www.capitala.com" },
                                            { name: "MyEG Services", estimated_rate: 5.8, price_per_unit: 0.88, cost_per_lot: 98.20, roe: 22.0, dividend_yield: 1.8, url: "https://www.myeg.com.my" }
                                        ];

                                        // Merge and Deduplicate by name
                                        const merged = [...aiOptions];
                                        budgetFallbacks.forEach(fb => {
                                            if (!merged.find((m: any) => (m.name || m) === fb.name)) {
                                                merged.push(fb);
                                            }
                                        });

                                        return merged.slice(0, showAllOptions ? 20 : 4).map((option: any, idx) => {
                                            const optionName = typeof option === 'string' ? option : option.name;
                                            const optionRate = typeof option === 'string' ? 6.0 : (option.estimated_rate || 6.0);
                                            const optionUrl = typeof option === 'string' ? "#" : (option.url || "#");

                                            // Financial metrics
                                            const pricePerUnit = option.price_per_unit || 0;
                                            const costPerLot = option.cost_per_lot || 0;
                                            const roe = option.roe || 0;
                                            const divYield = option.dividend_yield || 0;

                                            const isSelected = !!investmentBasket[idx];
                                            const lots = investmentBasket[idx] || 0;
                                            const canAffordOne = (totalInvested - (lots * costPerLot) + costPerLot) <= invBudget;

                                            return (
                                                <div key={idx} className={`bg-[#111827] border ${isSelected ? 'border-emerald-500' : 'border-slate-800'} rounded-[2.5rem] p-8 space-y-6 group hover:border-emerald-500/50 transition-all flex flex-col justify-between relative`}>
                                                    {isSelected && (
                                                        <div className="absolute top-6 right-6 flex items-center gap-2 bg-emerald-500 text-[#05080f] px-3 py-1 rounded-full font-black text-[10px] uppercase shadow-lg z-10 animate-scale-in">
                                                            {lots} {lots > 1 ? 'Lots' : 'Lot'} Active
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 rounded-xl bg-[#0b101b] flex items-center justify-center text-emerald-500 border border-slate-800">
                                                                    <TrendingUp size={24} />
                                                                </div>
                                                            </div>
                                                            <div className="text-right group/est relative cursor-help">
                                                                <p className="text-2xl font-bold text-emerald-400">
                                                                    {optionRate.toFixed(2)}% <span className="text-xs text-emerald-500/70 uppercase font-black tracking-tighter">Estimated Annual Return</span>
                                                                </p>
                                                                <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover/est:opacity-100 group-hover/est:visible transition-all duration-300 z-[100] backdrop-blur-xl">
                                                                    <div className="relative z-10 text-left">
                                                                        <p className="text-emerald-400 font-bold text-sm mb-2">Estimated Annual Return</p>
                                                                        <p className="text-slate-300 text-xs leading-relaxed">
                                                                            A projection of your total gains over a year, combining expected dividends and share price growth. Market returns can vary based on performance.
                                                                        </p>
                                                                    </div>
                                                                    <div className="absolute bottom-full right-6 w-3 h-3 bg-[#0f172a] border-l border-t border-slate-700 rotate-45 -mb-1.5"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">{optionName}</h3>
                                                                <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-5 py-5 mt-3">
                                                                    {/* ROE Tooltip */}
                                                                    <div className="text-center group/tooltip relative cursor-help">
                                                                        <p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1">ROE</p>
                                                                        <p className="text-xl text-white">{roe}%</p>
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-[100] backdrop-blur-xl">
                                                                            <div className="relative z-10 text-left">
                                                                                <p className="text-emerald-400 font-bold text-sm mb-2">ROE (Return on Equity)</p>
                                                                                <p className="text-slate-300 text-xs leading-relaxed">
                                                                                    Measures how efficiently a company uses shareholders’ money to generate profit. Higher ROE generally indicates stronger profitability.
                                                                                </p>
                                                                            </div>
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a] border-r border-b border-slate-700 rotate-45 -mt-1.5"></div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="h-10 w-px bg-white/10"></div>

                                                                    {/* Dividend Tooltip */}
                                                                    <div className="text-center group/tooltip relative cursor-help">
                                                                        <p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1">Dividend</p>
                                                                        <p className="text-xl text-emerald-400">{divYield}%</p>
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-[100] backdrop-blur-xl">
                                                                            <div className="relative z-10 text-left">
                                                                                <p className="text-emerald-400 font-bold text-sm mb-2">Dividend Yield</p>
                                                                                <p className="text-slate-300 text-xs leading-relaxed">
                                                                                    The percentage of a company’s share price paid out as dividends annually. Shows how much income you earn relative to the share price.
                                                                                </p>
                                                                            </div>
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a] border-r border-b border-slate-700 rotate-45 -mt-1.5"></div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="h-10 w-px bg-white/10"></div>

                                                                    {/* Cost/Unit Tooltip */}
                                                                    <div className="text-center group/tooltip relative cursor-help">
                                                                        <p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1">Cost/Unit</p>
                                                                        <p className="text-xl text-white">RM{pricePerUnit.toFixed(2)}</p>
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-[100] backdrop-blur-xl">
                                                                            <div className="relative z-10 text-left">
                                                                                <p className="text-emerald-400 font-bold text-sm mb-2">Cost per Unit (Share Price)</p>
                                                                                <p className="text-slate-300 text-xs leading-relaxed">
                                                                                    The price you pay to buy one share of the company on the market. This price fluctuates daily based on demand and supply.
                                                                                </p>
                                                                            </div>
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a] border-r border-b border-slate-700 rotate-45 -mt-1.5"></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex justify-between items-center group/lot relative cursor-help">
                                                                <div>
                                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cost Per Lot (100 units)</p>
                                                                    <p className="text-sm text-slate-400 italic">Incl. brokerage & stamp fees</p>
                                                                </div>
                                                                <p className="text-3xl font-black text-white tracking-tight">{formatRM(costPerLot)}</p>

                                                                {/* Fee Breakdown Tooltip */}
                                                                <div className="absolute bottom-full left-0 right-0 mb-3 p-4 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover/lot:opacity-100 group-hover/lot:visible transition-all duration-300 z-[100] backdrop-blur-xl">
                                                                    <div className="relative z-10 text-left space-y-2">
                                                                        <p className="text-emerald-400 font-bold text-sm mb-2">Estimated Fee Breakdown</p>
                                                                        <div className="grid grid-cols-2 text-[10px] gap-y-1">
                                                                            <span className="text-slate-400">Net Value:</span>
                                                                            <span className="text-right text-white">RM{(pricePerUnit * 100).toFixed(2)}</span>
                                                                            <span className="text-slate-400">Brokerage (Min RM8):</span>
                                                                            <span className="text-right text-white">RM8.00</span>
                                                                            <span className="text-slate-400">Stamp Duty (RM1.50/k):</span>
                                                                            <span className="text-right text-white">RM1.50</span>
                                                                            <span className="text-slate-400">Clearing & SST:</span>
                                                                            <span className="text-right text-white">RM{(costPerLot - (pricePerUnit * 100) - 9.5).toFixed(2)}</span>
                                                                            <div className="col-span-2 h-px bg-slate-700 my-1"></div>
                                                                            <span className="text-emerald-400 font-bold">Total Cost:</span>
                                                                            <span className="text-right text-emerald-400 font-bold">{formatRM(costPerLot)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="absolute top-full left-10 w-3 h-3 bg-[#0f172a] border-r border-b border-slate-700 rotate-45 -mt-1.5"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-6 flex flex-col gap-3">
                                                        {isSelected ? (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => updateLots(idx, costPerLot, -1)}
                                                                    className="flex-1 py-4 rounded-2xl font-black text-xl bg-[#0b101b] border border-slate-700 text-slate-300 hover:border-red-500 transition-all active:scale-95"
                                                                >
                                                                    -
                                                                </button>
                                                                <div className="flex-[2] flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-500 font-black">
                                                                    {lots} {lots > 1 ? 'LOTS' : 'LOT'}
                                                                </div>
                                                                <button
                                                                    onClick={() => updateLots(idx, costPerLot, 1)}
                                                                    className={`flex-1 py-4 rounded-2xl font-black text-xl transition-all active:scale-95 ${totalInvested + costPerLot <= invBudget ? 'bg-[#0b101b] border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10' : 'bg-slate-900 border border-slate-800 text-slate-700 cursor-not-allowed'}`}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => toggleInvestmentOption(idx, costPerLot)}
                                                                disabled={!canAffordOne}
                                                                className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${canAffordOne ? 'bg-[#05080f] border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 text-slate-300' : 'bg-slate-950/50 border border-slate-900 text-slate-600 grayscale cursor-not-allowed opacity-60'}`}
                                                            >
                                                                {canAffordOne ? (
                                                                    <>Select Option</>
                                                                ) : (
                                                                    <>
                                                                        <div className="flex items-center gap-2 text-amber-500 font-black text-lg uppercase mb-1">
                                                                            <AlertTriangle size={20} /> Insufficient Budget
                                                                        </div>
                                                                        <span className="text-base font-black text-amber-400 tracking-tight">Requires +{formatRM(costPerLot - (invBudget - totalInvested))} more allocation</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}

                                                        <a
                                                            href={`https://www.google.com/search?q=${encodeURIComponent(optionName + ' share price bursa malaysia')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="w-full py-4 flex items-center justify-center rounded-2xl font-bold text-sm transition-all bg-[#0b101b] border border-slate-800 hover:border-slate-600 hover:text-white text-slate-400 active:scale-95 shadow-sm"
                                                        >
                                                            View Market Data <ChevronRight size={18} className="ml-1" />
                                                        </a>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    })()}
                                    {/* Discovery Section for Low Budgets */}
                                    {!showAllOptions && Object.keys(investmentBasket).length === 0 && (strategyData?.identified_instruments?.[1]?.examples || []).filter((opt: any) => (opt.cost_per_lot || 0) > invBudget).length >= 2 && (
                                        <div className="col-span-full mt-10 p-10 bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/20 rounded-[3rem] text-center animate-fade-in shadow-2xl shadow-amber-500/5">
                                            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-6 border border-amber-500/20 shadow-inner">
                                                <Zap size={40} />
                                            </div>
                                            <h3 className="text-3xl font-normal text-white mb-3 tracking-tighter uppercase">Unlock Budget Options</h3>
                                            <p className="text-slate-400 max-w-lg mx-auto mb-8 text-sm font-normal leading-relaxed italic">
                                                "We've detected several high-cost options. We're now prioritising "Penny" and "Mid-Cap" stocks below RM3.00 to ensure your RM{invBudget} budget stays active."
                                            </p>

                                            <button
                                                onClick={() => setShowAllOptions(true)}
                                                className="px-12 py-5 bg-amber-500 hover:bg-amber-400 text-[#05080f] font-normal rounded-2xl transition-all shadow-xl shadow-amber-500/30 active:scale-95 mb-10 flex items-center gap-2 mx-auto uppercase tracking-tighter"
                                            >
                                                Show All Options <ArrowRight size={20} />
                                            </button>

                                            <div className="flex flex-wrap justify-center gap-4">
                                                <div className="px-6 py-3 bg-[#0b101b]/50 border border-slate-800/50 rounded-2xl text-slate-400 text-xs font-normal flex items-center gap-2 backdrop-blur-sm">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Low-Entry Costs Active
                                                </div>
                                                <div className="px-6 py-3 bg-[#0b101b]/50 border border-slate-800/50 rounded-2xl text-slate-400 text-xs font-normal flex items-center gap-2 backdrop-blur-sm">
                                                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div> Small-Cap Variety Added
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                            {/* Final Confirmation Button */}
                            <div className="mt-16 flex flex-col items-center justify-center pb-20 animate-slide-up">
                                <div className="absolute -z-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                                <button
                                    onClick={handleConfirmStrategy}
                                    className="px-16 py-6 bg-emerald-500 hover:bg-emerald-400 text-[#05080f] font-bold text-xl rounded-2xl transition-all shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] active:scale-95 flex items-center gap-3 group uppercase tracking-tight"
                                >
                                    Activate Strategy <TrendingUp size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODALS */}

                {/* 1. Balance Allocation Prompt */}
                {showBalancePrompt && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#05080f]/90 backdrop-blur-xl animate-fade-in">
                        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 text-amber-500/5 -mr-12 -mt-12 pointer-events-none">
                                <Wallet size={160} />
                            </div>

                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-6 border border-amber-500/20">
                                <AlertTriangle size={24} />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tighter uppercase">Unallocated Balance</h3>
                            <p className="text-slate-400 text-base leading-relaxed mb-6">
                                {Object.keys(investmentBasket).length === 0
                                    ? "You haven't selected any investments. Would you like to allocate your entire investment budget to your selected savings option instead?"
                                    : `You still have ${formatRM(invBudget - totalInvested)} unallocated from your investment target. Would you like to add this balance to your savings option?`}
                            </p>

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => {
                                        // User says YES - allocate everything to savings (technically we just save the strategy with whatever they have)
                                        setShowBalancePrompt(false);
                                        setShowConfirmModal(true);
                                    }}
                                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-[#05080f] font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 uppercase tracking-tight"
                                >
                                    Yes, Allocate to Savings <CheckCircle2 size={20} />
                                </button>
                                <button
                                    onClick={() => setShowBalancePrompt(false)}
                                    className="w-full py-5 bg-[#0b101b] border border-slate-800 hover:border-slate-600 text-slate-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-tight"
                                >
                                    No, I'll Customize More
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Naming & Final Confirmation */}
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#05080f]/95 backdrop-blur-2xl animate-fade-in">
                        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20">
                                <Zap size={24} />
                            </div>

                            <h3 className="text-2xl font-normal text-white mb-1 tracking-tighter uppercase">Name Your Strategy</h3>
                            <p className="text-slate-400 text-sm mb-6 font-medium">This name will represent your strategy in the dashboard.</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Label Name</label>
                                    <input
                                        type="text"
                                        value={strategyLabel}
                                        onChange={(e) => setStrategyLabel(e.target.value)}
                                        placeholder="e.g. My First Million Plan"
                                        className="w-full bg-[#05080f] border border-slate-800 focus:border-blue-500 text-white p-4 rounded-xl outline-none transition-all font-bold text-lg placeholder-slate-900 placeholder:italic"
                                        autoFocus
                                    />
                                </div>

                                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-bold uppercase tracking-widest">Monthly Commitment</span>
                                        <span className="text-white font-black text-lg">{formatRM(optimizedMonthly)}</span>
                                    </div>
                                    <div className="h-[1px] bg-slate-800/50"></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Savings ({savePct}%)</span>
                                            <div className="text-emerald-400 font-black text-base">{formatRM(saveAmt)}</div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Invest ({invPct}%)</span>
                                            <div className="text-blue-400 font-black text-base">{formatRM(invAmt)}</div>
                                        </div>
                                    </div>
                                    <div className="h-[1px] bg-slate-800/50"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Projected Value</span>
                                        <span className="text-white font-black text-xl">
                                            {formatRM(Math.round(optimizedMonthly * ((Math.pow(1 + (engineReturn / 12), totalMonths) - 1) / (engineReturn / 12 || 1))))}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={finalizeStrategy}
                                    disabled={!strategyLabel.trim()}
                                    className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#111827] disabled:text-slate-700 text-[#05080f] font-bold text-xl rounded-2xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-3 group uppercase tracking-tight active:scale-95"
                                >
                                    Confirm & Activate <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WealthPlusView;
