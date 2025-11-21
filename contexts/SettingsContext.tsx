
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { encryptKey, decryptKey } from '../utils/secureStorage';

export type AIProvider = 'google' | 'openai' | 'glm' | 'custom';

export interface ModelSettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

interface SettingsContextType {
  settings: ModelSettings;
  updateSettings: (newSettings: Partial<ModelSettings>) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
}

const DEFAULT_SETTINGS: ModelSettings = {
  provider: 'google',
  apiKey: process.env.API_KEY || '', 
  baseUrl: '',
  modelName: 'gemini-2.5-flash'
};

const SETTINGS_KEY = 'lexigen_settings_v1';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Decrypt key
        if (parsed.apiKey) {
          parsed.apiKey = decryptKey(parsed.apiKey);
        }
        
        // Merge with defaults. 
        // Critical: If stored key is empty but we have an env key, use env key.
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        
        // Ensure backward compatibility or env overrides if needed
        if (!merged.apiKey && process.env.API_KEY) {
          merged.apiKey = process.env.API_KEY;
        }

        setSettings(merged);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<ModelSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Save to local storage with encryption
      const toSave = { ...updated };
      if (toSave.apiKey) {
        toSave.apiKey = encryptKey(toSave.apiKey);
      }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
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
