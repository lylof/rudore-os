"use client";

import React from 'react';
import { TaskComplexity, QualityRating, COMPLEXITY_LABELS, QUALITY_LABELS, Level } from '../../types';
import { usePointsConfig } from '../../context/PointsConfigContext';
import { RotateCcw, Zap, Settings2, X } from 'lucide-react';

export const PointsConfigPanel: React.FC = () => {
    const { config, updateConfig, resetConfig } = usePointsConfig();

    const updateBasePoint = (complexity: TaskComplexity, value: number) => {
        updateConfig({
            basePoints: { ...config.basePoints, [complexity]: value },
        });
    };

    const updateQualityMult = (quality: QualityRating, value: number) => {
        updateConfig({
            qualityMultipliers: { ...config.qualityMultipliers, [quality]: value },
        });
    };

    const updateRoleMult = (level: string, value: number) => {
        updateConfig({
            roleMultipliers: { ...config.roleMultipliers, [level]: value },
        });
    };

    const inputClass = 'w-24 bg-rudore-sidebar border border-rudore-border px-3 py-1.5 text-sm text-rudore-text text-center focus:outline-none focus:border-rudore-orange transition-colors font-mono';
    const rowClass = 'flex items-center justify-between py-3 border-b border-rudore-border last:border-0 hover:bg-white/[0.02] transition-colors px-2';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings2 className="text-rudore-orange" size={18} />
                    <h3 className="font-header text-lg font-bold text-rudore-text uppercase tracking-[0.2em]">
                        Configuration Points
                    </h3>
                </div>
                <button
                    onClick={resetConfig}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rudore-text/30 hover:text-red-500 hover:bg-red-500/10 px-3 py-1.5 border border-rudore-border transition-colors"
                >
                    <RotateCcw size={12} />
                    Réinitialiser
                </button>
            </div>

            <p className="text-[11px] text-rudore-text/40 font-sans leading-relaxed max-w-2xl uppercase tracking-wider">
                Ajustez les paramètres du système de rétribution.
                Les changements sont appliqués en temps réel sur l'ensemble du système d'allocation des points.
            </p>

            {/* Base Points */}
            <div className="bg-rudore-sidebar/30 border border-rudore-border p-6 shadow-sm">
                <h4 className="text-[10px] font-bold text-rudore-text/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Zap size={14} className="text-rudore-orange" />
                    Points de Base (PB) par Complexité
                </h4>
                <div className="space-y-0">
                    {Object.values(TaskComplexity).map(c => (
                        <div key={c} className={rowClass}>
                            <span className="text-xs text-rudore-text/60 font-bold uppercase tracking-wide">{COMPLEXITY_LABELS[c]}</span>
                            <input
                                type="number"
                                min="0"
                                value={config.basePoints[c]}
                                onChange={(e) => updateBasePoint(c, parseInt(e.target.value) || 0)}
                                className={inputClass}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Quality Multipliers */}
            <div className="bg-rudore-sidebar/30 border border-rudore-border p-6 shadow-sm">
                <h4 className="text-[10px] font-bold text-rudore-text/40 uppercase tracking-[0.2em] mb-4">
                    Multiplicateurs Qualité (MQ)
                </h4>
                <div className="space-y-0">
                    {Object.values(QualityRating).map(q => (
                        <div key={q} className={rowClass}>
                            <span className="text-xs text-rudore-text/60 font-bold uppercase tracking-wide">{QUALITY_LABELS[q]}</span>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={config.qualityMultipliers[q]}
                                onChange={(e) => updateQualityMult(q, parseFloat(e.target.value) || 0)}
                                className={inputClass}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Role Multipliers — Dynamic */}
            <div className="bg-rudore-sidebar/30 border border-rudore-border p-6 shadow-sm">
                <h4 className="text-[10px] font-bold text-rudore-text/40 uppercase tracking-[0.2em] mb-4">
                    Multiplicateurs Rôle (MR) — Niveaux Dynamiques
                </h4>
                <div className="space-y-0">
                    {Object.entries(config.roleMultipliers).map(([level, value]) => {
                        const isSystemLevel = Object.values(Level).includes(level as Level);
                        return (
                            <div key={level} className={rowClass}>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-rudore-text/60 font-bold uppercase tracking-wide">{level}</span>
                                    {isSystemLevel && (
                                        <span className="text-[8px] text-rudore-text/20 font-mono uppercase tracking-wider border border-rudore-border px-1 py-0.5">système</span>
                                    )}
                                    {!isSystemLevel && (
                                        <button
                                            onClick={() => {
                                                const newMults = { ...config.roleMultipliers };
                                                delete newMults[level];
                                                updateConfig({ roleMultipliers: newMults });
                                            }}
                                            className="text-red-500/40 hover:text-red-500 transition-colors p-0.5"
                                            title="Supprimer ce niveau"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={value}
                                    onChange={(e) => updateRoleMult(level, parseFloat(e.target.value) || 0)}
                                    className={inputClass}
                                />
                            </div>
                        );
                    })}
                </div>
                {/* Add Custom Level */}
                <div className="mt-4 pt-4 border-t border-rudore-border">
                    <p className="text-[9px] text-rudore-text/30 uppercase tracking-wider mb-3">Ajouter un niveau personnalisé</p>
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Nom du niveau"
                            id="rudore-new-level-name"
                            className={inputClass + ' flex-1 text-left'}
                        />
                        <input
                            type="number"
                            placeholder="1.0"
                            step="0.1"
                            min="0"
                            id="rudore-new-level-value"
                            className={inputClass + ' w-20'}
                        />
                        <button
                            onClick={() => {
                                const nameEl = document.getElementById('rudore-new-level-name') as HTMLInputElement;
                                const valueEl = document.getElementById('rudore-new-level-value') as HTMLInputElement;
                                if (nameEl?.value?.trim() && valueEl?.value) {
                                    updateRoleMult(nameEl.value.trim(), parseFloat(valueEl.value));
                                    nameEl.value = '';
                                    valueEl.value = '';
                                }
                            }}
                            className="px-3 py-1.5 bg-rudore-orange text-white text-[10px] font-bold uppercase tracking-wider hover:brightness-110 transition-colors shrink-0"
                        >
                            + Ajouter
                        </button>
                    </div>
                </div>
            </div>

            {/* Financial Parameters */}
            <div className="bg-rudore-sidebar/30 border border-rudore-border p-6 shadow-sm">
                <h4 className="text-[10px] font-bold text-rudore-text/40 uppercase tracking-[0.2em] mb-4">
                    Paramètres Financiers
                </h4>
                <div className="space-y-0">
                    <div className={rowClass}>
                        <span className="text-xs text-rudore-text/60 font-bold uppercase tracking-wide">% Revenus Agence → Bonus</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={config.bonusPercentage}
                                onChange={(e) => updateConfig({ bonusPercentage: parseInt(e.target.value) || 0 })}
                                className={inputClass}
                            />
                            <span className="text-rudore-text/20 font-bold text-sm">%</span>
                        </div>
                    </div>
                    <div className={rowClass}>
                        <span className="text-xs text-rudore-text/60 font-bold uppercase tracking-wide">Pool Équité Builders</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={config.equityPoolPercentage}
                                onChange={(e) => updateConfig({ equityPoolPercentage: parseInt(e.target.value) || 0 })}
                                className={inputClass}
                            />
                            <span className="text-rudore-text/20 font-bold text-sm">%</span>
                        </div>
                    </div>
                    <div className={rowClass}>
                        <span className="text-xs text-rudore-text/60 font-bold uppercase tracking-wide">Revenus Agence Mensuels</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min="0"
                                step="100000"
                                value={config.agencyMonthlyRevenue}
                                onChange={(e) => updateConfig({ agencyMonthlyRevenue: parseInt(e.target.value) || 0 })}
                                className={inputClass + ' w-40'}
                            />
                            <span className="text-rudore-text/20 font-mono text-xs">XAF</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ratio Agence / Studio */}
            <div className="bg-rudore-sidebar/30 border border-rudore-border p-6 shadow-sm">
                <h4 className="text-[10px] font-bold text-rudore-text/40 uppercase tracking-[0.2em] mb-4">
                    Ratio Agence / Studio (Répartition des Revenus)
                </h4>
                <div className="space-y-0">
                    <div className={rowClass}>
                        <span className="text-xs text-rudore-text/60 font-bold uppercase tracking-wide">Ops & Bonus (Agence)</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={config.agencyOpsPercentage}
                                onChange={(e) => {
                                    const ops = parseInt(e.target.value) || 0;
                                    updateConfig({
                                        agencyOpsPercentage: Math.min(100, Math.max(0, ops)),
                                        studioFundPercentage: Math.max(0, 100 - Math.min(100, ops)),
                                    });
                                }}
                                className={inputClass}
                            />
                            <span className="text-rudore-text/20 font-bold text-sm">%</span>
                        </div>
                    </div>
                    <div className={rowClass}>
                        <span className="text-xs text-rudore-text/60 font-bold uppercase tracking-wide">Studio Fund</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={config.studioFundPercentage}
                                onChange={(e) => {
                                    const studio = parseInt(e.target.value) || 0;
                                    updateConfig({
                                        studioFundPercentage: Math.min(100, Math.max(0, studio)),
                                        agencyOpsPercentage: Math.max(0, 100 - Math.min(100, studio)),
                                    });
                                }}
                                className={inputClass}
                            />
                            <span className="text-rudore-text/20 font-bold text-sm">%</span>
                        </div>
                    </div>
                </div>
                {/* Visual bar */}
                <div className="mt-4 h-3 w-full flex overflow-hidden border border-rudore-border">
                    <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${config.agencyOpsPercentage}%` }} />
                    <div className="bg-rudore-orange h-full transition-all duration-300" style={{ width: `${config.studioFundPercentage}%` }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[9px] text-rudore-text/30 font-mono uppercase tracking-wider">
                    <span>🔵 Ops & Bonus {config.agencyOpsPercentage}%</span>
                    <span>🟠 Studio Fund {config.studioFundPercentage}%</span>
                </div>
            </div>
            <div className="bg-rudore-sidebar/30 border border-rudore-border p-6 shadow-sm">
                <h4 className="text-[10px] font-bold text-rudore-text/40 uppercase tracking-[0.2em] mb-4">
                    Vesting Schema
                </h4>
                <div className="space-y-0">
                    <div className={rowClass}>
                        <span className="text-xs text-rudore-text/60 font-bold uppercase tracking-wide">Cliff Period (mois)</span>
                        <input
                            type="number"
                            min="0"
                            value={config.cliffMonths}
                            onChange={(e) => updateConfig({ cliffMonths: parseInt(e.target.value) || 0 })}
                            className={inputClass}
                        />
                    </div>
                    <div className={rowClass}>
                        <span className="text-xs text-rudore-text/60 font-bold uppercase tracking-wide">Durée Vesting Totale (mois)</span>
                        <input
                            type="number"
                            min="1"
                            value={config.vestingMonths}
                            onChange={(e) => updateConfig({ vestingMonths: parseInt(e.target.value) || 1 })}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* Kill Gate Thresholds */}
            <div className="bg-rudore-sidebar/30 border border-rudore-border p-6 shadow-sm">
                <h4 className="text-[10px] font-bold text-rudore-text/40 uppercase tracking-[0.2em] mb-2">
                    Kill Gate — Seuils de Déclenchement
                </h4>
                <p className="text-[9px] text-rudore-text/30 mb-4 uppercase tracking-wider">
                    Critères automatiques d'alerte pour les projets Studio
                </p>
                <div className="space-y-0">
                    {/* Budget Overrun */}
                    <div className={rowClass}>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => updateConfig({
                                    killGateThresholds: { ...config.killGateThresholds, budgetOverrunEnabled: !config.killGateThresholds.budgetOverrunEnabled }
                                })}
                                className={`w-8 h-4 p-0.5 transition-colors border ${config.killGateThresholds.budgetOverrunEnabled ? 'bg-rudore-orange border-rudore-orange' : 'bg-rudore-sidebar border-rudore-border'}`}
                            >
                                <div className={`w-2.5 h-2.5 bg-white shadow-sm transition-transform ${config.killGateThresholds.budgetOverrunEnabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
                            </button>
                            <span className={`text-xs font-bold uppercase tracking-wide ${config.killGateThresholds.budgetOverrunEnabled ? 'text-rudore-text/60' : 'text-rudore-text/20'}`}>
                                Dépassement Budget (spent {'>'} budget)
                            </span>
                        </div>
                    </div>
                    {/* Delay */}
                    <div className={rowClass}>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => updateConfig({
                                    killGateThresholds: { ...config.killGateThresholds, delayEnabled: !config.killGateThresholds.delayEnabled }
                                })}
                                className={`w-8 h-4 p-0.5 transition-colors border ${config.killGateThresholds.delayEnabled ? 'bg-rudore-orange border-rudore-orange' : 'bg-rudore-sidebar border-rudore-border'}`}
                            >
                                <div className={`w-2.5 h-2.5 bg-white shadow-sm transition-transform ${config.killGateThresholds.delayEnabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
                            </button>
                            <span className={`text-xs font-bold uppercase tracking-wide ${config.killGateThresholds.delayEnabled ? 'text-rudore-text/60' : 'text-rudore-text/20'}`}>
                                Retard Deadline
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min="1"
                                value={config.killGateThresholds.delayDaysThreshold}
                                onChange={(e) => updateConfig({
                                    killGateThresholds: { ...config.killGateThresholds, delayDaysThreshold: parseInt(e.target.value) || 30 }
                                })}
                                disabled={!config.killGateThresholds.delayEnabled}
                                className={inputClass + (config.killGateThresholds.delayEnabled ? '' : ' opacity-30')}
                            />
                            <span className="text-rudore-text/20 text-[10px] font-mono">jours</span>
                        </div>
                    </div>
                    {/* Revenue Stagnation */}
                    <div className={rowClass}>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => updateConfig({
                                    killGateThresholds: { ...config.killGateThresholds, revenueStagnationEnabled: !config.killGateThresholds.revenueStagnationEnabled }
                                })}
                                className={`w-8 h-4 p-0.5 transition-colors border ${config.killGateThresholds.revenueStagnationEnabled ? 'bg-rudore-orange border-rudore-orange' : 'bg-rudore-sidebar border-rudore-border'}`}
                            >
                                <div className={`w-2.5 h-2.5 bg-white shadow-sm transition-transform ${config.killGateThresholds.revenueStagnationEnabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
                            </button>
                            <span className={`text-xs font-bold uppercase tracking-wide ${config.killGateThresholds.revenueStagnationEnabled ? 'text-rudore-text/60' : 'text-rudore-text/20'}`}>
                                Stagnation Revenus (0 revenus pendant X mois)
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min="1"
                                value={config.killGateThresholds.revenueStagnationMonths}
                                onChange={(e) => updateConfig({
                                    killGateThresholds: { ...config.killGateThresholds, revenueStagnationMonths: parseInt(e.target.value) || 3 }
                                })}
                                disabled={!config.killGateThresholds.revenueStagnationEnabled}
                                className={inputClass + (config.killGateThresholds.revenueStagnationEnabled ? '' : ' opacity-30')}
                            />
                            <span className="text-rudore-text/20 text-[10px] font-mono">mois</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="bg-white text-black p-6 border-4 border-rudore-orange shadow-[8px_8px_0px_black] transform translate-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                    Simulation Retribution
                </h4>
                <div className="text-xs font-mono space-y-2">
                    <p className="opacity-50">Tâche Complexe + Qualité Excellent + Rôle Expert :</p>
                    <p className="text-black font-header font-black text-lg">
                        {config.basePoints[TaskComplexity.COMPLEX]} × {config.qualityMultipliers[QualityRating.EXCELLENT]} × {config.roleMultipliers[Level.EXPERT] ?? 1.5}
                        = <span className="text-rudore-orange text-3xl ml-2 tracking-tighter">
                            {Math.round(config.basePoints[TaskComplexity.COMPLEX] * config.qualityMultipliers[QualityRating.EXCELLENT] * (config.roleMultipliers[Level.EXPERT] ?? 1.5))} <span className="text-sm">PTS</span>
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};
