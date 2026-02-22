import React, { useState } from 'react';
import { UserProfile, TravelOptimization } from '../types';
import { api } from '../services/api';
import {
    Car, MapPin, Clock, DollarSign, Plus, Trash2, Sparkles,
    Route, ArrowRight, ChevronDown, ChevronUp, Navigation, Loader2, AlertTriangle
} from 'lucide-react';

interface TransportSectionProps {
    userProfile: UserProfile;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const TRANSPORT_METHODS = [
    { value: 'car', label: 'Car (Petrol)' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'bus', label: 'Bus' },
    { value: 'lrt', label: 'LRT/MRT' },
    { value: 'grab', label: 'Grab/e-Hailing' },
    { value: 'bicycle', label: 'Bicycle' },
    { value: 'walk', label: 'Walking' },
];

const INPUT_CLASS = "w-full bg-[#1a1238] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a07cf6]/50 focus:ring-1 focus:ring-[#a07cf6]/30 placeholder-slate-500 transition-all";
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5 block";

interface RouteForm {
    startLocation: string;
    destination: string;
    method: string;
    tripsPerWeek: number;
    isRoundTrip: boolean;
    avgTravelTimeGo: number;
    avgTravelTimeReturn: number;
    costPerTrip: number;
}

const defaultForm: RouteForm = {
    startLocation: '',
    destination: '',
    method: 'car',
    tripsPerWeek: 5,
    isRoundTrip: true,
    avgTravelTimeGo: 30,
    avgTravelTimeReturn: 30,
    costPerTrip: 10,
};

const TransportSection: React.FC<TransportSectionProps> = ({ userProfile, updateProfile }) => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<RouteForm>({ ...defaultForm });
    const [saving, setSaving] = useState(false);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);

    const routes: TravelOptimization[] = userProfile.transportOptimizations || [];

    const handleAddRoute = async () => {
        if (!form.startLocation || !form.destination) return;
        setSaving(true);
        try {
            const weeklyCost = form.costPerTrip * form.tripsPerWeek * (form.isRoundTrip ? 2 : 1);
            const newRoute: TravelOptimization = {
                id: Date.now().toString(),
                startLocation: form.startLocation,
                destination: form.destination,
                method: form.method,
                tripsPerWeek: form.tripsPerWeek,
                isRoundTrip: form.isRoundTrip,
                avgTravelTimeGo: form.avgTravelTimeGo,
                avgTravelTimeReturn: form.avgTravelTimeReturn,
                costPerTrip: form.costPerTrip,
                weeklyCost,
                monthlyCost: weeklyCost * 4.33,
                yearlyCost: weeklyCost * 52,
                avgTravelTimeTotal: form.avgTravelTimeGo + (form.isRoundTrip ? form.avgTravelTimeReturn : 0),
                createdAt: Date.now(),
            };
            await updateProfile({ transportOptimizations: [...routes, newRoute] });
            setForm({ ...defaultForm });
            setShowForm(false);
        } catch (err) {
            console.error('Failed to save route:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRoute = async (id: string) => {
        await updateProfile({ transportOptimizations: routes.filter(r => r.id !== id) });
    };

    const handleAnalyzeRoute = async (route: TravelOptimization) => {
        setAnalyzingId(route.id);
        setAnalyzeError(null);
        try {
            const result = await api.optimizeTravel({
                start_location: route.startLocation,
                destination: route.destination,
                method: route.method,
                trips_per_week: route.tripsPerWeek * (route.isRoundTrip ? 2 : 1),
                cost_per_trip: route.costPerTrip,
                weekly_cost: route.weeklyCost,
                monthly_cost: route.monthlyCost,
                yearly_cost: route.yearlyCost,
                avg_travel_time_total: route.avgTravelTimeTotal,
            });
            const updated = routes.map(r => r.id === route.id ? { ...r, aiScenarios: result } : r);
            await updateProfile({ transportOptimizations: updated });
            setExpandedRoute(route.id);
        } catch (err: any) {
            console.error('AI analysis failed:', err);
            setAnalyzeError(err?.message || 'AI analysis failed. Make sure the backend is running.');
        } finally {
            setAnalyzingId(null);
        }
    };

    const handleSelectOption = async (routeId: string, optionId: string) => {
        setSelectedOptions(prev => ({ ...prev, [routeId]: optionId }));
        const updated = routes.map(r => r.id === routeId ? { ...r, selectedOptionId: optionId as any } : r);
        await updateProfile({ transportOptimizations: updated });
    };

    return (
        <div className="space-y-6">
            {/* Top Actions Bar */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white">Your Travel Routes</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Add your frequent routes and let AI find cheaper alternatives</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b55cff] text-[#120b22] text-sm font-bold uppercase tracking-wider hover:bg-[#c980ff] transition-all">
                        <Plus size={16} /> Add Route
                    </button>
                </div>
            </div>

            {/* Add Route Form */}
            {showForm && (
                <div className="bg-[#120b22] rounded-2xl border border-[#a07cf6]/20 p-6 space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                        <Route className="text-[#a07cf6]" size={18} />
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#d48aff]">New Travel Route</h4>
                    </div>

                    {/* From / To */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>From</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input className={INPUT_CLASS + " pl-9"} placeholder="e.g. Shah Alam"
                                    value={form.startLocation} onChange={e => setForm({ ...form, startLocation: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>To</label>
                            <div className="relative">
                                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input className={INPUT_CLASS + " pl-9"} placeholder="e.g. KL Sentral"
                                    value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Method + Trips */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Method</label>
                            <select className={INPUT_CLASS} value={form.method}
                                onChange={e => setForm({ ...form, method: e.target.value })}>
                                {TRANSPORT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Trips / Week</label>
                            <input type="number" min="0" className={INPUT_CLASS} value={form.tripsPerWeek}
                                onChange={e => { const v = parseInt(e.target.value) || 0; setForm({ ...form, tripsPerWeek: Math.max(0, v) }); }} />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Cost / Trip (RM)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input type="number" min="0" className={INPUT_CLASS + " pl-9"} value={form.costPerTrip}
                                    onChange={e => { const v = parseFloat(e.target.value) || 0; setForm({ ...form, costPerTrip: Math.max(0, v) }); }} />
                            </div>
                        </div>
                    </div>

                    {/* Travel Time + Round Trip */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Travel Time Go (mins)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input type="number" min="0" className={INPUT_CLASS + " pl-9"} value={form.avgTravelTimeGo}
                                    onChange={e => { const v = parseInt(e.target.value) || 0; setForm({ ...form, avgTravelTimeGo: Math.max(0, v) }); }} />
                            </div>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Travel Time Return (mins)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input type="number" min="0" className={INPUT_CLASS + " pl-9"} value={form.avgTravelTimeReturn}
                                    onChange={e => { const v = parseInt(e.target.value) || 0; setForm({ ...form, avgTravelTimeReturn: Math.max(0, v) }); }} />
                            </div>
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-12 h-7 rounded-full border-2 relative transition-all duration-300 ${form.isRoundTrip ? 'bg-[#b55cff]/30 border-[#b55cff]/50' : 'bg-white/5 border-white/10'}`}
                                    onClick={() => setForm({ ...form, isRoundTrip: !form.isRoundTrip })}>
                                    <div className={`w-5 h-5 rounded-full absolute top-0.5 transition-all duration-300 ${form.isRoundTrip ? 'left-[22px] bg-[#b55cff]' : 'left-0.5 bg-slate-500'}`} />
                                </div>
                                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Round Trip</span>
                            </label>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">Cancel</button>
                        <button onClick={handleAddRoute} disabled={saving || !form.startLocation || !form.destination}
                            className="px-8 py-3 rounded-xl bg-[#b55cff] text-[#120b22] text-xs font-bold uppercase tracking-wider hover:bg-[#c980ff] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                            {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                            {saving ? 'Saving...' : 'Add Route'}
                        </button>
                    </div>
                </div>
            )}

            {/* Route Cards */}
            {routes.length === 0 && !showForm ? (
                <div className="py-20 text-center flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-[#120c22]/50">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                        <Car className="text-slate-500" size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Routes Added</h3>
                    <p className="text-slate-500 text-sm max-w-sm">Add your frequent travel routes to get AI-powered cost optimization suggestions.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {analyzeError && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-base animate-fade-in">
                            <AlertTriangle size={18} className="shrink-0" />
                            <span>{analyzeError}</span>
                            <button onClick={() => setAnalyzeError(null)} className="ml-auto text-sm underline hover:text-red-300">Dismiss</button>
                        </div>
                    )}
                    {routes.map(route => {
                        const isExpanded = expandedRoute === route.id;
                        const isAnalyzing = analyzingId === route.id;
                        const selected = route.selectedOptionId || selectedOptions[route.id] || 'current';

                        return (
                            <div key={route.id} className="bg-[#120b22] rounded-2xl border border-white/5 overflow-hidden hover:border-[#a07cf6]/20 transition-all">
                                {/* Route Header */}
                                <div className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-[#1a1238] border border-[#a07cf6]/20 flex items-center justify-center shrink-0">
                                            <Car className="text-[#a07cf6]" size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 text-white font-bold text-base">
                                                <span className="truncate">{route.startLocation}</span>
                                                <ArrowRight size={14} className="text-[#a07cf6] shrink-0" />
                                                <span className="truncate">{route.destination}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                                <span className="capitalize">{route.method}</span>
                                                <span>•</span>
                                                <span>{route.tripsPerWeek}x/week</span>
                                                <span>•</span>
                                                <span>RM{route.monthlyCost.toFixed(0)}/mo</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {!route.aiScenarios && (
                                            <button onClick={() => handleAnalyzeRoute(route)} disabled={isAnalyzing}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#a07cf6]/10 border border-[#a07cf6]/20 text-[#d48aff] text-sm font-bold hover:bg-[#a07cf6]/20 transition-all disabled:opacity-50">
                                                {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                                {isAnalyzing ? 'Analyzing...' : 'AI Optimize'}
                                            </button>
                                        )}
                                        {route.aiScenarios && (
                                            <button onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all">
                                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                {isExpanded ? 'Hide' : 'View'} AI Scenarios
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteRoute(route.id)}
                                            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* AI Scenarios Expansion */}
                                {isExpanded && route.aiScenarios && (
                                    <div className="border-t border-white/5 p-6 space-y-5 animate-fade-in bg-[#0d0820]">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-[#a07cf6]">AI-Optimized Scenarios</h4>
                                            <div className="text-sm text-emerald-400 font-bold">
                                                Save up to RM{Math.abs(route.aiScenarios.estimated_monthly_savings || 0).toFixed(0)}/mo
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {(['cheapest_option', 'balanced_option', 'fastest_option'] as const).map((key) => {
                                                const scenario = route.aiScenarios![key];
                                                const optionId = key.replace('_option', '');
                                                const isSelected = selected === optionId;
                                                const labels: Record<string, { label: string; color: string }> = {
                                                    cheapest_option: { label: '💰 Cheapest', color: 'text-emerald-400' },
                                                    balanced_option: { label: '⚖️ Balanced', color: 'text-blue-400' },
                                                    fastest_option: { label: '⚡ Fastest', color: 'text-amber-400' },
                                                };

                                                return (
                                                    <div key={key}
                                                        onClick={() => handleSelectOption(route.id, optionId)}
                                                        className={`rounded-xl border p-5 cursor-pointer transition-all duration-300 ${isSelected
                                                            ? 'bg-[#1a1238] border-[#a07cf6]/40 shadow-[0_0_20px_rgba(160,124,246,0.1)]'
                                                            : 'bg-[#120b22] border-white/5 hover:border-white/10'}`}>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className={`text-sm font-bold ${labels[key].color}`}>{labels[key].label}</span>
                                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#b55cff] animate-pulse" />}
                                                        </div>
                                                        <p className="text-white font-bold text-base mb-2">{scenario.method}</p>
                                                        <p className="text-slate-400 text-sm mb-4 leading-relaxed">{scenario.reasoning}</p>
                                                        <div className="space-y-2.5">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500">Per trip</span>
                                                                <span className="text-white font-bold">RM{scenario.estimated_cost_per_trip?.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500">Monthly</span>
                                                                <span className="text-white font-bold">RM{scenario.monthly_cost?.toFixed(0)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500">Time</span>
                                                                <span className="text-slate-300">{scenario.estimated_time}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Current vs Selected comparison */}
                                        <div className="flex items-center justify-between bg-[#1a1238]/50 rounded-xl p-5 border border-white/5">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">Current Monthly Cost</p>
                                                <p className="text-2xl font-black text-white">RM{route.monthlyCost.toFixed(0)}</p>
                                            </div>
                                            <ArrowRight className="text-[#a07cf6]" size={24} />
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">Estimated Yearly Savings</p>
                                                <p className="text-2xl font-black text-emerald-400">
                                                    RM{Math.abs(route.aiScenarios.estimated_yearly_savings || 0).toFixed(0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TransportSection;
