"use client";

import React from 'react';
import { usePointsConfig } from '../../context/PointsConfigContext';

interface VestingChartProps {
    joinedAt: string;
    equityAcquired: number;
}

export const VestingChart: React.FC<VestingChartProps> = ({ joinedAt, equityAcquired }) => {
    const { calculateVestedEquity, config } = usePointsConfig();
    const { vested, total, months, isVested } = calculateVestedEquity(equityAcquired, joinedAt);

    const totalSlots = config.vestingMonths;
    const cliffSlots = config.cliffMonths;
    const currentSlot = Math.min(months, totalSlots);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-caption-label text-rudore-text/40 uppercase font-bold tracking-widest">Calendrier de Vesting</p>
                    <p className="text-xs font-mono text-rudore-text mt-1">
                        {months} / {totalSlots} mois complétés
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-header font-bold text-rudore-orange">{vested}%</span>
                    <span className="text-sm text-rudore-text/20"> / {total}%</span>
                </div>
            </div>

            {/* The Visual Chart: 48 tiny blocks */}
            <div className="flex flex-wrap gap-1">
                {Array.from({ length: totalSlots }).map((_, i) => {
                    const isPassed = i < currentSlot;
                    const isCliff = i < cliffSlots;

                    let bgColor = "bg-rudore-sidebar border border-rudore-border";
                    if (isPassed) {
                        bgColor = isCliff ? "bg-rudore-text/20 border-rudore-text/30" : "bg-rudore-orange border-rudore-orange";
                    }

                    return (
                        <div
                            key={i}
                            className={`w-2.5 h-6 ${bgColor} transition-all duration-500`}
                            title={`Mois ${i + 1}${isCliff ? ' (Cliff)' : ''}`}
                        />
                    );
                })}
            </div>

            <div className="flex items-center justify-between text-caption-label uppercase font-bold tracking-tighter text-rudore-text/30">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-rudore-text/20" /> <span>Période de Cliff (6m)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-rudore-orange" /> <span>Acquisition (48m)</span>
                </div>
                {!isVested && (
                    <div className="text-rudore-orange animate-pulse">
                        ⚠️ Sous Cliff : 0% débloqué
                    </div>
                )}
            </div>
        </div>
    );
};
