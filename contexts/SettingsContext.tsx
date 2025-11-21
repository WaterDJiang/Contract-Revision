
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { encryptKey, decryptKey, setPassphrase, isSecureEnabled } from '../utils/secureStorage';

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

const ENV: any = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};
const defaultProvider: AIProvider = 'glm';
const defaultModelName = 'glm-4.6';
const DEFAULT_SETTINGS: ModelSettings = {
  provider: defaultProvider,
  keys: {
    google: (process.env.GEMINI_API_KEY as string) || (ENV.VITE_GEMINI_API_KEY as string) || '',
    openai: (process.env.OPENAI_API_KEY as string) || (ENV.VITE_OPENAI_API_KEY as string) || '',
    glm: (process.env.GLM_API_KEY as string) || (ENV.VITE_GLM_API_KEY as string) || '',
    custom: (process.env.CUSTOM_API_KEY as string) || (ENV.VITE_CUSTOM_API_KEY as string) || ''
  },
  baseUrl: '',
  modelName: defaultModelName
};

const SETTINGS_KEY_V1 = 'lexigen_settings_v1';
const SETTINGS_KEY_V2 = 'lexigen_settings_v2';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const savedV2 = localStorage.getItem(SETTINGS_KEY_V2);
      if (savedV2) {
        try {
          const parsed = JSON.parse(savedV2);
          const keys: ProviderKeys = {};
          if (parsed.keys) {
            for (const k of ['google', 'openai', 'glm', 'custom']) {
              const val = parsed.keys[k];
              if (val) keys[k as keyof ProviderKeys] = await decryptKey(val);
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
          const apiKey = parsed.apiKey ? await decryptKey(parsed.apiKey) : '';
          const provider: AIProvider = parsed.provider || DEFAULT_SETTINGS.provider;
          const keys: ProviderKeys = {};
          if (apiKey) keys[provider] = apiKey;
          const merged = { ...DEFAULT_SETTINGS, ...parsed, keys } as ModelSettings;
          setSettings(merged);
          const toSave = {
            ...merged,
            keys: Object.fromEntries(
              await Promise.all(
                Object.entries(merged.keys).map(async ([p, v]) => [p, v ? await encryptKey(v) : v])
              )
            )
          };
          localStorage.setItem(SETTINGS_KEY_V2, JSON.stringify(toSave));
        } catch (e) {
          console.error('Failed to migrate settings', e);
        }
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    };
    load();
  }, []);

  const updateSettings = (newSettings: Partial<ModelSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      (async () => {
        const keys: ProviderKeys = {};
        for (const k of ['google', 'openai', 'glm', 'custom']) {
          const val = updated.keys?.[k as keyof ProviderKeys];
          if (val) keys[k as keyof ProviderKeys] = val;
        }
        const encPairs = await Promise.all(
          Object.entries(keys).map(async ([p, v]) => [p, v ? await encryptKey(v) : v])
        );
        const toSave = { ...updated, keys: Object.fromEntries(encPairs) };
        localStorage.setItem(SETTINGS_KEY_V2, JSON.stringify(toSave));
      })();
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
