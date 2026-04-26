import React, { useState, useEffect } from 'react';
import { Moon, Sun, Globe, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check current theme by looking at html class
    if (document.documentElement.classList.contains('light')) {
      setTheme('light');
    }
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved successfully!');
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Platform Settings</h1>
        <p className="text-textSubtle">Customize your application experience and preferences.</p>
      </div>

      <div className="glass-card p-6 md:p-8 space-y-8">
        
        {/* Theme Settings */}
        <section>
          <div className="flex items-center space-x-3 mb-4 border-b border-white/10 pb-2">
            <Moon className="text-primary" size={24} />
            <h2 className="text-xl font-semibold">Appearance</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-3 transition-colors ${
                theme === 'dark' ? 'bg-primary/20 border-primary text-white' : 'bg-black/20 border-white/5 text-textSubtle hover:bg-white/5'
              }`}
            >
              <Moon size={32} />
              <span className="font-medium">Dark Mode (Default)</span>
            </button>
            
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-3 transition-colors ${
                theme === 'light' ? 'bg-primary/20 border-primary text-white' : 'bg-black/20 border-white/5 text-textSubtle hover:bg-white/5'
              }`}
            >
              <Sun size={32} />
              <span className="font-medium">Light Mode (Simulated)</span>
            </button>
          </div>
          <p className="text-xs text-textSubtle mt-3">
             * Note: The UI is fundamentally designed as a dark glassmorphism SaaS. Light mode toggles the root class for broad structural overrides.
          </p>
        </section>

        {/* Language Settings */}
        <section>
          <div className="flex items-center space-x-3 mb-4 border-b border-white/10 pb-2">
            <Globe className="text-secondary" size={24} />
            <h2 className="text-xl font-semibold">Language & Region</h2>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-textSubtle mb-2">Display Language</label>
            <select 
              className="input-field bg-black/40 w-full max-w-md"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English (United States)</option>
              <option value="es">Español (International)</option>
              <option value="fr">Français (France)</option>
            </select>
          </div>
        </section>

        {/* Save Actions */}
        <div className="pt-6 border-t border-white/10 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center px-6 py-3"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
