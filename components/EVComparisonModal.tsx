import React, { useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import {
    X, Zap, Fuel, Car, Leaf, TrendingDown, Battery,
    ChevronRight, Loader2, DollarSign, Calendar, Award, AlertTriangle
} from 'lucide-react';

interface EVComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
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

const INPUT_CLASS = "w-full bg-[#1a1238] border border-white/10 rounded-xl px-4 py-3.5 text-white text-base focus:outline-none focus:border-[#a07cf6]/50 focus:ring-1 focus:ring-[#a07cf6]/30 placeholder-slate-500 transition-all";
const LABEL_CLASS = "text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block";

const EVComparisonModal: React.FC<EVComparisonModalProps> = ({ isOpen, onClose, userProfile }) => {
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
    const [step, setStep] = useState<'form' | 'result'>('form');
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
            setStep('result');
        } catch (err: any) {
            console.error('EV comparison failed:', err);
            setError(err?.message || 'EV comparison failed. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const catColors: Record<string, string> = {
        budget: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        'mid-range': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
        premium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative bg-[#0d0820] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="sticky top-0 bg-[#0d0820]/95 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Zap className="text-emerald-400" size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">What if EV?</h2>
                            <p className="text-sm text-slate-500">Compare your petrol costs vs electric vehicle</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'form' ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-[#1a1238]/50 rounded-xl p-4 border border-[#a07cf6]/10">
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    <Fuel className="inline mr-1.5 text-amber-400" size={14} />
                                    Enter your current petrol car details and we'll use <span className="text-[#d48aff] font-bold">Gemini AI</span> to show you exactly how much you'd save by switching to an EV — including Malaysia-specific incentives.
                                </p>
                            </div>

                            <div>
                                <label className={LABEL_CLASS}>Current Car Model (optional)</label>
                                <input className={INPUT_CLASS} placeholder="e.g. Proton Saga, Perodua Myvi"
                                    value={form.currentCarModel} onChange={e => setForm({ ...form, currentCarModel: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={LABEL_CLASS}>Fuel Consumption (L/100km)</label>
                                    <input type="number" step="0.1" className={INPUT_CLASS} value={form.fuelConsumption}
                                        onChange={e => setForm({ ...form, fuelConsumption: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className={LABEL_CLASS}>Est. Monthly Petrol</label>
                                    <div className="bg-[#1a1238] border border-white/10 rounded-xl px-4 py-3.5 text-amber-400 text-base font-bold">
                                        RM{estimatedMonthlyPetrol.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
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
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                {loading ? 'Analyzing with Gemini AI...' : 'Compare with EV'}
                            </button>

                            {error && (
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    <AlertTriangle size={16} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    ) : result && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Current Petrol Summary */}
                            <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/10 rounded-2xl border border-amber-500/20 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Fuel className="text-amber-400" size={20} />
                                    <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider">Current Petrol Costs</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Monthly</p>
                                        <p className="text-2xl font-black text-white">RM{result.current_petrol_analysis?.monthly_total?.toFixed(0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Yearly</p>
                                        <p className="text-2xl font-black text-white">RM{result.current_petrol_analysis?.yearly_total?.toFixed(0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">CO₂/month</p>
                                        <p className="text-2xl font-black text-red-400">{result.current_petrol_analysis?.co2_monthly_kg?.toFixed(0)}kg</p>
                                    </div>
                                </div>
                            </div>

                            {/* EV Options */}
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#a07cf6]">EV Alternatives</h3>
                            <div className="space-y-3">
                                {result.ev_options?.map((ev: any, i: number) => (
                                    <div key={i}
                                        onClick={() => setSelectedEV(i)}
                                        className={`rounded-2xl border p-6 cursor-pointer transition-all duration-300 ${selectedEV === i
                                            ? 'bg-[#1a1238] border-[#a07cf6]/30 shadow-[0_0_30px_rgba(160,124,246,0.08)]'
                                            : 'bg-[#120b22] border-white/5 hover:border-white/10'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Battery className="text-emerald-400" size={20} />
                                                <span className="font-bold text-white text-base">{ev.model}</span>
                                            </div>
                                            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${catColors[ev.category] || 'text-slate-400 border-white/10 bg-white/5'}`}>
                                                {ev.category}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase mb-1">Price</p>
                                                <p className="text-sm font-bold text-white">RM{(ev.price_rm / 1000).toFixed(0)}k</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase mb-1">Range</p>
                                                <p className="text-sm font-bold text-white">{ev.range_km}km</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase mb-1">Charging/mo</p>
                                                <p className="text-sm font-bold text-emerald-400">RM{ev.monthly_charging_cost}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase mb-1">Savings/mo</p>
                                                <p className="text-sm font-bold text-emerald-400">+RM{ev.monthly_savings_vs_petrol?.toFixed(0)}</p>
                                            </div>
                                        </div>

                                        {selectedEV === i && (
                                            <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-fade-in">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="bg-[#0d0820] rounded-xl p-4 text-center">
                                                        <DollarSign className="mx-auto text-emerald-400 mb-1.5" size={18} />
                                                        <p className="text-xs text-slate-500 uppercase mb-1">Yearly Savings</p>
                                                        <p className="text-base font-black text-emerald-400">RM{ev.yearly_savings_vs_petrol?.toFixed(0)}</p>
                                                    </div>
                                                    <div className="bg-[#0d0820] rounded-xl p-4 text-center">
                                                        <Calendar className="mx-auto text-blue-400 mb-1.5" size={18} />
                                                        <p className="text-xs text-slate-500 uppercase mb-1">Break Even</p>
                                                        <p className="text-base font-black text-blue-400">{ev.break_even_months} months</p>
                                                    </div>
                                                    <div className="bg-[#0d0820] rounded-xl p-4 text-center">
                                                        <Leaf className="mx-auto text-green-400 mb-1.5" size={18} />
                                                        <p className="text-xs text-slate-500 uppercase mb-1">CO₂ Saved</p>
                                                        <p className="text-base font-black text-green-400">{(result.current_petrol_analysis?.co2_monthly_kg - (ev.co2_monthly_kg || 0)).toFixed(0)}kg/mo</p>
                                                    </div>
                                                </div>
                                                {ev.key_features && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {ev.key_features.map((f: string, fi: number) => (
                                                            <span key={fi} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400">{f}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            {result.summary && (
                                <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/10 rounded-2xl border border-emerald-500/20 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Award className="text-emerald-400" size={20} />
                                        <h3 className="text-base font-bold text-emerald-400 uppercase tracking-wider">AI Recommendation</h3>
                                    </div>
                                    <p className="text-base text-slate-300 leading-relaxed mb-4">{result.summary.recommendation}</p>
                                    <p className="text-sm text-slate-500 leading-relaxed">{result.summary.environmental_impact}</p>
                                    {result.summary.malaysia_incentives && (
                                        <div className="mt-4 space-y-2">
                                            {result.summary.malaysia_incentives.map((inc: string, i: number) => (
                                                <div key={i} className="flex items-center gap-2 text-sm text-emerald-400/80">
                                                    <ChevronRight size={12} /> {inc}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button onClick={() => { setStep('form'); setResult(null); }}
                                className="w-full py-4 rounded-xl border border-white/10 text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:border-white/20 transition-all">
                                ← Re-analyze with different values
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EVComparisonModal;
