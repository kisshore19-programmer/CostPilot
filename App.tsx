import React, { useState } from 'react';
import { ViewState, UserProfile } from './types';
import TopBar from './components/TopBar';
import OptimizationView from './components/OptimizationView';
import Optimization2View from './components/Optimization2View';
import DashboardView from './components/DashboardView';
import WealthPlusView from './components/WealthPlusView';

import SettingsView from './components/SettingsView';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { UserProvider, useUser } from './src/contexts/UserContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import LoginView from './src/components/LoginView';
import OnboardingView from './src/components/OnboardingView';
import { RefreshCw } from 'lucide-react';

const AuthenticatedApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: userLoading, error: userError, updateProfile } = useUser();
  const [currentView, setView] = useState<ViewState>(ViewState.DASHBOARD);

  if (authLoading || (user && userLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Profile</h2>
          <p className="text-slate-600 mb-4">{userError}</p>
          <p className="text-sm text-slate-500">Please check your internet connection and Firebase permissions.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Check for email verification
  if (user && !user.emailVerified) {
    return <LoginView />;
  }

  // Fallback if profile is null (shouldn't happen after loading, but for safety)
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (userProfile.hasCompletedOnboarding === false) {
    return <OnboardingView />;
  }

  const renderView = () => {
    switch (currentView) {
      case ViewState.OPTIMIZATION:
        return <OptimizationView userProfile={userProfile} updateProfile={updateProfile} setView={setView} />;
      case ViewState.OPTIMIZATION2:
        return <Optimization2View userProfile={userProfile} updateProfile={updateProfile} setView={setView} />;
      case ViewState.WEALTH_PLUS:
        return <WealthPlusView userProfile={userProfile} updateProfile={updateProfile} setView={setView} />;
      case ViewState.DASHBOARD:
        return <DashboardView userProfile={userProfile} updateProfile={updateProfile} setView={setView} />;

      case ViewState.SETTINGS:
        return <SettingsView userProfile={userProfile} setUserProfile={updateProfile} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
            <p className="text-lg">Module under construction.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-200">
      <TopBar currentView={currentView} setView={setView} userProfile={userProfile} />
      <main className="pb-12">
        {renderView()}
      </main>

      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-8 mt-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 dark:text-slate-500 text-sm">
          <p>&copy; 2026 CostPilot. Built for KitaHack 2026 by TVK. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <ThemeProvider>
          <AuthenticatedApp />
        </ThemeProvider>
      </UserProvider>
    </AuthProvider>
  );
};

export default App;