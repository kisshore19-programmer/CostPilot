import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogIn, UserPlus, AlertCircle, Sun, Moon, RefreshCw } from 'lucide-react';
import { updateProfile } from 'firebase/auth';

const LoginView: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const [googleLoading, setGoogleLoading] = useState(false);

    // Typing Animation State
    const [line1P1, setLine1P1] = useState('');
    const [line1Grad, setLine1Grad] = useState('');
    const [line1P2, setLine1P2] = useState(''); // The period

    const [line2P1, setLine2P1] = useState('');
    const [line2Grad, setLine2Grad] = useState('');
    const [line2P2, setLine2P2] = useState(''); // The period

    const [cursorVisible, setCursorVisible] = useState(true);
    const [activeLine, setActiveLine] = useState(1); // 1 or 2 or 0 (done)

    useEffect(() => {
        const l1Text = "THE COST OF LIVING IS ";
        const l1GradText = "RISING";
        const l2Text = "YOUR DECISIONS SHOULD BE ";
        const l2GradText = "SMARTER";

        let currentStep = 0;
        const typeSpeed = 50;
        const pauseTime = 1000;

        const runAnimation = async () => {
            // Type Line 1 Part 1
            for (let i = 0; i <= l1Text.length; i++) {
                setLine1P1(l1Text.slice(0, i));
                await new Promise(r => setTimeout(r, typeSpeed));
            }

            // Type Line 1 Gradient
            for (let i = 0; i <= l1GradText.length; i++) {
                setLine1Grad(l1GradText.slice(0, i));
                await new Promise(r => setTimeout(r, typeSpeed));
            }

            // Type Line 1 Period
            setLine1P2('.');

            // Blink Cursor on Line 1
            setActiveLine(1);
            await new Promise(r => setTimeout(r, pauseTime));

            // Switch to Line 2
            setActiveLine(2);

            // Type Line 2 Part 1
            for (let i = 0; i <= l2Text.length; i++) {
                setLine2P1(l2Text.slice(0, i));
                await new Promise(r => setTimeout(r, typeSpeed));
            }

            // Type Line 2 Gradient
            for (let i = 0; i <= l2GradText.length; i++) {
                setLine2Grad(l2GradText.slice(0, i));
                await new Promise(r => setTimeout(r, typeSpeed));
            }

            // Type Line 2 Period
            setLine2P2('.');

            // End
            setActiveLine(0);
        };

        runAnimation();
    }, []);

    // Blinking cursor effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCursorVisible(v => !v);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const { signIn, signUp, signInWithGoogle, sendVerificationEmail, logout, user } = useAuth();
    // ... existing handlers ...

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await signIn(email, password);
                // User is signed in. App.tsx will check if verification needed on re-render.
            } else {
                const userCredential = await signUp(email, password);
                if (userCredential.user) {
                    if (name.trim()) {
                        await updateProfile(userCredential.user, { displayName: name.trim() });
                    }
                    await sendVerificationEmail(userCredential.user);
                    // User is signed in. App.tsx will check if verification needed on re-render.
                }
            }
        } catch (err: any) {
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Email or Password is Incorrect. Please try again.');
            } else {
                setError(err.message.replace('Firebase: ', ''));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setGoogleLoading(true);
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setGoogleLoading(false);
        }
    };

    // Verification Overlay Logic
    const showVerificationOverlay = user && !user.emailVerified;
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendMessage, setResendMessage] = useState('');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendCooldown]);

    const handleResendVerification = async () => {
        if (user && resendCooldown === 0) {
            try {
                await sendVerificationEmail(user);
                setResendMessage('Email sent!');
                setResendCooldown(60); // 60 seconds cooldown
                setTimeout(() => setResendMessage(''), 5000);
            } catch (err: any) {
                setResendMessage('Error sending email.');
                console.error(err);
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-200 relative overflow-hidden">
            {/* Verification Overlay */}
            {showVerificationOverlay && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md animate-fade-in transition-all duration-500">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 text-center animate-scale-in">
                        <div className="mb-6 flex justify-center">
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full animate-bounce-short">
                                <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Email Not Verified
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            We have sent a verification link to <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.email}</span>. Please check your inbox (and spam folder).
                        </p>

                        {resendMessage && (
                            <div className={`mb-4 text-sm font-medium ${resendMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                                {resendMessage}
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={handleResendVerification}
                                disabled={resendCooldown > 0}
                                className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold py-3.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : 'Resend Verification Email'}
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-95 shadow-md flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={20} /> I've Verified My Email
                            </button>
                            <button
                                onClick={() => logout()}
                                className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <LogIn size={16} className="rotate-180" /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header with Dark Mode Toggle */}
            <header className="absolute top-0 right-0 p-4 sm:p-6 z-10 w-full flex justify-end">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
                >
                    {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
                </button>
            </header>

            {/* Main Content */}
            <main className={`flex-grow flex items-center justify-center p-4 sm:p-8 transition-all duration-500 ${showVerificationOverlay ? 'scale-95 opacity-50 blur-[2px]' : ''}`}>
                <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Hero Section */}
                    <div className="flex-1 text-center lg:text-left animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-6 h-16 justify-center lg:justify-start">
                            <img src="/favicon1.png" alt="CostPilot" className="h-12 w-auto animate-fade-in" />
                            <span className="text-4xl font-medium font-logo text-slate-900 dark:text-white animate-fade-in delay-100">
                                CostPilot
                            </span>
                        </div>
                        <div className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-6 flex flex-col items-center lg:items-start min-h-[160px] lg:min-h-[auto]">
                            <div>
                                {line1P1}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                    {line1Grad}
                                </span>
                                {line1P2}
                                {activeLine === 1 && (
                                    <span className={`${cursorVisible ? 'opacity-100' : 'opacity-0'} text-blue-600 ml-1`}>|</span>
                                )}
                            </div>
                            <div>
                                {line2P1}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                                    {line2Grad}
                                </span>
                                {line2P2}
                                {activeLine === 2 && (
                                    <span className={`${cursorVisible ? 'opacity-100' : 'opacity-0'} text-purple-600 ml-1`}>|</span>
                                )}
                            </div>
                        </div>
                        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium mb-8">
                            Meet <span className="font-semibold font-logo text-slate-900 dark:text-white">CostPilot</span>, Your AI Cost-of-Living Navigator.
                        </p>
                    </div>

                    {/* Login Form Section */}
                    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700 animate-fade-in-up delay-100 flex-shrink-0">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">
                                {isLogin ? 'Sign in to access your dashboard' : 'Get started with your financial journey'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm mb-6 border border-red-100 dark:border-red-800 animate-fade-in-up">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <form key={isLogin ? 'login' : 'signup'} onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:shadow-md"
                                        placeholder="John Doe"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:shadow-md"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:shadow-md"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || googleLoading || showVerificationOverlay}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none text-lg"
                            >
                                {loading ? 'Processing...' : isLogin ? (
                                    <>
                                        <LogIn size={20} /> Sign In
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={20} /> Create Account
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading || googleLoading || showVerificationOverlay}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none text-lg"
                            >
                                {googleLoading ? 'Connecting...' : (
                                    <>
                                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                        Sign in with Google
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                disabled={showVerificationOverlay}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:no-underline"
                            >
                                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer matching App.tsx */}
            <footer className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                    <p>&copy; 2026 CostPilot. Built for KitaHack 2026 by TVK. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LoginView;
