"use client";

import React, { useState } from 'react';
import { Card, Badge } from './ui/Card';
import { Project, Status, Member } from '../types';
import { DollarSign, Clock, Users, BarChart3, ArrowRight, CheckCircle2, Circle, X, AlertTriangle } from 'lucide-react';
import { usePointsConfig } from '../context/PointsConfigContext';

interface ProjectHubProps {
    projects: Project[];
    members: Member[];
    type: 'STUDIO' | 'AGENCY';
}

const ProgressBar = ({ value, color = 'bg-rudore-orange' }: { value: number, color?: string }) => (
    <div className="h-1 w-full bg-rudore-sidebar overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
    </div>
);

// Project Builder Wizard Component
const ProjectBuilderModal = ({ onClose, type, onSave, members }: { onClose: () => void, type: 'STUDIO' | 'AGENCY', onSave: (p: any) => void, members: Member[] }) => {
    const [name, setName] = useState('');
    const [leadId, setLeadId] = useState(members[0]?.id || '');
    const [budget, setBudget] = useState('');
    const [equity, setEquity] = useState('');
    const [date, setDate] = useState('');

    const handleSave = () => {
        if (!name) return;
        const newProject: Project = {
            id: crypto.randomUUID(),
            name,
            type,
            status: Status.PLANNING,
            leadId: leadId,
            description: 'Nouveau projet en cours d\'idéation',
            squadIds: [],
            financials: { budget: Number(budget) || 0, spent: 0, revenue: 0, equityPool: Number(equity) || 0 },
            roadmap: [
                { phase: 'Concept', status: 'IN_PROGRESS', date: date || new Date().toLocaleDateString('fr-FR') }
            ]
        };
        onSave(newProject);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-rudore-panel border border-rudore-border w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-rudore-border">
                    <h3 className="font-header text-xl text-rudore-text uppercase tracking-widest">
                        Nouveau Projet {type}
                    </h3>
                    <button onClick={onClose} className="text-rudore-text/50 hover:text-rudore-orange transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto">
                    {/* Step 1: Identity */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-rudore-orange uppercase tracking-widest border-b border-rudore-border pb-2">1. Identité du Projet</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-caption-label uppercase text-rudore-text/50 mb-1">Nom du Projet *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-rudore-sidebar border border-rudore-border p-2 text-rudore-text text-sm focus:border-rudore-orange focus:outline-none transition-colors"
                                    placeholder="ex: Koodi V2"
                                />
                            </div>
                            <div>
                                <label className="block text-caption-label uppercase text-rudore-text/50 mb-1">Lead Assigné</label>
                                <select
                                    value={leadId}
                                    onChange={e => setLeadId(e.target.value)}
                                    className="w-full bg-rudore-sidebar border border-rudore-border p-2 text-rudore-text text-sm focus:border-rudore-orange focus:outline-none transition-colors"
                                >
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-caption-label uppercase text-rudore-text/50 mb-1">Date de lancement</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full bg-rudore-sidebar border border-rudore-border p-2 text-rudore-text/70 text-sm focus:border-rudore-orange focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Financials & Equity */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-rudore-orange uppercase tracking-widest border-b border-rudore-border pb-2">2. Budget & Equity (Shares)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-caption-label uppercase text-rudore-text/50 mb-1">Budget Initial (XOF)</label>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={e => setBudget(e.target.value)}
                                    className="w-full bg-rudore-sidebar border border-rudore-border p-2 text-rudore-text text-sm focus:border-rudore-orange focus:outline-none transition-colors"
                                    placeholder="5000000"
                                />
                            </div>
                            <div>
                                <label className="block text-caption-label uppercase text-rudore-text/50 mb-1">Pool de Parts Équipe (%)</label>
                                <input
                                    type="number"
                                    value={equity}
                                    onChange={e => setEquity(e.target.value)}
                                    className="w-full bg-rudore-sidebar border border-rudore-border p-2 text-rudore-text text-sm focus:border-rudore-orange focus:outline-none transition-colors"
                                    placeholder="10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Staffing Needs */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-rudore-orange uppercase tracking-widest border-b border-rudore-border pb-2">3. Besoins en Talents</h4>
                        <div className="flex gap-2 flex-wrap">
                            {['UI Design', 'Frontend React', 'Backend Python', 'Growth', 'Copywriting'].map(skill => (
                                <label key={skill} className="flex items-center gap-2 bg-rudore-sidebar border border-rudore-border px-3 py-2 cursor-pointer hover:border-rudore-orange transition-colors">
                                    <input type="checkbox" className="accent-rudore-orange" />
                                    <span className="text-xs text-rudore-text/70">{skill}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-rudore-border flex justify-end gap-3 bg-rudore-sidebar/50">
                    <button onClick={onClose} className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-rudore-text/50 hover:text-rudore-orange transition-colors">
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name}
                        className="px-6 py-2 bg-rudore-orange text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Créer le Projet
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ProjectHub: React.FC<ProjectHubProps> = ({ projects: initialProjects, members, type }) => {
    const [showBuilder, setShowBuilder] = useState(false);
    const [localProjects, setLocalProjects] = useState<Project[]>(initialProjects);
    const { config } = usePointsConfig();
    const kg = config.killGateThresholds;

    const title = type === 'STUDIO' ? 'Studio // Ventures' : 'Agence // Clients';
    const subtitle = type === 'STUDIO' ? 'Incubateur de Produits Internes' : 'Gestion des Projets Clients Externes';

    const handleCreateProject = (newProject: Project) => {
        setLocalProjects([newProject, ...localProjects]);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {showBuilder && <ProjectBuilderModal type={type} onClose={() => setShowBuilder(false)} onSave={handleCreateProject} members={members} />}

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-header text-3xl font-bold text-rudore-text uppercase tracking-widest">{title}</h2>
                    <p className="text-rudore-text/50 font-mono text-xs mt-1">{subtitle}</p>
                </div>
                <button
                    onClick={() => setShowBuilder(true)}
                    className="px-4 py-2 border border-dashed border-rudore-border text-rudore-text/50 text-xs font-bold uppercase tracking-wider hover:text-rudore-orange hover:border-rudore-orange transition-colors"
                >
                    + Nouveau Projet
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {localProjects.map(project => {
                    const profit = project.financials.revenue - project.financials.spent;
                    const isProfitable = profit >= 0;
                    const roi = project.financials.spent > 0 ? ((profit / project.financials.spent) * 100).toFixed(0) : 0;

                    return (
                        <div key={project.id} className="bg-rudore-panel border border-rudore-border p-6 hover:border-rudore-orange transition-all cursor-pointer group">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-rudore-text group-hover:text-rudore-orange transition-colors uppercase tracking-wide">{project.name}</h3>
                                        <Badge status={project.status} />
                                    </div>
                                    <p className="text-rudore-text/50 text-sm mt-1">{project.description}</p>
                                </div>
                                <div className="flex items-center gap-6 text-right">
                                    <div>
                                        <p className="text-caption-label text-rudore-text/50 uppercase tracking-widest mb-1">Squad</p>
                                        <div className="flex -space-x-2 justify-end">
                                            {project.squadIds.length === 0 && (
                                                <div className="text-caption-label text-rudore-text/40 border border-dashed border-rudore-border px-2 py-1">En Staffing</div>
                                            )}
                                            {project.squadIds.slice(0, 3).map((id, i) => (
                                                <div key={id} className="w-8 h-8 bg-rudore-sidebar border border-rudore-border flex items-center justify-center text-caption-label text-rudore-text font-bold">
                                                    M{i + 1}
                                                </div>
                                            ))}
                                            {project.squadIds.length > 3 && (
                                                <div className="w-8 h-8 bg-rudore-panel border border-rudore-border flex items-center justify-center text-caption-label text-rudore-text/50">
                                                    +{project.squadIds.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="border-l border-rudore-border pl-6">
                                        <p className="text-caption-label text-rudore-text/50 uppercase tracking-widest mb-1">Lead</p>
                                        <p className="text-sm font-bold text-rudore-text capitalize tracking-wide">
                                            {members.find(m => m.id === project.leadId)?.name || project.leadId}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-8">
                                {/* Financials (P&L) */}
                                <div className="col-span-12 lg:col-span-4 bg-rudore-sidebar/50 p-4 border border-rudore-border">
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-rudore-text/60 uppercase tracking-widest mb-4">
                                        <DollarSign size={14} /> P&L & Equity
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-rudore-text/50">Budget Consommé</span>
                                                <span className="text-rudore-text font-mono">{project.financials.spent}k / {project.financials.budget}k</span>
                                            </div>
                                            <ProgressBar value={project.financials.budget > 0 ? (project.financials.spent / project.financials.budget) * 100 : 0} color="bg-rudore-text/20" />
                                        </div>

                                        {project.type === 'STUDIO' && (
                                            <div className="pt-4 mt-4 border-t border-rudore-border/30">
                                                <div className="flex justify-between text-caption-label mb-2 font-black uppercase tracking-widest">
                                                    <span className="text-rudore-orange">Bill Back (Dette)</span>
                                                    <span className="text-rudore-text">{project.financials.spent}k XOF</span>
                                                </div>
                                                <div className="flex justify-between text-caption-label mb-1 font-bold uppercase tracking-tighter text-rudore-text/40 italic">
                                                    <span>Recouvrement</span>
                                                    <span>{project.financials.revenue > 0 ? Math.min(100, (project.financials.revenue / project.financials.spent) * 100).toFixed(0) : 0}%</span>
                                                </div>
                                                <ProgressBar
                                                    value={project.financials.revenue > 0 ? (project.financials.revenue / project.financials.spent) * 100 : 0}
                                                    color="bg-emerald-500"
                                                />
                                                <p className="text-caption-label text-rudore-text/30 mt-2 leading-tight">
                                                    Remboursement prioritaire à la holding sur les premiers revenus.
                                                </p>
                                            </div>
                                        )}

                                        <div className={project.type === 'STUDIO' ? 'pt-2' : ''}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-rudore-text/50">Pool Team (Actions)</span>
                                                <span className="text-rudore-orange font-mono font-bold">{project.financials.equityPool}%</span>
                                            </div>
                                            <ProgressBar value={project.financials.equityPool} color="bg-rudore-orange" />
                                        </div>

                                        {/* Kill Gate / Strategic Health Section — Multi-Criteria */}
                                        {project.type === 'STUDIO' && (() => {
                                            const spentRatio = project.financials.budget > 0 ? (project.financials.spent / project.financials.budget) * 100 : 0;
                                            const isBudgetOverrun = kg.budgetOverrunEnabled && spentRatio >= 100;
                                            const isBudgetWarning = kg.budgetOverrunEnabled && spentRatio >= 80 && spentRatio < 100;
                                            const isDelayed = kg.delayEnabled && project.deadline && new Date(project.deadline) < new Date();
                                            const isStagnant = kg.revenueStagnationEnabled && project.financials.revenue === 0;
                                            const isKill = isBudgetOverrun;
                                            const isWarning = isBudgetWarning || isDelayed;
                                            const isGreen = !isKill && !isWarning && project.financials.revenue > 0;

                                            return (
                                                <div className="mt-4 pt-4 border-t border-rudore-border">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="text-caption-label font-black text-rudore-text/40 uppercase tracking-[0.2em]">Kill Gate Status</h4>
                                                        <div className="flex gap-1">
                                                            {isKill ? (
                                                                <span className="px-2 py-0.5 bg-rudore-orange text-white text-caption-label font-black uppercase tracking-widest border border-rudore-orange/50 animate-pulse">STATUS: KILL / PIVOT</span>
                                                            ) : isWarning ? (
                                                                <span className="px-2 py-0.5 bg-yellow-600 text-white text-caption-label font-black uppercase tracking-widest border border-yellow-400">STATUS: WARNING</span>
                                                            ) : isGreen ? (
                                                                <span className="px-2 py-0.5 bg-emerald-600 text-white text-caption-label font-black uppercase tracking-widest border border-emerald-400">STATUS: GO_GREEN</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-rudore-sidebar text-rudore-text/60 text-caption-label font-black uppercase tracking-widest border border-rudore-border">STATUS: MONITORING</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Alert details */}
                                                    <div className="space-y-1">
                                                        {isBudgetOverrun && (
                                                            <p className="text-caption-label text-rudore-orange font-mono uppercase leading-tight">⛔ BUDGET DÉPASSÉ — Passage en revue obligatoire au prochain comité.</p>
                                                        )}
                                                        {isBudgetWarning && (
                                                            <p className="text-caption-label text-yellow-400 font-mono uppercase leading-tight">⚠ BUDGET À {spentRatio.toFixed(0)}% — Surveillance renforcée requise.</p>
                                                        )}
                                                        {isDelayed && (
                                                            <p className="text-caption-label text-yellow-400 font-mono uppercase leading-tight">⚠ DEADLINE DÉPASSÉE — Retard détecté.</p>
                                                        )}
                                                        {isStagnant && (
                                                            <p className="text-caption-label text-rudore-text/30 font-mono uppercase leading-tight italic">📉 AUCUN REVENU — Stagnation sous surveillance.</p>
                                                        )}
                                                        {!isBudgetOverrun && !isBudgetWarning && !isDelayed && !isStagnant && (
                                                            <p className="text-caption-label text-rudore-text/30 font-mono uppercase leading-tight italic">Indicateurs de survie nominaux. Poursuite autorisée.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Roadmap */}
                                <div className="col-span-12 lg:col-span-8">
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-rudore-text/60 uppercase tracking-widest mb-4">
                                        <Clock size={14} /> Roadmap
                                    </h4>
                                    <div className="relative flex justify-between items-center mt-6 px-4">
                                        {/* Connector Line */}
                                        <div className="absolute left-0 top-1/2 w-full h-[1px] bg-rudore-border -z-10 transform -translate-y-1/2"></div>

                                        {project.roadmap.map((step, idx) => {
                                            const isDone = step.status === 'DONE';
                                            const isCurrent = step.status === 'IN_PROGRESS';

                                            return (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <div className={`w-3 h-3 border-2 z-10 mb-2 
                                        ${isDone ? 'bg-rudore-orange border-rudore-orange' :
                                                            isCurrent ? 'bg-rudore-panel border-rudore-orange animate-pulse' :
                                                                'bg-rudore-panel border-rudore-border'}`}
                                                    ></div>
                                                    <span className={`text-caption-label font-bold uppercase tracking-wider ${isCurrent ? 'text-rudore-text' : 'text-rudore-text/40'}`}>
                                                        {step.phase}
                                                    </span>
                                                    <span className="text-caption-label text-rudore-text/30 font-mono mt-0.5">{step.date}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};