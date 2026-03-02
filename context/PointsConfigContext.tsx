"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TaskComplexity, QualityRating, PointsConfig, KanbanTask, Level } from '../types';

// --- DEFAULT CONFIG (from RUDOREcontexte documents) ---
const DEFAULT_POINTS_CONFIG: PointsConfig = {
    basePoints: {
        [TaskComplexity.VERY_SIMPLE]: 10,
        [TaskComplexity.SIMPLE]: 25,
        [TaskComplexity.MEDIUM]: 50,
        [TaskComplexity.COMPLEX]: 100,
        [TaskComplexity.VERY_COMPLEX]: 200,
        [TaskComplexity.CRITICAL]: 400,
    },
    qualityMultipliers: {
        [QualityRating.REFUSED]: 0.5,
        [QualityRating.ACCEPTABLE]: 0.8,
        [QualityRating.GOOD]: 1.0,
        [QualityRating.EXCELLENT]: 1.2,
        [QualityRating.EXCEPTIONAL]: 1.5,
    },
    roleMultipliers: {
        [Level.JUNIOR]: 0.8,
        [Level.CONFIRMED]: 1.0,
        [Level.SENIOR]: 1.3,
        [Level.EXPERT]: 1.5,
    },
    bonusPercentage: 15,
    equityPoolPercentage: 25,
    vestingMonths: 48,
    cliffMonths: 12, // Document stratégique : 12 mois (standard international)
    agencyMonthlyRevenue: 50000000, // 50M XOF
    studioFundPercentage: 20, // Document Partie 1 : 20% réinvesti au Studio
    agencyOpsPercentage: 80, // 100 - 20 = 80% pour Ops & Bonus
    killGateThresholds: {
        budgetOverrunEnabled: true,
        delayEnabled: true,
        delayDaysThreshold: 30,
        revenueStagnationEnabled: true,
        revenueStagnationMonths: 3,
    },
};

const STORAGE_KEY = 'rudore_points_config';

// --- CONTEXT INTERFACE ---
interface PointsConfigContextType {
    config: PointsConfig;
    updateConfig: (patch: Partial<PointsConfig>) => void;
    resetConfig: () => void;
    calculateFinalPoints: (task: KanbanTask, memberLevel: string) => number;
    calculateBasePoints: (complexity: TaskComplexity) => number;
    calculateBonus: (totalPoints: number) => number;
    calculateEquity: (builderPoints: number, projectTotalPoints: number) => number;
    calculateVestedEquity: (equityAcquired: number, joinedAt: string) => { vested: number, total: number, months: number, isVested: boolean };
    getPointValue: (totalPointsDistributed: number) => number;
}

const PointsConfigContext = createContext<PointsConfigContextType | undefined>(undefined);

// --- PROVIDER ---
export const PointsConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<PointsConfig>(DEFAULT_POINTS_CONFIG);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/config');
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setConfig(data);
                }
            }
        } catch (error) {
            console.error("Error fetching config:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const updateConfig = useCallback(async (patch: Partial<PointsConfig>) => {
        const newConfig = { ...config, ...patch };
        setConfig(newConfig); // Optimistic update
        try {
            const res = await fetch('/api/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
            if (!res.ok) {
                // Revert on error
                fetchConfig();
            }
        } catch (error) {
            console.error("Error updating config:", error);
            fetchConfig();
        }
    }, [config, fetchConfig]);

    const resetConfig = useCallback(async () => {
        await updateConfig(DEFAULT_POINTS_CONFIG);
    }, [updateConfig]);

    // PB
    const calculateBasePoints = useCallback((complexity: TaskComplexity): number => {
        return config.basePoints[complexity] ?? 0;
    }, [config]);

    // PB × MQ × MR
    const calculateFinalPoints = useCallback((task: KanbanTask, memberLevel: string): number => {
        const pb = config.basePoints[task.complexity] ?? 0;
        const mq = task.qualityRating ? (config.qualityMultipliers[task.qualityRating] ?? 1.0) : 1.0;
        const mr = config.roleMultipliers[memberLevel] ?? 1.0;
        return Math.round(pb * mq * mr);
    }, [config]);

    // Valeur du point = (Revenus × bonusPercentage%) / totalPointsDistributed
    const getPointValue = useCallback((totalPointsDistributed: number): number => {
        if (totalPointsDistributed <= 0) return 0;
        return Math.round((config.agencyMonthlyRevenue * config.bonusPercentage / 100) / totalPointsDistributed);
    }, [config]);

    // Bonus = points × valeur du point
    const calculateBonus = useCallback((totalPoints: number): number => {
        // Simplified: assumes a fixed pool. Real formula needs totalPointsDistributed.
        return totalPoints;
    }, []);

    // % Équité = (builderPoints / projectTotalPoints) × equityPoolPercentage%
    // WARNING [SECURITY & ARCHITECTURE]: Financial calculations (Equity, Vesting, P&L) mapped here 
    // for UI prototyping MUST be moved to the backend. The frontend should only consume DTOs.
    // Using Math.round(val * 100) / 100 to avoid string conversion overheads of parseFloat(toFixed).
    const calculateEquity = useCallback((builderPoints: number, projectTotalPoints: number): number => {
        if (projectTotalPoints <= 0) return 0;
        const equity = (builderPoints / projectTotalPoints) * config.equityPoolPercentage;
        return Math.round(equity * 100) / 100;
    }, [config]);

    // Vesting: Si M < cliff → 0%, sinon (equity × M / vestingMonths)
    const calculateVestedEquity = useCallback((equityAcquired: number, joinedAt: string): { vested: number, total: number, months: number, isVested: boolean } => {
        const joinDate = new Date(joinedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - joinDate.getTime());
        const months = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4375)); // Average month length

        const isVested = months >= config.cliffMonths;
        const rawVested = isVested ? Math.min(equityAcquired, (equityAcquired * months / config.vestingMonths)) : 0;
        const vested = Math.round(rawVested * 100) / 100;

        return { vested, total: equityAcquired, months, isVested };
    }, [config]);

    return (
        <PointsConfigContext.Provider value={{
            config,
            updateConfig,
            resetConfig,
            calculateFinalPoints,
            calculateBasePoints,
            calculateBonus,
            calculateEquity,
            calculateVestedEquity,
            getPointValue,
        }}>
            {children}
        </PointsConfigContext.Provider>
    );
};


export const usePointsConfig = () => {
    const context = useContext(PointsConfigContext);
    if (context === undefined) {
        throw new Error('usePointsConfig must be used within a PointsConfigProvider');
    }
    return context;
};
