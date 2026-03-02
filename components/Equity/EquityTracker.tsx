"use client";

import React from 'react';
import { Card } from '../ui/Card';
import { Project, Member } from '../../types';
import { usePointsConfig } from '../../context/PointsConfigContext';
import { PieChart, Wallet, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface EquityTrackerProps {
    member: Member;
    projects: Project[];
    totalPointsDistributed: number;
    memberPoints: number;
    projectBreakdown: { name: string; share: number }[];
}

export const EquityTracker: React.FC<EquityTrackerProps> = ({
    member,
    totalPointsDistributed,
    memberPoints,
    projectBreakdown
}) => {
    const { calculateEquity } = usePointsConfig();

    // Calculate global equity from total points
    const globalEquity = calculateEquity(memberPoints, totalPointsDistributed);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Equity Card */}
                <div className="bg-rudore-panel border border-rudore-border p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rudore-orange/5 -translate-y-1/2 translate-x-1/2 rounded-full group-hover:bg-rudore-orange/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <PieChart size={16} className="text-rudore-orange" />
                            <span className="text-caption-label font-black text-rudore-text uppercase tracking-widest">Total Actionnariat</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-5xl font-header font-bold text-rudore-text">{globalEquity}%</h3>
                        </div>
                        <p className="text-caption-label text-rudore-text/40 mt-4 uppercase font-bold tracking-widest leading-relaxed">
                            Votre part totale du capital "Builders" (Pool de 25%) à travers tous les projets du Studio.
                        </p>
                    </div>
                </div>

                {/* Portfolio Value Card */}
                <div className="bg-rudore-panel border border-rudore-border p-6 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Wallet size={16} className="text-rudore-orange" />
                            <span className="text-caption-label font-black text-rudore-text uppercase tracking-widest">Valeur Estimée</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-header font-bold text-rudore-text">
                                {member.wallet.equityValue.toLocaleString()} <span className="text-sm font-sans font-normal text-rudore-text/20">XOF</span>
                            </h3>
                        </div>
                        <div className="mt-4 pt-4 border-t border-rudore-border flex items-center justify-between">
                            <span className="text-caption-label text-rudore-text/40 uppercase font-bold tracking-widest">Basé sur les KPIs actifs</span>
                            <div className="flex items-center gap-1 text-rudore-text/20 text-caption-label font-bold italic">
                                ACTUALISÉ EN TEMPS RÉEL
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Breakdown */}
            <Card title="Répartition du Portfolio" subtitle="Parts détenues par Spin-off">
                <div className="space-y-4">
                    {projectBreakdown.length > 0 ? (
                        projectBreakdown.map((pe, idx) => (
                            <div key={idx} className="group cursor-pointer">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-rudore-orange" />
                                        <span className="text-xs font-black text-rudore-text uppercase tracking-widest group-hover:text-rudore-orange transition-colors">
                                            {pe.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-mono font-bold text-rudore-text">{pe.share}%</span>
                                </div>
                                <div className="w-full bg-rudore-sidebar h-2 border border-rudore-border overflow-hidden">
                                    <div
                                        className="bg-rudore-orange h-full transition-all duration-1000"
                                        style={{ width: `${(pe.share / (globalEquity || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center border border-dashed border-rudore-border">
                            <p className="text-caption-label text-rudore-text/20 uppercase tracking-widest font-bold">Aucune contribution validée par projet</p>
                        </div>
                    )}
                    <div className="pt-4 flex items-center gap-2 text-caption-label text-rudore-text/30 uppercase font-bold tracking-widest italic">
                        <ShieldCheck size={12} />
                        Données auditées par la direction financière de RUDORE & Co
                    </div>
                </div>
            </Card>
        </div>
    );
};
