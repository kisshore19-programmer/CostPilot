import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { PiggyBank, Coins, Banknote, Building, Home, ArrowRight, ArrowLeft, Plus, Wallet, Car, Bike, Footprints, Bus, Briefcase, CarFront, X, Settings, Smile, Frown, ShieldCheck, Plane, GraduationCap, Target, Sparkles, Zap } from 'lucide-react';
import { UserProfile, SmartGoal } from '../../types';

const SUGGESTIONS = ['Phone Bill', 'Spotify / Netflix', 'Gym Membership', 'Car Insurance', 'Internet / WiFi', 'PTPTN Loan', 'Parking Season Pass'];

const OnboardingView: React.FC = () => {
    const { updateProfile } = useUser();
    const [step, setStep] = useState(1);

    // Step 1 State
    const [moneySource, setMoneySource] = useState<'income' | 'allowance'>('income');
    const [moneyAmount, setMoneyAmount] = useState<number>(0);

    // Step 2 State
    const [residenceType, setResidenceType] = useState<'rented' | 'permanent'>('rented');
    const [committedToRent, setCommittedToRent] = useState<boolean>(true);
    const [rentAmount, setRentAmount] = useState<number>(0);
    const [payingHomeLoan, setPayingHomeLoan] = useState<boolean>(true);
    const [homeLoanAmount, setHomeLoanAmount] = useState<number>(0);

    // Step 4 State
    const [transportModes, setTransportModes] = useState<string[]>([]);

    // Step 5 State
    const [bills, setBills] = useState<{ name: string, amount: number }[]>([]);
    const [newBillName, setNewBillName] = useState('');
    const [newBillAmount, setNewBillAmount] = useState<string>('');

    // Step 5 State
    const [hasSavings, setHasSavings] = useState<boolean>(true);
    const [savingsAmount, setSavingsAmount] = useState<number>(0);
    const [emergencySavingsAmount, setEmergencySavingsAmount] = useState<number>(0);

    // Step 6 State (Smart Goals)
    const [onboardingGoals, setOnboardingGoals] = useState<SmartGoal[]>([]);
    const [isAddingOnboardingGoal, setIsAddingOnboardingGoal] = useState(false);
    const [newOnboardingGoal, setNewOnboardingGoal] = useState({ name: '', targetAmount: 0, deadlineMonths: 12, category: 'General' });

    // Step 7 State (Food Options)
    const [foodExpenses, setFoodExpenses] = useState<number>(500);

    const categories = [
        { name: 'Car/Vehicle', icon: CarFront },
        { name: 'Emergency', icon: ShieldCheck },
        { name: 'House', icon: Home },
        { name: 'Vacation', icon: Plane },
        { name: 'Education', icon: GraduationCap },
        { name: 'Investment', icon: Briefcase },
        { name: 'General', icon: Target },
    ];

    // Loading State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showBanner, setShowBanner] = useState(true);

    const [placeholderText, setPlaceholderText] = useState('');
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowBanner(false);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (step !== 4) return;

        let timer: NodeJS.Timeout;
        const currentText = `e.g. ${SUGGESTIONS[suggestionIndex]}`;

        if (isDeleting) {
            timer = setTimeout(() => {
                setPlaceholderText(currentText.substring(0, charIndex - 1));
                setCharIndex(prev => prev - 1);
                if (charIndex <= 1) {
                    setIsDeleting(false);
                    setSuggestionIndex((prev) => (prev + 1) % SUGGESTIONS.length);
                }
            }, 50);
        } else {
            if (charIndex >= currentText.length) {
                timer = setTimeout(() => setIsDeleting(true), 1500);
            } else {
                timer = setTimeout(() => {
                    setPlaceholderText(currentText.substring(0, charIndex + 1));
                    setCharIndex(prev => prev + 1);
                }, 100);
            }
        }

        return () => clearTimeout(timer);
    }, [step, charIndex, isDeleting, suggestionIndex]);

    const canContinue = () => {
        if (step === 1) return moneyAmount > 0;
        if (step === 2) {
            if (residenceType === 'rented' && committedToRent) return rentAmount > 0;
            if (residenceType === 'permanent' && payingHomeLoan) return homeLoanAmount > 0;
            return true;
        }
        if (step === 3) return transportModes.length > 0;
        if (step === 4) return true;
        if (step === 5) return hasSavings ? savingsAmount > 0 : true;
        return true;
    };

    const handleNext = () => {
        if (canContinue()) setStep(prev => prev + 1);
    };
    const handlePrev = () => setStep(prev => prev - 1);

    const handleAddBill = () => {
        if (newBillName && newBillAmount) {
            setBills([...bills, { name: newBillName, amount: Number(newBillAmount) }]);
            setNewBillName('');
            setNewBillAmount('');
        }
    };

    const handleAddOnboardingGoal = () => {
        if (newOnboardingGoal.name && newOnboardingGoal.targetAmount > 0) {
            const goal: SmartGoal = {
                id: Date.now().toString(),
                name: newOnboardingGoal.name,
                targetAmount: newOnboardingGoal.targetAmount,
                deadlineMonths: newOnboardingGoal.deadlineMonths,
                category: newOnboardingGoal.category,
                createdAt: Date.now()
            };
            setOnboardingGoals([...onboardingGoals, goal]);
            setNewOnboardingGoal({ name: '', targetAmount: 0, deadlineMonths: 12, category: 'General' });
            setIsAddingOnboardingGoal(false);
        }
    };

    const removeOnboardingGoal = (id: string) => {
        setOnboardingGoals(onboardingGoals.filter(g => g.id !== id));
    };

    const handleFinish = async () => {
        setIsSubmitting(true);
        // Map transport modes to commuteMethod
        let commuteMethod: 'car' | 'transit' | 'hybrid' = 'car';
        const hasCar = transportModes.includes('Private Vehicle') || transportModes.includes('Motorcycle');
        const hasTransit = transportModes.includes('Public Transport') || transportModes.includes('Company Bus/Vehicle');
        if (hasCar && hasTransit) commuteMethod = 'hybrid';
        else if (hasTransit) commuteMethod = 'transit';
        else commuteMethod = 'car';

        const totalBills = bills.reduce((acc, curr) => acc + curr.amount, 0);

        const data: Partial<UserProfile> = {
            savings: hasSavings ? savingsAmount : 0,
            income: moneyAmount,
            rent: residenceType === 'rented' ? (committedToRent ? rentAmount : 0) : (payingHomeLoan ? homeLoanAmount : 0),
            commuteMethod: commuteMethod,
            subscriptions: totalBills, // Saving bills into subscriptions/utilities could be refined
            smartGoals: onboardingGoals,
            food: foodExpenses,
            emergencySavings: emergencySavingsAmount,
            hasCompletedOnboarding: true
        };

        try {
            await updateProfile(data);
        } catch (e) {
            console.error(e);
            setIsSubmitting(false); // only reset on error because success unmounts this component
        }
    };

    const renderStepNumbers = () => {
        return (
            <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <div key={s} className={`h-1.5 w-6 rounded-full transition-colors ${s === step ? 'bg-blue-600' : s < step ? 'bg-blue-800' : 'bg-[#1e293b]'}`} />
                    ))}
                </div>
                <div className="text-sm font-medium text-slate-400">Step {step} of 8</div>
            </div>
        );
    };

    const renderInput = (label: string, value: number, onChange: (v: number) => void) => (
        <div className="mt-8">
            <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
                {label}
            </label>
            <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-slate-200">RM</span>
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full bg-[#111827] border border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                    placeholder="0"
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0b101b] flex items-center justify-center p-4 font-sans text-slate-200 relative overflow-hidden">
            {/* Notification Banner */}
            <div className={`fixed top-8 right-8 z-50 transition-all duration-700 ease-out max-w-xs sm:max-w-sm w-full bg-[#1e293b]/95 backdrop-blur-md border-l-4 border-blue-500 rounded-r-xl shadow-2xl flex items-start gap-3 sm:gap-4 p-4 sm:p-5 ${showBanner ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}>
                <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg shrink-0 mt-0.5">
                    <Settings size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-bold text-sm mb-1">Fully Customizable</h3>
                    <p className="text-slate-400 text-[13px] leading-relaxed">Don't worry about getting it perfect! You can effortlessly re-customize all of this information later in your Settings.</p>
                </div>
                <button onClick={() => setShowBanner(false)} className="text-slate-500 hover:text-white transition-colors shrink-0">
                    <X size={18} />
                </button>
            </div>

            <div className="bg-[#131b2f] border border-[#1e293b] rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-fade-in relative overflow-hidden">
                {renderStepNumbers()}

                {/* Step 1: Income/Allowance */}
                {step === 1 && (
                    <div className="animate-slide-up">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight leading-tight">How much is your monthly income/allocated monthly spending allowance?</h1>
                        <p className="text-slate-400 mb-8 text-[15px]">Choose between entering your total income or a spending allowance.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setMoneySource('income')}
                                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${moneySource === 'income' ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'bg-[#111827] border-slate-700/50 hover:border-slate-600 text-slate-400'}`}>
                                <Banknote size={32} />
                                <span className={`font-semibold text-sm ${moneySource === 'income' ? 'text-blue-500' : 'text-slate-300'}`}>Monthly Income</span>
                            </button>
                            <button
                                onClick={() => setMoneySource('allowance')}
                                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${moneySource === 'allowance' ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'bg-[#111827] border-slate-700/50 hover:border-slate-600 text-slate-400'}`}>
                                <Wallet size={32} />
                                <span className={`font-semibold text-sm text-center ${moneySource === 'allowance' ? 'text-blue-500' : 'text-slate-300'}`}>Allocated Monthly Allowance</span>
                            </button>
                        </div>

                        {renderInput(moneySource === 'income' ? 'MONTHLY INCOME' : 'MONTHLY ALLOWANCE', moneyAmount, setMoneyAmount)}

                        <button onClick={handleNext} disabled={!canContinue()} className="w-full py-4 mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed disabled:text-blue-200 text-white rounded-xl font-bold transition flex justify-center items-center gap-2">
                            Continue <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {/* Step 2: Residence */}
                {step === 2 && (
                    <div className="animate-slide-up">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">What type of residence do you live in?</h1>
                        <p className="text-slate-400 mb-8 text-[15px]">Select your primary living arrangement.</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                onClick={() => setResidenceType('rented')}
                                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${residenceType === 'rented' ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'bg-[#111827] border-slate-700/50 hover:border-slate-600 text-slate-400'}`}>
                                <Building size={32} />
                                <span className={`font-semibold text-sm ${residenceType === 'rented' ? 'text-blue-500' : 'text-slate-300'}`}>Rented</span>
                            </button>
                            <button
                                onClick={() => setResidenceType('permanent')}
                                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${residenceType === 'permanent' ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'bg-[#111827] border-slate-700/50 hover:border-slate-600 text-slate-400'}`}>
                                <Home size={32} />
                                <span className={`font-semibold text-sm text-center ${residenceType === 'permanent' ? 'text-blue-500' : 'text-slate-300'}`}>Permanent</span>
                            </button>
                        </div>

                        {residenceType === 'rented' && (
                            <div className="animate-fade-in">
                                <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
                                    ARE YOU COMMITTED IN PAYING THE RENT?
                                </label>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button
                                        onClick={() => setCommittedToRent(true)}
                                        className={`py-3 rounded-xl font-bold transition-colors ${committedToRent ? 'bg-blue-600 text-white' : 'bg-[#111827] text-slate-400 border border-slate-700/50 hover:bg-slate-800'}`}>
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => setCommittedToRent(false)}
                                        className={`py-3 rounded-xl font-bold transition-colors ${!committedToRent ? 'bg-blue-600 text-white' : 'bg-[#111827] text-slate-400 border border-slate-700/50 hover:bg-slate-800'}`}>
                                        No
                                    </button>
                                </div>

                                {committedToRent && renderInput('MONTHLY RENT AMOUNT', rentAmount, setRentAmount)}
                            </div>
                        )}

                        {residenceType === 'permanent' && (
                            <div className="animate-fade-in">
                                <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
                                    ARE YOU CURRENTLY PAYING THE HOME LOAN?
                                </label>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button
                                        onClick={() => setPayingHomeLoan(true)}
                                        className={`py-3 rounded-xl font-bold transition-colors ${payingHomeLoan ? 'bg-blue-600 text-white' : 'bg-[#111827] text-slate-400 border border-slate-700/50 hover:bg-slate-800'}`}>
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => setPayingHomeLoan(false)}
                                        className={`py-3 rounded-xl font-bold transition-colors ${!payingHomeLoan ? 'bg-blue-600 text-white' : 'bg-[#111827] text-slate-400 border border-slate-700/50 hover:bg-slate-800'}`}>
                                        No
                                    </button>
                                </div>

                                {payingHomeLoan && renderInput('MONTHLY HOME LOAN AMOUNT', homeLoanAmount, setHomeLoanAmount)}
                            </div>
                        )}

                        <div className="flex gap-4 mt-8">
                            <button onClick={handlePrev} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition flex justify-center items-center shrink-0">
                                <ArrowLeft size={20} />
                            </button>
                            <button onClick={handleNext} disabled={!canContinue()} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed disabled:text-blue-200 text-white rounded-xl font-bold transition flex justify-center items-center gap-2">
                                Continue <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Transport */}
                {step === 3 && (
                    <div className="animate-slide-up">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">How do you usually get around?</h1>
                        <p className="text-slate-400 mb-6 text-[15px]">Select one or more modes of transport.</p>

                        <div className="space-y-3 mb-8">
                            {[
                                'Private Vehicle',
                                'Motorcycle',
                                'Bicycle',
                                'Walking',
                                'Public Transport',
                                'Company Bus/Vehicle'
                            ].map(mode => {
                                const selected = transportModes.includes(mode);
                                return (
                                    <button
                                        key={mode}
                                        onClick={() => setTransportModes(prev =>
                                            selected ? prev.filter(m => m !== mode) : [...prev, mode]
                                        )}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selected ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-[#111827] border-slate-700/50 text-slate-300 hover:border-slate-500'}`}
                                    >
                                        <span className="font-semibold">{mode}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'border-blue-500' : 'border-slate-500'}`}>
                                            {selected && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-4">
                            <button onClick={handlePrev} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition flex justify-center items-center shrink-0">
                                <ArrowLeft size={20} />
                            </button>
                            <button onClick={handleNext} disabled={!canContinue()} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed disabled:text-blue-200 text-white rounded-xl font-bold transition flex justify-center items-center gap-2">
                                Continue <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Bills */}
                {step === 4 && (
                    <div className="animate-slide-up">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">What are your other commitments?</h1>
                        <p className="text-slate-400 mb-8 text-[15px]">List your recurring monthly bills (e.g. phone bill, car insurance).</p>

                        <div className="bg-[#111827] border border-slate-700/50 rounded-2xl p-6 min-h-[220px]">
                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={newBillName}
                                    onChange={(e) => setNewBillName(e.target.value)}
                                    placeholder={placeholderText}
                                    className="flex-1 bg-[#1e293b] text-white p-3 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none placeholder-slate-500 font-medium"
                                />
                                <div className="relative w-28">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">RM</span>
                                    <input
                                        type="number"
                                        value={newBillAmount}
                                        onChange={(e) => setNewBillAmount(e.target.value)}
                                        className="w-full bg-[#1e293b] text-white p-3 pl-10 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none font-medium text-center"
                                        placeholder="0"
                                    />
                                </div>
                                <button onClick={handleAddBill} className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg p-3 transition flex items-center justify-center">
                                    <Plus size={20} />
                                </button>
                            </div>

                            {bills.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                                    <Wallet size={32} className="mb-2 opacity-50" />
                                    <span className="font-semibold text-sm">No bills added yet</span>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {bills.map((bill, i) => (
                                        <div key={i} className="flex justify-between items-center py-2 px-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                            <span className="text-slate-300 font-medium">{bill.name}</span>
                                            <span className="text-white font-bold">RM {bill.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>


                        <div className="flex gap-4 mt-8">
                            <button onClick={handlePrev} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition flex justify-center items-center shrink-0">
                                <ArrowLeft size={20} />
                            </button>
                            <button onClick={handleNext} disabled={!canContinue()} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed disabled:text-blue-200 text-white rounded-xl font-bold transition flex justify-center items-center gap-2">
                                Continue <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Savings */}
                {step === 5 && (
                    <div className="animate-slide-up">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Do you have any preset monthly savings?</h1>
                        <p className="text-slate-400 mb-8 text-[15px]">Select whether you allocate a specific amount for savings every month.</p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => setHasSavings(true)}
                                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${hasSavings ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'bg-[#111827] border-slate-700/50 hover:border-slate-600 text-slate-400'}`}>
                                <Smile size={32} />
                                <span className="font-bold">Yes</span>
                            </button>
                            <button
                                onClick={() => setHasSavings(false)}
                                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${!hasSavings ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'bg-[#111827] border-slate-700/50 hover:border-slate-600 text-slate-400'}`}>
                                <Frown size={32} opacity={0.5} />
                                <span className="font-bold">No</span>
                            </button>
                        </div>

                        {hasSavings && (
                            <div className="animate-fade-in space-y-6">
                                {renderInput('Allocated Monthly Savings', savingsAmount, setSavingsAmount)}
                                <div className="pt-4 border-t border-slate-700/50">
                                    <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Monthly Emergency Fund Allocation</h2>
                                    <p className="text-slate-400 mb-6 text-sm">How much do you set aside for your emergency fund each month?</p>
                                    {renderInput('Monthly Emergency Fund', emergencySavingsAmount, setEmergencySavingsAmount)}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 mt-8">
                            <button onClick={handlePrev} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition flex justify-center items-center shrink-0">
                                <ArrowLeft size={20} />
                            </button>
                            <button onClick={handleNext} disabled={!canContinue()} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed disabled:text-blue-200 text-white rounded-xl font-bold transition flex justify-center items-center gap-2">
                                Continue <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 6: Smart Goals */}
                {step === 6 && (
                    <div className="animate-slide-up">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Any major financial goals?</h1>
                        <p className="text-slate-400 mb-6 text-[15px]">Buying a house, car, or starting a business? Add them here.</p>

                        {!isAddingOnboardingGoal ? (
                            <div className="space-y-4">
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {onboardingGoals.map((goal) => {
                                        const CatIcon = categories.find(c => c.name === goal.category)?.icon || Target;
                                        return (
                                            <div key={goal.id} className="bg-[#111827] border border-slate-700/50 rounded-xl p-4 flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500">
                                                        <CatIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{goal.name}</div>
                                                        <div className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">RM{goal.targetAmount.toLocaleString()} • {goal.deadlineMonths} Mo</div>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeOnboardingGoal(goal.id)} className="text-slate-500 hover:text-red-500 p-2">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setIsAddingOnboardingGoal(true)}
                                    className="w-full py-4 border-2 border-dashed border-slate-700/50 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-all font-bold"
                                >
                                    <Plus size={20} /> Add A Smart Goal
                                </button>
                            </div>
                        ) : (
                            <div className="bg-[#111827] border border-blue-500/30 rounded-2xl p-6 animate-fade-in">
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {categories.map(cat => {
                                                const Icon = cat.icon;
                                                const active = newOnboardingGoal.category === cat.name;
                                                return (
                                                    <button
                                                        key={cat.name}
                                                        onClick={() => setNewOnboardingGoal({ ...newOnboardingGoal, category: cat.name })}
                                                        className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${active ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#0b101b] border-slate-800 text-slate-600'}`}
                                                    >
                                                        <Icon size={16} />
                                                        <span className="text-[8px] font-bold uppercase truncate w-full text-center">{cat.name.split('/')[0]}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Goal Name</label>
                                        <input
                                            type="text"
                                            value={newOnboardingGoal.name}
                                            onChange={e => setNewOnboardingGoal({ ...newOnboardingGoal, name: e.target.value })}
                                            className="w-full bg-[#0b101b] border border-slate-700 p-3 rounded-lg text-white font-bold text-sm focus:border-blue-500 focus:outline-none"
                                            placeholder="e.g. New Car Deposit"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Target (RM)</label>
                                            <input
                                                type="number"
                                                value={newOnboardingGoal.targetAmount || ''}
                                                onChange={e => setNewOnboardingGoal({ ...newOnboardingGoal, targetAmount: Number(e.target.value) })}
                                                className="w-full bg-[#0b101b] border border-slate-700 p-3 rounded-lg text-white font-bold text-sm focus:border-blue-500 focus:outline-none"
                                                placeholder="10000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Months: {newOnboardingGoal.deadlineMonths}</label>
                                            <input
                                                type="range"
                                                min="1" max="60"
                                                value={newOnboardingGoal.deadlineMonths}
                                                onChange={e => setNewOnboardingGoal({ ...newOnboardingGoal, deadlineMonths: Number(e.target.value) })}
                                                className="w-full mt-2 accent-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setIsAddingOnboardingGoal(false)} className="flex-1 py-3 bg-slate-800 text-white rounded-lg font-bold">Cancel</button>
                                        <button onClick={handleAddOnboardingGoal} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold">Add Goal</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 mt-8">
                            <button onClick={handlePrev} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition flex justify-center items-center shrink-0">
                                <ArrowLeft size={20} />
                            </button>
                            <button onClick={handleNext} disabled={isAddingOnboardingGoal} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed disabled:text-blue-200 text-white rounded-xl font-bold transition flex justify-center items-center gap-2">
                                Continue <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 7: Food Expenses */}
                {step === 7 && (
                    <div className="animate-slide-up">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">How much is your estimated monthly personal & food expenses?</h1>
                        <p className="text-slate-400 mb-8 text-[15px]">Are your current expenses for this category higher or lower?</p>

                        <div className="flex flex-col items-center justify-center bg-[#111827] border border-slate-700/50 rounded-3xl p-10 mb-8 relative">
                            <div className="flex items-center justify-between w-full max-w-[280px]">
                                <button onClick={() => setFoodExpenses(Math.max(0, foodExpenses - 10))} className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xl font-bold transition-all shadow-md active:scale-95 group border border-slate-700">
                                    <span className="group-hover:-translate-x-0.5 transition-transform">-10</span>
                                </button>

                                <div className="flex flex-col items-center">
                                    <span className="text-slate-500 font-bold text-sm tracking-widest uppercase mb-1">RM</span>
                                    <span className="text-5xl font-extrabold text-white tracking-tight">{foodExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                </div>

                                <button onClick={() => setFoodExpenses(foodExpenses + 10)} className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-xl font-bold transition-all shadow-md active:scale-95 group">
                                    <span className="group-hover:translate-x-0.5 transition-transform">+10</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={handlePrev} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition flex justify-center items-center shrink-0">
                                <ArrowLeft size={20} />
                            </button>
                            <button onClick={handleNext} disabled={!canContinue()} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed disabled:text-blue-200 text-white rounded-xl font-bold transition flex justify-center items-center gap-2">
                                Continue <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 8: Finish */}
                {step === 8 && (
                    <div className="animate-slide-up">
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-ping" />
                                <Sparkles size={36} />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">You're all set!</h1>
                            <p className="text-slate-400 text-[15px] leading-relaxed max-w-[280px] mx-auto">We've personalized your dashboard based on your financial footprint.</p>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className="bg-[#111827] border border-blue-500/20 rounded-2xl p-5 flex gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">Optimization Engine</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Explores smarter financial paths to help you reduce costs in terms of transportation, accommodation, lifestyle and exploring eligible subsidies.</p>
                                </div>
                            </div>

                            <div className="bg-[#111827] border border-indigo-500/20 rounded-2xl p-5 flex gap-4">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                                    <Briefcase size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">Wealth+ Engine</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Intelligently allocates between Malaysian savings and investment options to move you toward your target wealth.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center mb-8 gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Powered by</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 font-extrabold tracking-widest text-lg animate-pulse flex items-center gap-1">
                                    <Sparkles size={16} className="text-blue-400" />
                                    GEMINI
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={handlePrev} disabled={isSubmitting} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition flex justify-center items-center shrink-0 disabled:opacity-50">
                                <ArrowLeft size={20} />
                            </button>
                            <button
                                onClick={handleFinish}
                                disabled={isSubmitting}
                                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex justify-center items-center gap-2 disabled:bg-blue-600/50"
                            >
                                {isSubmitting ? 'Analyzing...' : 'Enter Dashboard'} <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingView;
