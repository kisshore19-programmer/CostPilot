import React from 'react';
import { UserProfile, ViewState } from '../types';
import { User, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';

interface TopBarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  userProfile?: UserProfile;
}

const TopBar: React.FC<TopBarProps> = ({ currentView, setView, userProfile }) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navItems = [
    { label: 'Dashboard', value: ViewState.DASHBOARD },
    { label: 'Optimization', value: ViewState.OPTIMIZATION2 },
    { label: 'Wealth+', value: ViewState.WEALTH_PLUS },
    { label: 'Settings', value: ViewState.SETTINGS },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(ViewState.DASHBOARD)}>
            <img src="/favicon1.png" alt="CostPilot Logo" className="h-12 w-auto" />
            <span className="text-2xl font-medium font-logo text-slate-900 dark:text-white">
              CostPilot
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => setView(item.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentView === item.value
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>



            <div
              className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400 cursor-pointer overflow-hidden"
              onClick={() => setView(ViewState.SETTINGS)}
              title="Settings"
            >
              {userProfile?.photoUrl ? (
                <img src={userProfile.photoUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User size={16} />
              )}
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Log Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;