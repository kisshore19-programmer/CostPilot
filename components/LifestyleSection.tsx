import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import {
    Coffee, UtensilsCrossed, Tv, ShoppingBag, Sparkles, Music,
    Loader2, ChevronRight, Lightbulb, TrendingDown, CheckCircle2,
    Zap, RotateCcw
} from 'lucide-react';

interface LifestyleSectionProps {
    userProfile: UserProfile;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

interface LifestyleAnswers {
    cooking_habit: string;
    dining_frequency: string;
    subscription_list: string;
    shopping_habit: string;
    entertainment_habit: string;
}

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string }> = {
    easy: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
    medium: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
    hard: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    food: <UtensilsCrossed size={18} />,
    subscriptions: <Tv size={18} />,
    utilities: <Lightbulb size={18} />,
    shopping: <ShoppingBag size={18} />,
    entertainment: <Music size={18} />,
    general: <Sparkles size={18} />,
};

const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
    food: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    subscriptions: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    utilities: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    shopping: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    entertainment: { color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
    general: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
};

const QUESTIONS = [
    {
        id: 'cooking_habit',
        question: 'How often do you cook at home?',
        icon: <UtensilsCrossed size={20} />,
        options: [
            { label: 'Almost never — I buy outside', value: 'rarely' },
            { label: 'A few times a week', value: 'sometimes' },
            { label: 'Most meals — I cook regularly', value: 'often' },
        ]
    },
    {
        id: 'dining_frequency',
        question: 'How often do you eat at restaurants or cafes?',
        icon: <Coffee size={20} />,
        options: [
            { label: 'Daily', value: 'daily' },
            { label: '3-4 times a week', value: 'frequently' },
            { label: 'Once a week or less', value: 'rarely' },
        ]
    },
    {
        id: 'subscription_list',
        question: 'What subscriptions do you pay for?',
        icon: <Tv size={20} />,
        options: [
            { label: 'Streaming (Netflix, Spotify, etc)', value: 'streaming' },
            { label: 'Streaming + Gym + Others', value: 'streaming_gym_others' },
            { label: 'Minimal — 1-2 services only', value: 'minimal' },
            { label: 'None', value: 'none' },
        ]
    },
    {
        id: 'shopping_habit',
        question: 'How would you describe your shopping habits?',
        icon: <ShoppingBag size={20} />,
        options: [
            { label: 'I shop impulsively when I see deals', value: 'impulsive' },
            { label: 'I plan purchases but sometimes splurge', value: 'moderate' },
            { label: 'I only buy what I strictly need', value: 'frugal' },
        ]
    },
    {
        id: 'entertainment_habit',
        question: 'What does your typical weekend look like?',
        icon: <Music size={20} />,
        options: [
            { label: 'Mall, movies, restaurants', value: 'expensive' },
            { label: 'Mix of free & paid activities', value: 'balanced' },
            { label: 'Mostly free — parks, home, friends', value: 'frugal' },
        ]
    }
];

