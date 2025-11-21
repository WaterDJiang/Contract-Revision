
import React, { useState, useEffect } from 'react';
import { IconX, IconSettings, IconKey } from './Icons';
import { useSettings, AIProvider } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';

const SettingsModal: React.FC = () => {
  const { settings, updateSettings, isSettingsOpen, setIsSettingsOpen } = useSettings();
  const { t } = useLanguage();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [showKey, setShowKey] = useState(false);

  // Update local state when modal opens
  useEffect(() => {
    if (isSettingsOpen) {
      setLocalSettings(settings);
    }
  }, [isSettingsOpen, settings]);

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    updateSettings(localSettings);
    setIsSettingsOpen(false);
  };

  const handleProviderChange = (provider: AIProvider) => {
    let modelName = localSettings.modelName;
    if (provider === 'google') modelName = 'gemini-2.5-flash';
    else if (provider === 'glm') modelName = 'glm-4';
    else if (provider === 'openai') modelName = 'gpt-4';

    setLocalSettings({ ...localSettings, provider, modelName });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-zinc-100">
            <div className="p-2 rounded-lg bg-zinc-800">
              <IconSettings className="w-5 h-5 text-brand-500" />
            </div>
            <h2 className="text-lg font-semibold">{t.settings.title}</h2>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-zinc-800"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">{t.settings.providerLabel}</label>
            <div className="grid grid-cols-4 gap-2">
              {(['google', 'openai', 'glm', 'custom'] as AIProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`py-2 px-1 rounded-lg text-xs font-medium capitalize transition-colors border truncate ${
                    localSettings.provider === p 
                      ? 'bg-brand-600 border-brand-500 text-white' 
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                  title={t.settings.providers[p] || p}
                >
                  {p === 'glm' ? 'GLM' : p}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input - Hidden for GLM */}
          {localSettings.provider !== 'glm' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <IconKey className="w-3 h-3" /> {t.settings.apiKeyLabel}
              </label>
              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"}
                  value={localSettings.apiKey}
                  onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  {showKey ? t.settings.hide : t.settings.show}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">{t.settings.apiKeyNote}</p>
            </div>
          ) : (
            <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
               <IconKey className="w-4 h-4" />
               {t.settings.systemManaged}
            </div>
          )}

          {/* Base URL (for custom/openai) */}
          {(localSettings.provider === 'openai' || localSettings.provider === 'custom') && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="text-sm font-medium text-zinc-400">{t.settings.baseUrlLabel}</label>
              <input 
                type="text"
                value={localSettings.baseUrl}
                onChange={(e) => setLocalSettings({ ...localSettings, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          )}

          {/* Model Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">{t.settings.modelLabel}</label>
            <input 
              type="text"
              value={localSettings.modelName}
              onChange={(e) => setLocalSettings({ ...localSettings, modelName: e.target.value })}
              placeholder={
                localSettings.provider === 'google' ? 'gemini-2.5-flash' : 
                localSettings.provider === 'glm' ? 'glm-4.6' : 'gpt-4'
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            {t.settings.cancel}
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-lg shadow-brand-500/20 transition-all"
          >
            {t.settings.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
