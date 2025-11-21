
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { encryptKey, decryptKey } from '../utils/secureStorage';

export type AIProvider = 'google' | 'openai' | 'glm' | 'custom';

type ProviderKeys = {
  google?: string;
  openai?: string;
  glm?: string;
  custom?: string;
};

export type ModelSettings = {
  provider: AIProvider;
  keys: ProviderKeys;
  baseUrl: string;
  modelName: string;
  apiKey?: string;
};

interface SettingsContextType {
  settings: ModelSettings;
  updateSettings: (newSettings: Partial<ModelSettings>) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
}

const DEFAULT_SETTINGS: ModelSettings = {
  provider: 'google',
  keys: { google: process.env.GEMINI_API_KEY || '' },
  baseUrl: '',
  modelName: 'gemini-2.5-flash'
};

const SETTINGS_KEY_V1 = 'lexigen_settings_v1';
const SETTINGS_KEY_V2 = 'lexigen_settings_v2';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const savedV2 = localStorage.getItem(SETTINGS_KEY_V2);
    if (savedV2) {
      try {
        const parsed = JSON.parse(savedV2);
        const keys: ProviderKeys = {};
        if (parsed.keys) {
          for (const k of ['google', 'openai', 'glm', 'custom']) {
            if (parsed.keys[k]) keys[k as keyof ProviderKeys] = decryptKey(parsed.keys[k]);
          }
        }
        const merged = { ...DEFAULT_SETTINGS, ...parsed, keys: { ...DEFAULT_SETTINGS.keys, ...keys } };
        setSettings(merged);
        return;
      } catch {}
    }

    const savedV1 = localStorage.getItem(SETTINGS_KEY_V1);
    if (savedV1) {
      try {
        const parsed = JSON.parse(savedV1);
        const apiKey = parsed.apiKey ? decryptKey(parsed.apiKey) : '';
        const provider: AIProvider = parsed.provider || DEFAULT_SETTINGS.provider;
        const keys: ProviderKeys = {};
        if (apiKey) keys[provider] = apiKey;
        const merged = { ...DEFAULT_SETTINGS, ...parsed, keys } as ModelSettings;
        setSettings(merged);
        const toSave = {
          ...merged,
          keys: Object.fromEntries(
            Object.entries(merged.keys).map(([p, v]) => [p, v ? encryptKey(v) : v])
          )
        };
        localStorage.setItem(SETTINGS_KEY_V2, JSON.stringify(toSave));
      } catch (e) {
        console.error('Failed to migrate settings', e);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  const updateSettings = (newSettings: Partial<ModelSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      const keys: ProviderKeys = {};
      for (const k of ['google', 'openai', 'glm', 'custom']) {
        const val = updated.keys?.[k as keyof ProviderKeys];
        if (val) keys[k as keyof ProviderKeys] = val;
      }
      const toSave = {
        ...updated,
        keys: Object.fromEntries(
          Object.entries(keys).map(([p, v]) => [p, v ? encryptKey(v) : v])
        )
      };
      localStorage.setItem(SETTINGS_KEY_V2, JSON.stringify(toSave));
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isSettingsOpen, setIsSettingsOpen }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
