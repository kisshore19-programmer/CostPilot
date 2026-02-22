import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Save, User, Building, MapPin, Briefcase, Car } from 'lucide-react';
import { useUser } from '../src/contexts/UserContext';

interface SettingsViewProps {
  userProfile: UserProfile;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userProfile }) => {
  const { updateProfile, uploadProfilePicture } = useUser();
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const transportModes = [
    'Private Vehicle',
    'Motorcycle',
    'Bicycle',
    'Walking',
    'Public Transport',
    'Company Bus/Vehicle'
  ];

  const currentModes = Array.isArray(formData.commuteMethod)
    ? formData.commuteMethod
    : [formData.commuteMethod].filter(Boolean) as string[];

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleTransportMode = (mode: string) => {
    const nextModes = currentModes.includes(mode)
      ? currentModes.filter(m => m !== mode)
      : [...currentModes, mode];
    handleChange('commuteMethod', nextModes);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("File size must be less than 1MB");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalPhotoUrl = formData.photoUrl;
      if (selectedFile) {
        finalPhotoUrl = await uploadProfilePicture(selectedFile);
      }

      const financialFields = ['income', 'rent', 'utilities', 'transportCost', 'food', 'debt', 'subscriptions', 'savings'];
      const hasFinancialChange = financialFields.some(field =>
        formData[field as keyof typeof formData] !== userProfile[field as keyof UserProfile]
      );

      const updateData: any = {
        ...formData,
        photoUrl: finalPhotoUrl
      };

      if (hasFinancialChange) {
        updateData.optimizedCategories = [];
      }

      await updateProfile(updateData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert(`Failed to update profile: ${(error as any).message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in font-sans">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 text-base mt-2">Personalize your experience and update your financial profile.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Personal Details Section */}
        <div className="bg-white dark:bg-[#131b2f] border border-slate-200 dark:border-[#1e293b] rounded-[2rem] p-8 shadow-xl space-y-8">
          <div className="flex items-center gap-6 pb-6 border-b border-slate-200 dark:border-slate-700/50">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                {(previewUrl || formData.photoUrl) ? (
                  <img src={previewUrl || formData.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User size={40} className="text-slate-400" />
                )}
              </div>
              <label htmlFor="fileInput" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
              </label>
              <input type="file" id="fileInput" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{formData.name || 'User'}</h2>
              <p className="text-sm text-slate-400 font-medium">{formData.occupation || 'Update your occupation'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={16} className="text-blue-500" /> Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">Occupation</label>
                <input
                  type="text"
                  value={formData.occupation || ''}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">Household Size</label>
              <input
                type="number"
                min="1"
                value={formData.householdSize || 1}
                onChange={(e) => handleChange('householdSize', parseInt(e.target.value))}
                className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Financial Commitments Section */}
        <div className="bg-white dark:bg-[#131b2f] border border-slate-200 dark:border-[#1e293b] rounded-[2rem] p-8 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700/50">
            <Briefcase size={16} className="text-emerald-500" /> Financial profile (RM)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Monthly Income</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-slate-300">RM</span>
                <input
                  type="number"
                  value={formData.income || ''}
                  onChange={(e) => handleChange('income', Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-white font-black text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Allocated Savings (Monthly)</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-slate-300">RM</span>
                <input
                  type="number"
                  value={formData.savings || ''}
                  onChange={(e) => handleChange('savings', Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-white font-black text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Emergency Fund Balance</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-slate-300">RM</span>
                <input
                  type="number"
                  value={formData.emergencySavings || ''}
                  onChange={(e) => handleChange('emergencySavings', Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-white font-black text-lg focus:outline-none focus:border-indigo-500 transition-colors whitespace-nowrap"
                  placeholder="Total amount in your emergency fund"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Rent / Mortgage</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-slate-300">RM</span>
                <input
                  type="number"
                  value={formData.rent || ''}
                  onChange={(e) => handleChange('rent', Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-white font-black text-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Food & Personal</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-slate-300">RM</span>
                <input
                  type="number"
                  value={formData.food || ''}
                  onChange={(e) => handleChange('food', Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-white font-black text-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Utilities & Subscriptions</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-slate-300">RM</span>
                <input
                  type="number"
                  value={formData.subscriptions || ''}
                  onChange={(e) => handleChange('subscriptions', Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-white font-black text-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Transport Costs</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-slate-300">RM</span>
                <input
                  type="number"
                  value={formData.transportCost || ''}
                  onChange={(e) => handleChange('transportCost', Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-white font-black text-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transportation Section */}
        <div className="bg-white dark:bg-[#131b2f] border border-slate-200 dark:border-[#1e293b] rounded-[2rem] p-8 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700/50">
            <Car size={16} className="text-indigo-500" /> Commute preferences
          </h3>

          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-1 block">Active Transport Modes</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {transportModes.map(mode => {
                const selected = currentModes.includes(mode);
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => toggleTransportMode(mode)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selected ? 'bg-blue-600/10 border-blue-500 text-slate-800 dark:text-white' : 'bg-white dark:bg-[#0b101b] border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                    <span className="font-bold text-sm">{mode}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'border-blue-500 bg-blue-500' : 'border-slate-700'}`}>
                      {selected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-6 mt-8 flex justify-end items-center">
          {saved && (
            <span className="text-emerald-500 text-sm font-bold mr-4 animate-fade-in flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 flex items-center gap-2 disabled:opacity-70"
          >
            {uploading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Save size={18} />
            )}
            {uploading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default SettingsView;