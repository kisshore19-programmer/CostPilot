import React, { useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import {
    Home, MapPin, Briefcase, Navigation, Loader2, AlertTriangle,
    CheckCircle2, ArrowRight, ChevronRight, TrendingDown, Train,
    Star, XCircle, Award, DollarSign, Map
} from 'lucide-react';

interface AccommodationSectionProps {
    userProfile: UserProfile;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
    onDeclineRelocate: () => void;
}

interface RelocationForm {
    currentLocation: string;
    workLocation: string;
    preferredAreas: string;
}

const INPUT_CLASS = "w-full bg-[#1a1238] border border-white/10 rounded-xl px-4 py-3.5 text-white text-base focus:outline-none focus:border-[#a07cf6]/50 focus:ring-1 focus:ring-[#a07cf6]/30 placeholder-slate-500 transition-all";
const LABEL_CLASS = "text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block";

const AccommodationSection: React.FC<AccommodationSectionProps> = ({ userProfile, updateProfile, onDeclineRelocate }) => {
    const [step, setStep] = useState<'ask' | 'form' | 'results'>('ask');
    const [form, setForm] = useState<RelocationForm>({
        currentLocation: '',
        workLocation: '',
        preferredAreas: '',
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedOption, setSelectedOption] = useState<number>(0);

    // Calculate applied savings for display
    const lifestyleSavingsByCategory: Record<string, number> = {};
    (userProfile.appliedLifestyleOptimizations || []).forEach(opt => {
        const cat = opt.category.toLowerCase().trim();
        const normalizedCat = cat === 'transportation' ? 'transport' : cat;
        lifestyleSavingsByCategory[normalizedCat] = (lifestyleSavingsByCategory[normalizedCat] || 0) + opt.monthlySavings;
    });

    const netRent = (userProfile.rent || 0) - (lifestyleSavingsByCategory['housing'] || 0);
    const netTransport = (userProfile.transportCost || 0) - (lifestyleSavingsByCategory['transport'] || 0);
    const netIncome = (userProfile.income || 0); // Income itself doesn't change, but we show it as comparison

    const handleDecline = () => {
        onDeclineRelocate();
    };

    const handleAnalyze = async () => {
        if (!form.currentLocation) return;
        setLoading(true);
        setError(null);
        try {
            const data = await api.suggestRelocation({
                current_location: form.currentLocation,
                work_location: form.workLocation,
                preferred_areas: form.preferredAreas,
                current_rent: userProfile.rent || 0,
                monthly_income: userProfile.income || 0,
                transport_method: userProfile.transportMethod || 'car',
                monthly_transport_cost: userProfile.transportCost || 0,
            });
            setResult(data);
            setStep('results');
        } catch (err: any) {
            console.error('Relocation analysis failed:', err);
            setError(err?.message || 'Relocation analysis failed. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setStep('form');
        setError(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#170e2b] border border-[#a07cf6]/20 flex items-center justify-center">
                            <Home className="text-[#a07cf6]" size={18} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Accommodation Optimization</h3>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 ml-[52px]">Explore smarter living options to cut costs</p>
                </div>
            </div>

            {/* === STEP 1: Ask if open to relocating === */}
            {step === 'ask' && (
                <div className="animate-fade-in">
                    <div className="bg-gradient-to-br from-[#170e2b] to-[#120b22] rounded-2xl border border-[#a07cf6]/15 p-8 text-center space-y-6">
                        <div className="w-20 h-20 rounded-2xl bg-[#a07cf6]/10 border border-[#a07cf6]/20 flex items-center justify-center mx-auto">
                            <Map className="text-[#a07cf6]" size={36} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Are you open to relocating?</h3>
                            <p className="text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
                                Relocating to a more strategic area could save you <span className="text-[#d48aff] font-bold">RM300-600/month</span> through cheaper rent, better transport access, and lower cost of living.
                            </p>
                        </div>
                        <div className="flex justify-center gap-4 pt-2">
                            <button
                                onClick={() => setStep('form')}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#b55cff] to-[#8c35ff] text-white text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_8px_30px_rgba(181,92,255,0.3)]"
                            >
                                <CheckCircle2 size={18} /> Yes, I'm open
                            </button>
                            <button
                                onClick={handleDecline}
                                className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                            >
                                <XCircle size={18} /> No, keep current
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === STEP 2: Location Input Form === */}
            {step === 'form' && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-[#1a1238]/50 rounded-xl p-4 border border-[#a07cf6]/10">
                        <p className="text-sm text-slate-400 leading-relaxed">
                            <MapPin className="inline mr-1.5 text-[#a07cf6]" size={14} />
                            Enter your location details and <span className="text-[#d48aff] font-bold">Gemini AI</span> will suggest 2-3 financially smarter areas to live — with detailed cost comparisons and commute analysis.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className={LABEL_CLASS}>
                                <MapPin className="inline mr-1 text-[#a07cf6]" size={12} /> Current Location *
                            </label>
                            <input
                                className={INPUT_CLASS}
                                placeholder="e.g. Bangsar, Kuala Lumpur"
                                value={form.currentLocation}
                                onChange={e => setForm({ ...form, currentLocation: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={LABEL_CLASS}>
                                <Briefcase className="inline mr-1 text-[#a07cf6]" size={12} /> Work Location (optional)
                            </label>
                            <input
                                className={INPUT_CLASS}
                                placeholder="e.g. KLCC, KL Sentral, or 'Remote'"
                                value={form.workLocation}
                                onChange={e => setForm({ ...form, workLocation: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={LABEL_CLASS}>
                                <Navigation className="inline mr-1 text-[#a07cf6]" size={12} /> Preferred Areas (optional)
                            </label>
                            <input
                                className={INPUT_CLASS}
                                placeholder="e.g. SS2, Kelana Jaya, Setia Alam, anywhere affordable"
                                value={form.preferredAreas}
                                onChange={e => setForm({ ...form, preferredAreas: e.target.value })}
                            />
                            <p className="text-xs text-slate-500 mt-1.5 ml-1">Separate multiple areas with commas. Leave blank for AI to suggest freely.</p>
                        </div>

                        {/* Current profile stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-[#120b22] rounded-xl p-4 border border-white/5">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                    {(lifestyleSavingsByCategory['housing'] || 0) > 0 ? 'Net Rent (Optimized)' : 'Current Rent'}
                                </p>
                                <p className={`text-xl font-black ${(lifestyleSavingsByCategory['housing'] || 0) > 0 ? 'text-emerald-400' : 'text-white'}`}>
                                    RM{netRent.toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-[#120b22] rounded-xl p-4 border border-white/5">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                    {(lifestyleSavingsByCategory['transport'] || 0) > 0 ? 'Net Transport (Optimized)' : 'Transport Cost'}
                                </p>
                                <p className={`text-xl font-black ${(lifestyleSavingsByCategory['transport'] || 0) > 0 ? 'text-emerald-400' : 'text-white'}`}>
                                    RM{netTransport.toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-[#120b22] rounded-xl p-4 border border-white/5">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Monthly Income</p>
                                <p className="text-xl font-black text-white">RM{(userProfile.income || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !form.currentLocation}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#b55cff] to-[#8c35ff] text-white text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(181,92,255,0.3)]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
                        {loading ? 'Analyzing with Gemini AI...' : 'Find Better Locations'}
                    </button>

                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <AlertTriangle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        onClick={() => setStep('ask')}
                        className="w-full py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-all"
                    >
                        ← Go Back
                    </button>
                </div>
            )}

            {/* === STEP 3: Results === */}
            {step === 'results' && result && (
                <div className="animate-fade-in space-y-6">

                    {/* Current Location Summary */}
                    {result.current_analysis && (
                        <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/10 rounded-2xl border border-amber-500/20 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <MapPin className="text-amber-400" size={20} />
                                <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider">
                                    Current: {result.current_analysis.location}
                                </h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase mb-1">Rent</p>
                                    <p className="text-2xl font-black text-white">RM{result.current_analysis.estimated_monthly_rent}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase mb-1">Transport</p>
                                    <p className="text-2xl font-black text-white">RM{result.current_analysis.estimated_transport_cost}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase mb-1">Total Living</p>
                                    <p className="text-2xl font-black text-amber-400">RM{result.current_analysis.estimated_total_living_cost}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Relocation Suggestions */}
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#a07cf6]">Suggested Locations</h3>
                    <div className="space-y-4">
                        {result.relocation_options?.map((opt: any, i: number) => (
                            <div
                                key={i}
                                onClick={() => setSelectedOption(i)}
                                className={`rounded-2xl border p-6 cursor-pointer transition-all duration-300 ${selectedOption === i
                                    ? 'bg-[#1a1238] border-[#a07cf6]/30 shadow-[0_0_30px_rgba(160,124,246,0.08)]'
                                    : 'bg-[#120b22] border-white/5 hover:border-white/10'}`}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Home className="text-[#a07cf6]" size={22} />
                                        <span className="font-bold text-white text-lg">{opt.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(10, opt.suitability_score || 0) }).map((_, si) => (
                                                <Star key={si} size={10} className="text-amber-400 fill-amber-400" />
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-amber-400">{opt.suitability_score}/10</span>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-4 gap-4 mb-2">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase mb-1">Rent Range</p>
                                        <p className="text-sm font-bold text-white">{opt.estimated_rent_range}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase mb-1">Commute</p>
                                        <p className="text-sm font-bold text-white">{opt.commute_to_work}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase mb-1">Monthly Savings</p>
                                        <p className="text-sm font-bold text-emerald-400">RM{Math.abs(opt.estimated_total_monthly_savings || 0).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase mb-1">Yearly Savings</p>
                                        <p className="text-sm font-bold text-emerald-400">RM{Math.abs(opt.estimated_yearly_savings || 0).toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {selectedOption === i && (
                                    <div className="mt-5 pt-5 border-t border-white/5 space-y-5 animate-fade-in">

                                        {/* Savings Breakdown */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[#0d0820] rounded-xl p-4 border border-emerald-500/10">
                                                <DollarSign className="text-emerald-400 mb-2" size={18} />
                                                <p className="text-xs text-slate-500 uppercase mb-1">Rent Savings</p>
                                                <p className="text-lg font-black text-emerald-400">RM{Math.abs(opt.rent_savings_vs_current || 0).toFixed(2)}/mo</p>
                                            </div>
                                            <div className="bg-[#0d0820] rounded-xl p-4 border border-blue-500/10">
                                                <TrendingDown className="text-blue-400 mb-2" size={18} />
                                                <p className="text-xs text-slate-500 uppercase mb-1">Transport Savings</p>
                                                <p className="text-lg font-black text-blue-400">RM{Math.abs(opt.transport_savings_vs_current || 0).toFixed(2)}/mo</p>
                                            </div>
                                        </div>

                                        {/* Public Transport */}
                                        {opt.public_transport_access && opt.public_transport_access.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-2 flex items-center gap-1.5">
                                                    <Train size={12} /> Nearby Transit
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {opt.public_transport_access.map((t: string, ti: number) => (
                                                        <span key={ti} className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/15 text-blue-300/80">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Financial Benefits */}
                                        {opt.financial_benefits && (
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-400 mb-3 flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} /> Financial Benefits
                                                </p>
                                                <div className="space-y-2">
                                                    {opt.financial_benefits.map((b: string, bi: number) => (
                                                        <div key={bi} className="flex items-start gap-2.5 text-sm text-slate-300">
                                                            <ChevronRight size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                                            {b}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Trade-offs */}
                                        {opt.trade_offs && (
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400 mb-3 flex items-center gap-1.5">
                                                    <AlertTriangle size={12} /> Trade-offs
                                                </p>
                                                <div className="space-y-2">
                                                    {opt.trade_offs.map((t: string, ti: number) => (
                                                        <div key={ti} className="flex items-start gap-2.5 text-sm text-slate-400">
                                                            <ChevronRight size={14} className="text-amber-400/60 shrink-0 mt-0.5" />
                                                            {t}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* AI Recommendation */}
                    {result.summary && (
                        <div className="bg-gradient-to-br from-[#1a103c] to-[#120b22] rounded-2xl border border-[#a07cf6]/20 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Award className="text-[#a07cf6]" size={22} />
                                <h3 className="text-base font-bold text-[#a07cf6] uppercase tracking-wider">AI Recommendation</h3>
                            </div>
                            <p className="text-lg text-slate-300 leading-relaxed mb-3">{result.summary.recommendation}</p>
                            <p className="text-base text-[#d48aff]/80 font-medium italic">{result.summary.key_insight}</p>
                            <div className="mt-4 flex gap-3 flex-wrap">
                                {result.summary.best_overall_pick && (
                                    <span className="text-sm font-bold px-4 py-2 rounded-full bg-[#a07cf6]/10 border border-[#a07cf6]/25 text-[#d48aff]">
                                        🏆 Best Overall: {result.summary.best_overall_pick}
                                    </span>
                                )}
                                {result.summary.highest_savings_pick && (
                                    <span className="text-sm font-bold px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                        💰 Most Savings: {result.summary.highest_savings_pick}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Re-analyze */}
                    <button
                        onClick={handleReset}
                        className="w-full py-4 rounded-xl border border-[#a07cf6]/20 text-sm font-bold uppercase tracking-wider text-[#a07cf6]/50 hover:text-[#a07cf6] hover:border-[#a07cf6]/30 hover:bg-[#a07cf6]/5 transition-all"
                    >
                        ← Re-analyze with different locations
                    </button>
                </div>
            )}
        </div>
    );
};

export default AccommodationSection;
