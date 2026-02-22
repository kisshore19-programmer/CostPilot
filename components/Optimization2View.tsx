import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, ViewState } from '../types';
import { api, ScenarioResult, MonthlyInputs, OptimizationRecommendation, SubsidyMatch, ExplainResponse } from '../services/api';
import { Car, Home, Receipt, Coffee, Zap, Info, ChevronRight, Activity, Cpu } from 'lucide-react';
import TransportSection from './TransportSection';
import EVComparisonCard from './EVComparisonCard';
import AccommodationSection from './AccommodationSection';
import SubsidiesSection from './SubsidiesSection';
import LifestyleSection from './LifestyleSection';

const CATEGORIES = [
    { id: 'transport', label: 'Transport', icon: <Car size={18} /> },
    { id: 'housing', label: 'Accommodation', icon: <Home size={18} /> },
    { id: 'subsidies', label: 'Subsidies', icon: <Receipt size={18} /> },
    { id: 'lifestyle', label: 'Lifestyle', icon: <Coffee size={18} /> }
];

interface OptimizationViewProps {
    userProfile: UserProfile;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
    setView: (view: ViewState) => void;
}

const OptimizationView2: React.FC<OptimizationViewProps> = ({ userProfile, updateProfile, setView }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
    const [subsidies, setSubsidies] = useState<SubsidyMatch[]>([]);
    const [activeTab, setActiveTab] = useState('transport');

    const [accepting, setAccepting] = useState<Record<number, boolean>>({});
    const [optimizedCategories, setOptimizedCategories] = useState<Set<string>>(() => new Set(userProfile.optimizedCategories || []));
    const [engineStatus, setEngineStatus] = useState<Record<string, boolean>>(() => ({
        transport: userProfile.engineStatus?.transport ?? false,
        housing: userProfile.engineStatus?.housing ?? false,
        subsidies: userProfile.engineStatus?.subsidies ?? false,
        lifestyle: userProfile.engineStatus?.lifestyle ?? false
    }));

    const fetchData = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        setError(null);
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
            setSubsidies(result.subsidies?.matches || []);
        } catch (e: any) {
            setError(e.message || "Failed to load analysis.");
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [userProfile.income, userProfile.rent, userProfile.utilities, userProfile.transportCost, userProfile.food, userProfile.debt, userProfile.subscriptions, userProfile.savings]);

    useEffect(() => {
        // Initial fetch
        fetchData(true);
    }, []); // Only once on mount

    // Handle profile updates for optimized categories without re-fetching everything
    useEffect(() => {
        setOptimizedCategories(new Set(userProfile.optimizedCategories || []));
    }, [userProfile.optimizedCategories]);

    const handleAccept = async (index: number, rec: OptimizationRecommendation) => {
        setAccepting(prev => ({ ...prev, [index]: true }));
        try {
            const patch: Partial<UserProfile> = {};
            const changes = rec.changes;
            if (changes.rentMonthly !== undefined) patch.rent = changes.rentMonthly;
            if (changes.utilitiesMonthly !== undefined) patch.utilities = changes.utilitiesMonthly;
            if (changes.transportMonthly !== undefined) patch.transportCost = changes.transportMonthly;
            if (changes.foodMonthly !== undefined) patch.food = changes.foodMonthly;
            if (changes.debtMonthly !== undefined) patch.debt = changes.debtMonthly;
            if (changes.subscriptionsMonthly !== undefined) patch.subscriptions = changes.subscriptionsMonthly;
            if (changes.savingsBalance !== undefined) patch.savings = changes.savingsBalance;

            const newOptimizedCategories = new Set(optimizedCategories);
            newOptimizedCategories.add(rec.type);
            patch.optimizedCategories = Array.from(newOptimizedCategories) as string[];

            await updateProfile(patch);
            setOptimizedCategories(newOptimizedCategories);
            // Refresh analysis in background
            fetchData(false);
        } catch (err) {
            console.error("Accept fail", err);
        } finally {
            setTimeout(() => setAccepting(prev => ({ ...prev, [index]: false })), 500);
        }
    };

    const getStatusForCategory = (catId: string) => {
        return engineStatus[catId] ? 'ACTIVE' : 'OFF';
    };

    // Full screen loader only for initial scan or when no data is present
    if (loading && recommendations.length === 0) return <div className="min-h-screen bg-slate-50 dark:bg-[#0A061E] flex items-center justify-center p-10"><div className="w-10 h-10 border-4 border-[#b55cff] border-t-transparent rounded-full animate-spin"></div></div>;
    if (error && recommendations.length === 0) return <div className="min-h-screen bg-slate-50 dark:bg-[#0A061E] p-10 text-red-400 font-bold text-center">Engine Error: {error} <button onClick={() => fetchData(true)} className="ml-4 underline text-[#b55cff]">Restart</button></div>;

    const visibleRecommendations = recommendations.filter(rec => rec.type === activeTab && !optimizedCategories.has(rec.type));

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0A061E] text-slate-800 dark:text-white p-6 md:p-12 font-sans selection:bg-[#b55cff]/30 pb-32">
            <div className="max-w-6xl mx-auto space-y-12 animate-fade-in relative z-10">

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight flex items-baseline gap-3">
                        Optimization Engine
                    </h1>
                    <p className="text-[#a07cf6] font-medium tracking-wide">Real-time financial performance tuning via AI protocols</p>
                </div>

                {/* Engine Control Panel Boxes */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Cpu className="text-slate-400" size={20} />
                        <h2 className="text-xl font-bold tracking-wide">Engine Control Panel</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {CATEGORIES.map((cat) => {
                            const status = getStatusForCategory(cat.id);
                            const isActive = status === 'ACTIVE';
                            const isSelected = activeTab === cat.id;

                            return (
                                <div key={cat.id}
                                    onClick={async () => {
                                        const newStatus = { ...engineStatus, [cat.id]: !engineStatus[cat.id] };
                                        setEngineStatus(newStatus);
                                        setActiveTab(cat.id);
                                        await updateProfile({ engineStatus: newStatus });
                                    }}
                                    className={`relative rounded-3xl border-2 p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 group
                                                ${isSelected
                                            ? 'bg-purple-50 dark:bg-[#1a1238] border-[#a07cf6]/50 shadow-[0_20px_50px_rgba(160,124,246,0.15)]'
                                            : 'bg-white dark:bg-[#0f0a24] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-[#140e2e]'}`}>

                                    {isSelected && <div className="absolute inset-0 bg-[#a07cf6]/5 blur-2xl rounded-3xl"></div>}

                                    <span className={`text-base uppercase tracking-[0.3em] mb-10 transition-colors duration-300 relative z-10 font-bold
                                                    ${isSelected ? 'text-[#d48aff]' : 'text-slate-500'}`}>
                                        {cat.label}
                                    </span>

                                    <div className="relative z-10">
                                        <div className={`w-20 h-28 rounded-[2rem] border-2 flex items-center justify-center transition-all duration-700
                                                    ${isActive
                                                ? 'bg-gradient-to-b from-[#b55cff]/30 to-[#8c35ff]/10 border-[#b55cff]/40 shadow-[0_0_40px_rgba(181,92,255,0.2)]'
                                                : 'bg-black/20 border-white/5'}`}>
                                            <div className={`w-14 h-14 rounded-2xl transition-all duration-700 flex items-center justify-center relative
                                                        ${isActive
                                                    ? 'bg-gradient-to-br from-[#d48aff] to-[#9b3bff] shadow-[0_0_25px_rgba(181,92,255,0.5)] scale-110'
                                                    : 'bg-white/5'}`}>
                                                {isActive && (
                                                    <>
                                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_15px_white]"></div>
                                                        <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping" style={{ animationDuration: '3s' }}></div>
                                                    </>
                                                )}
                                                <div className={`opacity-20 transition-all duration-700 ${isActive ? 'text-white scale-110 opacity-40' : 'text-slate-500 scale-90'}`}>
                                                    {React.cloneElement(cat.icon as React.ReactElement<any>, { size: 24 })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 flex items-center justify-center relative z-10 w-full">
                                        <div className={`text-[12px] font-black uppercase tracking-[0.25em] px-6 py-2.5 rounded-full border-2 transition-all duration-500
                                                    ${isActive
                                                ? 'text-[#e5b3ff] border-[#b55cff]/40 bg-[#b55cff]/20 shadow-[0_0_15px_rgba(181,92,255,0.1)]'
                                                : 'text-slate-500 border-white/5 bg-white/5'}`}>
                                            {status}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tabs Row */}
                <div className="flex items-center gap-8 border-b border-white/10 pt-4 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`flex items-center gap-2 pb-4 border-b-2 font-bold text-sm tracking-wide transition-colors whitespace-nowrap
                                ${activeTab === cat.id ? 'border-[#a07cf6] text-[#e5b3ff]' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            <span className={activeTab === cat.id ? 'text-[#a07cf6]' : 'text-slate-500'}>{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Dynamic Content Pane */}
                <div>
                    {!engineStatus[activeTab] ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center border border-slate-200 dark:border-white/5 rounded-2xl bg-slate-100/50 dark:bg-[#120c22]/50">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 border border-slate-200 dark:border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                                <Cpu className="text-slate-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Sector Offline</h3>
                            <p className="text-slate-500 text-sm tracking-wide max-w-sm">
                                This optimization loop is currently disabled. Toggle the sector in the Engine Control Panel to scan for efficiencies.
                            </p>
                        </div>
                    ) : activeTab === 'transport' ? (
                        /* === TRANSPORT SECTOR === */
                        <>
                            <TransportSection
                                userProfile={userProfile}
                                updateProfile={updateProfile}
                            />
                            <EVComparisonCard userProfile={userProfile} />
                        </>
                    ) : activeTab === 'housing' ? (
                        /* === ACCOMMODATION SECTOR === */
                        <AccommodationSection
                            userProfile={userProfile}
                            updateProfile={updateProfile}
                            onDeclineRelocate={async () => {
                                const newStatus = { ...engineStatus, housing: false };
                                setEngineStatus(newStatus);
                                await updateProfile({ engineStatus: newStatus });
                            }}
                        />
                    ) : activeTab === 'subsidies' ? (
                        /* === SUBSIDIES SECTOR === */
                        <SubsidiesSection
                            userProfile={userProfile}
                            updateProfile={updateProfile}
                        />
                    ) : (
                        /* === LIFESTYLE SECTOR === */
                        <LifestyleSection
                            userProfile={userProfile}
                            updateProfile={updateProfile}
                        />
                    )}
                </div>
            </div>

        </div>
    );
};

export default OptimizationView2;