const LifestyleSection: React.FC<LifestyleSectionProps> = ({ userProfile, updateProfile }) => {
    // Restore cached results if available
    const cachedResults = userProfile.lifestyleSuggestionCache;
    const [step, setStep] = useState<'questions' | 'loading' | 'results'>(cachedResults ? 'results' : 'questions');
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Partial<LifestyleAnswers>>({});
    const [results, setResults] = useState<any>(cachedResults || null);
    const [error, setError] = useState<string | null>(null);

    // Track which suggestions are applied (from persisted data)
    const appliedTitles = new Set(
        (userProfile.appliedLifestyleOptimizations || []).map(o => o.title)
    );

    const handleAnswer = (questionId: string, value: string) => {
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);

        if (currentQ < QUESTIONS.length - 1) {
            setTimeout(() => setCurrentQ(prev => prev + 1), 300);
        } else {
            handleAnalyze(newAnswers);
        }
    };

    const handleAnalyze = async (finalAnswers: Partial<LifestyleAnswers>) => {
        setStep('loading');
        setError(null);
        try {
            const data = {
                monthly_income: userProfile.income,
                food_budget: userProfile.food,
                subscriptions_budget: userProfile.subscriptions,
                utilities_budget: userProfile.utilities,
                occupation: userProfile.occupation,
                household_size: userProfile.householdSize,
                state: userProfile.state || '',
                ...finalAnswers
            };
            const result = await api.suggestLifestyle(data);
            setResults(result);
            setStep('results');
            // Cache results in profile so they persist
            await updateProfile({ lifestyleSuggestionCache: result });
        } catch (err: any) {
            console.error('Lifestyle analysis failed:', err);
            setError(err.message || 'Failed to generate suggestions.');
            setStep('questions');
            setCurrentQ(QUESTIONS.length - 1);
        }
    };

    const handleApply = async (sug: any) => {
        const existing = userProfile.appliedLifestyleOptimizations || [];
        // Don't apply twice
        if (existing.some(o => o.title === sug.title)) return;

        const updated = [
            ...existing,
            {
                title: sug.title,
                category: sug.category,
                monthlySavings: sug.estimated_monthly_savings,
                appliedAt: Date.now()
            }
        ];
        await updateProfile({ appliedLifestyleOptimizations: updated });
    };

    const handleUnapply = async (title: string) => {
        const existing = userProfile.appliedLifestyleOptimizations || [];
        const updated = existing.filter(o => o.title !== title);
        await updateProfile({ appliedLifestyleOptimizations: updated });
    };

    const handleReset = async () => {
        setStep('questions');
        setCurrentQ(0);
        setAnswers({});
        setResults(null);
        setError(null);
        // Clear cached results and applied optimizations
        await updateProfile({
            lifestyleSuggestionCache: null,
            appliedLifestyleOptimizations: []
        });
    };

    // === QUESTIONS STEP ===
    if (step === 'questions') {
        const q = QUESTIONS[currentQ];
        const selectedValue = answers[q.id as keyof LifestyleAnswers];

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#170e2b] border border-[#a07cf6]/20 flex items-center justify-center">
                        <Coffee className="text-[#a07cf6]" size={18} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Lifestyle Optimizer</h3>
                        <p className="text-sm text-slate-500">Tell us about your habits for personalized AI suggestions</p>
                    </div>
                </div>

                {/* Progress */}
                <div className="flex gap-2">
                    {QUESTIONS.map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < currentQ ? 'bg-[#b55cff]' : i === currentQ ? 'bg-[#a07cf6]' : 'bg-white/10'
                            }`} />
                    ))}
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Question Card */}
                <div className="bg-[#120b22] rounded-2xl border border-white/5 p-8 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#a07cf6]/10 border border-[#a07cf6]/20 flex items-center justify-center text-[#a07cf6]">
                            {q.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Question {currentQ + 1} of {QUESTIONS.length}</p>
                            <h4 className="text-lg font-bold text-white">{q.question}</h4>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {q.options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => handleAnswer(q.id, opt.value)}
                                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group ${selectedValue === opt.value
                                        ? 'bg-[#b55cff]/10 border-[#b55cff]/40 text-white'
                                        : 'bg-[#0f0a24] border-white/5 text-slate-300 hover:border-[#a07cf6]/30 hover:bg-[#1a1238]'
                                    }`}
                            >
                                <span className="text-sm font-medium">{opt.label}</span>
                                <ChevronRight size={16} className={`transition-all ${selectedValue === opt.value ? 'text-[#b55cff] translate-x-1' : 'text-slate-600 group-hover:text-slate-400'
                                    }`} />
                            </button>
                        ))}
                    </div>

                    {currentQ > 0 && (
                        <button
                            onClick={() => setCurrentQ(prev => prev - 1)}
                            className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            ← Previous question
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // === LOADING STEP ===
    if (step === 'loading') {
        return (
            <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#b55cff]/10 flex items-center justify-center border border-[#b55cff]/20">
                        <Loader2 className="animate-spin text-[#b55cff]" size={28} />
                    </div>
                    <div className="absolute inset-0 bg-[#b55cff]/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Analyzing Your Lifestyle</h3>
                <p className="text-slate-400 text-sm max-w-sm">
                    Crunching your habits against Malaysian cost data to find the best savings opportunities...
                </p>
            </div>
        );
    }

    // === RESULTS STEP ===
    const suggestions = results?.suggestions || [];
    const summary = results?.summary || {};

    // Calculate total applied savings
    const totalAppliedSavings = (userProfile.appliedLifestyleOptimizations || [])
        .reduce((sum, o) => sum + o.monthlySavings, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#170e2b] border border-[#a07cf6]/20 flex items-center justify-center">
                        <Coffee className="text-[#a07cf6]" size={18} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">AI Lifestyle Insights</h3>
                        <p className="text-sm text-slate-500">Personalized recommendations based on your habits</p>
                    </div>
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-[#a07cf6] border-2 border-slate-700 hover:border-[#a07cf6]/40 rounded-xl transition-all uppercase tracking-wider"
                >
                    <RotateCcw size={14} />
                    Re-scan
                </button>
            </div>

            {/* Summary Card */}
            {summary.total_potential_savings && (
                <div className="bg-gradient-to-br from-[#1a1238] to-[#120b22] rounded-2xl border border-[#a07cf6]/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Total Potential Savings</p>
                            <p className="text-3xl font-black text-emerald-400">+RM{summary.total_potential_savings}<span className="text-lg text-emerald-400/60">/mo</span></p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <TrendingDown className="text-emerald-400" size={24} />
                        </div>
                    </div>
                    {totalAppliedSavings > 0 && (
                        <div className="flex items-center gap-2 bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 mb-3">
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                            <p className="text-sm text-emerald-400 font-bold">
                                RM{totalAppliedSavings}/mo already applied to your dashboard
                            </p>
                        </div>
                    )}
                    {summary.insight && (
                        <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
                            <Lightbulb size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-300 leading-relaxed">{summary.insight}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Suggestion Cards */}
            <div className="space-y-4">
                {suggestions.map((sug: any, i: number) => {
                    const catColor = CATEGORY_COLORS[sug.category] || CATEGORY_COLORS.general;
                    const catIcon = CATEGORY_ICONS[sug.category] || CATEGORY_ICONS.general;
                    const diffStyle = DIFFICULTY_STYLES[sug.difficulty] || DIFFICULTY_STYLES.easy;
                    const isApplied = appliedTitles.has(sug.title);

                    return (
                        <div key={i} className={`bg-[#120b22] rounded-2xl border p-6 transition-all group ${isApplied ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 hover:border-[#a07cf6]/20'
                            }`}>
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${catColor.bg} ${catColor.border} border flex items-center justify-center ${catColor.color}`}>
                                        {catIcon}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-white">{sug.title}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${catColor.bg} ${catColor.border} ${catColor.color}`}>
                                                {sug.category}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${diffStyle.bg} ${diffStyle.text}`}>
                                                {sug.difficulty}
                                            </span>
                                            {isApplied && (
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                                                    APPLIED
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xl font-black text-emerald-400">+RM{sug.estimated_monthly_savings}</p>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">/month</p>
                                </div>
                            </div>

                            <p className="text-base text-slate-400 leading-relaxed mb-4">{sug.description}</p>

                            {sug.quick_tip && (
                                <div className="flex items-start gap-2 bg-[#0f0a24] rounded-xl p-3 border border-white/5 mb-4">
                                    <Zap size={12} className="text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        <span className="font-bold text-amber-400/80">Quick tip:</span> {sug.quick_tip}
                                    </p>
                                </div>
                            )}

                            {/* Apply / Unapply Button */}
                            {isApplied ? (
                                <button
                                    onClick={() => handleUnapply(sug.title)}
                                    className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                >
                                    <CheckCircle2 size={16} />
                                    Applied — Saving RM{sug.estimated_monthly_savings}/mo
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleApply(sug)}
                                    className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-[#b55cff] hover:bg-[#c980ff] text-[#120b22] active:scale-[0.98]"
                                >
                                    Apply Optimization — Save RM{sug.estimated_monthly_savings}/mo
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {suggestions.length === 0 && (
                <div className="py-16 text-center">
                    <Coffee className="mx-auto text-slate-500 mb-4" size={32} />
                    <h3 className="text-lg font-bold text-white/50 mb-2">No Suggestions Found</h3>
                    <p className="text-sm text-slate-500">Try updating your profile details for better results.</p>
                </div>
            )}
        </div>
    );
};

export default LifestyleSection;
