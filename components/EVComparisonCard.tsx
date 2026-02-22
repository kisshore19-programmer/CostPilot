import React, { useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import {
    Zap, Fuel, Leaf, Battery, ArrowRight,
    ChevronRight, Loader2, DollarSign, Calendar, Award, AlertTriangle, ChevronDown, ChevronUp, X
} from 'lucide-react';

interface EVComparisonCardProps {
    userProfile: UserProfile;
}

interface EVForm {
    currentCarModel: string;
    monthlyDistanceKm: number;
    fuelCostPerLitre: number;
    fuelConsumption: number;
    monthlyMaintenance: number;
    monthlyRoadTax: number;
    monthlyInsurance: number;
}

const INPUT_CLASS = "w-full bg-[#0d1a12] border border-emerald-500/15 rounded-xl px-4 py-3.5 text-white text-base focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 placeholder-slate-500 transition-all";
const LABEL_CLASS = "text-xs font-bold uppercase tracking-[0.2em] text-emerald-300/60 mb-2 block";

const EVComparisonCard: React.FC<EVComparisonCardProps> = ({ userProfile }) => {
    const [expanded, setExpanded] = useState(false);
    const [form, setForm] = useState<EVForm>({
        currentCarModel: '',
        monthlyDistanceKm: Math.round((userProfile.commuteDistanceKm || 20) * 22 * 2),
        fuelCostPerLitre: 2.05,
        fuelConsumption: 10,
        monthlyMaintenance: 100,
        monthlyRoadTax: 50,
        monthlyInsurance: 200,
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [selectedEV, setSelectedEV] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const estimatedMonthlyPetrol = (form.monthlyDistanceKm / 100) * form.fuelConsumption * form.fuelCostPerLitre;

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const routes = userProfile.transportOptimizations?.map(r => ({
                from: r.startLocation,
                to: r.destination,
                method: r.method,
            }));

            const data = await api.compareEV({
                monthly_distance_km: form.monthlyDistanceKm,
                current_fuel_cost_per_litre: form.fuelCostPerLitre,
                current_fuel_consumption_per_100km: form.fuelConsumption,
                current_monthly_petrol_cost: estimatedMonthlyPetrol,
                current_monthly_maintenance: form.monthlyMaintenance,
                current_monthly_roadtax: form.monthlyRoadTax,
                current_monthly_insurance: form.monthlyInsurance,
                current_car_model: form.currentCarModel,
                commute_routes: routes,
            });
            setResult(data);
        } catch (err: any) {
            console.error('EV comparison failed:', err);
            setError(err?.message || 'EV comparison failed. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setError(null);
    };

    const catColors: Record<string, string> = {
        budget: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        'mid-range': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
        premium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    };

    return (
        <div className="mt-8">
            {/* Collapsed Banner (Wealth+ style) */}
            {!expanded ? (
                <div
                    className="relative overflow-hidden bg-gradient-to-r from-[#059669] to-[#10b981] rounded-[2rem] p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer group shadow-[0_12px_40px_-10px_rgba(16,185,129,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.6)] hover:-translate-y-1 transition-all duration-300 gap-6"
                    onClick={() => setExpanded(true)}
                >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:bg-white/20 transition-colors pointer-events-none"></div>

                    <div className="flex items-center gap-5 sm:gap-6 relative z-10 w-full sm:w-auto">
                        <div className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center shadow-sm backdrop-blur-md shrink-0 p-2.5">
                            <img src="/assets/ev-logo.png" alt="EV" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1">What if EV?</h3>
                            <p className="text-white/80 text-sm sm:text-base font-medium">Compare your petrol costs vs electric vehicle — powered by Gemini AI</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-white font-bold opacity-90 group-hover:opacity-100 group-hover:pr-2 transition-all relative z-10 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end sm:justify-start text-lg">
                        Explore <ArrowRight size={22} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            ) : (
                /* Expanded Card */
                <div className="relative overflow-hidden bg-gradient-to-br from-[#071a12] via-[#0a1f17] to-[#0d0820] rounded-[2rem] border border-emerald-500/20 shadow-[0_12px_60px_-10px_rgba(16,185,129,0.15)]">
                    {/* Glow effects */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/8 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[60px] -ml-16 -mb-16 pointer-events-none"></div>

                    {/* Header Bar */}
                    <div className="flex items-center justify-between p-7 sm:p-8 border-b border-emerald-500/10">
                        <div className="flex items-center gap-4 sm:gap-5">
                            <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/25 rounded-[18px] flex items-center justify-center p-2">
                                <img src="/assets/ev-logo.png" alt="EV" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">What if EV?</h2>
                                <p className="text-sm text-emerald-300/50 font-medium mt-0.5">Petrol vs Electric — AI-powered cost comparison</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setExpanded(false)}
                            className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all border border-white/5 hover:border-white/10"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-7 sm:p-8 space-y-8">

                        {/* Intro note */}
                        {!result && (
                            <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
                                <p className="text-sm text-emerald-200/60 leading-relaxed">
                                    <Fuel className="inline mr-1.5 text-amber-400" size={14} />
                                    Enter your current petrol car details and <span className="text-emerald-300 font-bold">Gemini AI</span> will show you exactly how much you'd save by switching to an EV — including Malaysia-specific incentives.
                                </p>
                            </div>
                        )}

                        {/* === FORM === */}
                        {!result && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className={LABEL_CLASS}>Current Car Model (optional)</label>
                                    <input className={INPUT_CLASS} placeholder="e.g. Proton Saga, Perodua Myvi"
                                        value={form.currentCarModel} onChange={e => setForm({ ...form, currentCarModel: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={LABEL_CLASS}>Monthly Distance (km)</label>
                                        <input type="number" className={INPUT_CLASS} value={form.monthlyDistanceKm}
                                            onChange={e => setForm({ ...form, monthlyDistanceKm: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Fuel Price (RM/L)</label>
                                        <input type="number" step="0.01" className={INPUT_CLASS} value={form.fuelCostPerLitre}
                                            onChange={e => setForm({ ...form, fuelCostPerLitre: Number(e.target.value) })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={LABEL_CLASS}>Fuel Consumption (L/100km)</label>
                                        <input type="number" step="0.1" className={INPUT_CLASS} value={form.fuelConsumption}
                                            onChange={e => setForm({ ...form, fuelConsumption: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Est. Monthly Petrol</label>
                                        <div className="bg-[#0d1a12] border border-emerald-500/15 rounded-xl px-4 py-3.5 text-amber-400 text-base font-bold">
                                            RM{estimatedMonthlyPetrol.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className={LABEL_CLASS}>Maintenance /mo</label>
                                        <input type="number" className={INPUT_CLASS} value={form.monthlyMaintenance}
                                            onChange={e => setForm({ ...form, monthlyMaintenance: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Road Tax /mo</label>
                                        <input type="number" className={INPUT_CLASS} value={form.monthlyRoadTax}
                                            onChange={e => setForm({ ...form, monthlyRoadTax: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Insurance /mo</label>
                                        <input type="number" className={INPUT_CLASS} value={form.monthlyInsurance}
                                            onChange={e => setForm({ ...form, monthlyInsurance: Number(e.target.value) })} />
                                    </div>
                                </div>

                                <button onClick={handleAnalyze} disabled={loading}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(16,185,129,0.3)]">
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                                    {loading ? 'Analyzing with Gemini AI...' : 'Compare with EV'}
                                </button>

                                {error && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        <AlertTriangle size={16} className="shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === RESULTS === */}
                        {result && (
                            <div className="space-y-8 animate-fade-in">

                                {/* Current Petrol Summary */}
                                <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/10 rounded-2xl border border-amber-500/20 p-6">
                                    <div className="flex items-center gap-3 mb-5">
                                        <Fuel className="text-amber-400" size={22} />
                                        <h3 className="text-lg font-bold text-amber-400 uppercase tracking-wider">Current Petrol Costs</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Monthly</p>
                                            <p className="text-3xl font-black text-white">RM{result.current_petrol_analysis?.monthly_total?.toFixed(0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Yearly</p>
                                            <p className="text-3xl font-black text-white">RM{result.current_petrol_analysis?.yearly_total?.toFixed(0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">CO₂/month</p>
                                            <p className="text-3xl font-black text-red-400">{result.current_petrol_analysis?.co2_monthly_kg?.toFixed(0)}kg</p>
                                        </div>
                                    </div>
                                </div>

                                {/* EV Options */}
                                <div>
                                    <h3 className="text-base font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">EV Alternatives</h3>
                                    <div className="space-y-4">
                                        {result.ev_options?.map((ev: any, i: number) => (
                                            <div key={i}
                                                onClick={() => setSelectedEV(i)}
                                                className={`rounded-2xl border p-6 cursor-pointer transition-all duration-300 ${selectedEV === i
                                                    ? 'bg-emerald-500/5 border-emerald-500/25 shadow-[0_0_30px_rgba(16,185,129,0.08)]'
                                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <Battery className="text-emerald-400" size={22} />
                                                        <span className="font-bold text-white text-lg">{ev.model}</span>
                                                    </div>
                                                    <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${catColors[ev.category] || 'text-slate-400 border-white/10 bg-white/5'}`}>
                                                        {ev.category}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-4 gap-4 mb-2">
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase mb-1">Price</p>
                                                        <p className="text-base font-bold text-white">RM{(ev.price_rm / 1000).toFixed(0)}k</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase mb-1">Range</p>
                                                        <p className="text-base font-bold text-white">{ev.range_km}km</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase mb-1">Charging/mo</p>
                                                        <p className="text-base font-bold text-emerald-400">RM{ev.monthly_charging_cost}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase mb-1">Savings/mo</p>
                                                        <p className="text-base font-bold text-emerald-400">+RM{ev.monthly_savings_vs_petrol?.toFixed(0)}</p>
                                                    </div>
                                                </div>

                                                {selectedEV === i && (
                                                    <div className="mt-5 pt-5 border-t border-white/5 space-y-4 animate-fade-in">
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div className="bg-[#071a12] rounded-xl p-4 text-center border border-emerald-500/10">
                                                                <DollarSign className="mx-auto text-emerald-400 mb-2" size={20} />
                                                                <p className="text-xs text-slate-500 uppercase mb-1">Yearly Savings</p>
                                                                <p className="text-lg font-black text-emerald-400">RM{ev.yearly_savings_vs_petrol?.toFixed(0)}</p>
                                                            </div>
                                                            <div className="bg-[#071a12] rounded-xl p-4 text-center border border-emerald-500/10">
                                                                <Calendar className="mx-auto text-blue-400 mb-2" size={20} />
                                                                <p className="text-xs text-slate-500 uppercase mb-1">Break Even</p>
                                                                <p className="text-lg font-black text-blue-400">{ev.break_even_months} months</p>
                                                            </div>
                                                            <div className="bg-[#071a12] rounded-xl p-4 text-center border border-emerald-500/10">
                                                                <Leaf className="mx-auto text-green-400 mb-2" size={20} />
                                                                <p className="text-xs text-slate-500 uppercase mb-1">CO₂ Saved</p>
                                                                <p className="text-lg font-black text-green-400">{(result.current_petrol_analysis?.co2_monthly_kg - (ev.co2_monthly_kg || 0)).toFixed(0)}kg/mo</p>
                                                            </div>
                                                        </div>
                                                        {ev.key_features && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {ev.key_features.map((f: string, fi: number) => (
                                                                    <span key={fi} className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/15 text-emerald-300/70">{f}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* AI Recommendation */}
                                {result.summary && (
                                    <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/10 rounded-2xl border border-emerald-500/20 p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Award className="text-emerald-400" size={22} />
                                            <h3 className="text-lg font-bold text-emerald-400 uppercase tracking-wider">AI Recommendation</h3>
                                        </div>
                                        <p className="text-base text-slate-300 leading-relaxed mb-4">{result.summary.recommendation}</p>
                                        <p className="text-sm text-slate-500 leading-relaxed">{result.summary.environmental_impact}</p>
                                        {result.summary.malaysia_incentives && (
                                            <div className="mt-5 space-y-2.5">
                                                {result.summary.malaysia_incentives.map((inc: string, i: number) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm text-emerald-400/80">
                                                        <ChevronRight size={14} className="shrink-0 mt-0.5" /> {inc}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Re-analyze button */}
                                <button onClick={handleReset}
                                    className="w-full py-4 rounded-xl border border-emerald-500/20 text-sm font-bold uppercase tracking-wider text-emerald-300/50 hover:text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
                                    ← Re-analyze with different values
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EVComparisonCard;
