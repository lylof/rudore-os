"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type FeatureKey =
  | 'ENABLE_DASHBOARD'
  | 'ENABLE_STUDIO'
  | 'ENABLE_AGENCY'
  | 'ENABLE_SQUADS'
  | 'ENABLE_TALENTS'
  | 'ENABLE_CONTRIBUTIONS'
  | 'ENABLE_KANBAN';

interface FeatureFlagContextType {
  flags: Record<FeatureKey, boolean>;
  toggleFlag: (key: FeatureKey) => void;
  resetFlags: () => void;
}

const DEFAULT_FLAGS: Record<FeatureKey, boolean> = {
  ENABLE_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_DASHBOARD !== 'false',
  ENABLE_STUDIO: process.env.NEXT_PUBLIC_ENABLE_STUDIO !== 'false',
  ENABLE_AGENCY: process.env.NEXT_PUBLIC_ENABLE_AGENCY !== 'false',
  ENABLE_SQUADS: process.env.NEXT_PUBLIC_ENABLE_SQUADS !== 'false',
  ENABLE_TALENTS: process.env.NEXT_PUBLIC_ENABLE_TALENTS !== 'false',
  ENABLE_CONTRIBUTIONS: process.env.NEXT_PUBLIC_ENABLE_CONTRIBUTIONS !== 'false',
  ENABLE_KANBAN: process.env.NEXT_PUBLIC_ENABLE_KANBAN !== 'false',
};

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Record<FeatureKey, boolean>>(DEFAULT_FLAGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('rudore_feature_flags');
    if (saved) {
      try {
        setFlags(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error("Error parsing feature flags from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('rudore_feature_flags', JSON.stringify(flags));
    }
  }, [flags, mounted]);

  const toggleFlag = (key: FeatureKey) => {
    setFlags(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const resetFlags = () => {
    setFlags(DEFAULT_FLAGS);
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, toggleFlag, resetFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};
