"use client";

import React from 'react';
import { Card } from './ui/Card';
import { Member, KanbanTaskStatus, COMPLEXITY_LABELS, KANBAN_STATUS_LABELS } from '../types';
import { Trophy, Zap, TrendingUp, CheckCircle2, Clock, BarChart3 } from 'lucide-react';
import { useKanban } from '../context/KanbanContext';
import { usePointsConfig } from '../context/PointsConfigContext';
import { EquityTracker } from './Equity/EquityTracker';
import { VestingChart } from './Equity/VestingChart';

interface ContributionsProps {
    members: Member[];
}

export const Contributions: React.FC<ContributionsProps> = ({ members }) => {
    const { tasks } = useKanban();
    const { calculateFinalPoints, getPointValue, calculateEquity } = usePointsConfig();

    // Compute points per member from validated Kanban tasks
    const validatedStatuses = [KanbanTaskStatus.VALIDATED, KanbanTaskStatus.ARCHIVED];
    const validatedTasks = tasks.filter(t => validatedStatuses.includes(t.status));

    const memberPoints = members.map(member => {
        const myTasks = validatedTasks.filter(t => t.assigneeId === member.id);
        const totalPts = myTasks.reduce((sum, t) => sum + calculateFinalPoints(t, member.level), 0);
        return { ...member, computedPoints: totalPts, taskCount: myTasks.length };
    });

    const totalPointsDistributed = memberPoints.reduce((sum, m) => sum + m.computedPoints, 0);
    const pointValue = getPointValue(totalPointsDistributed);

    // Leaderboard sorted by computed points
    const leaderboard = [...memberPoints].sort((a, b) => b.computedPoints - a.computedPoints);

    // All tasks for the feed (sorted by most recent)
    const allTasks = [...tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    // Current user (first member as mock)
    const currentUser = memberPoints[0];
    const currentUserEquity = currentUser ? calculateEquity(currentUser.computedPoints, totalPointsDistributed) : 0;

    // Project breakdown for current user
    const currentUserProjectPoints = React.useMemo(() => {
        if (!currentUser) return [];
        const myTasks = validatedTasks.filter(t => t.assigneeId === currentUser.id);
        const pointsByProject: Record<string, number> = {};

        myTasks.forEach(task => {
            const pts = calculateFinalPoints(task, currentUser.level);
            pointsByProject[task.projectId] = (pointsByProject[task.projectId] || 0) + pts;
        });

        return Object.entries(pointsByProject).map(([projectId, pts]) => ({
            name: projectId,
            share: calculateEquity(pts, totalPointsDistributed)
        })).sort((a, b) => b.share - a.share);
    }, [currentUser, validatedTasks, calculateFinalPoints, totalPointsDistributed, calculateEquity]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Stratégique */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-rudore-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-rudore-orange text-white text-caption-label font-black uppercase tracking-[0.2em] badge-rounded">Venture Ops</span>
                        <h2 className="font-header text-3xl font-bold text-rudore-text uppercase tracking-widest">Actionnariat & Performance</h2>
                    </div>
                    <p className="text-rudore-text/50 font-mono text-sm uppercase tracking-tighter">
                        Pilote du capital "Builders" • FROM RAW TO RARE
                    </p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="p-4 bg-rudore-panel border border-rudore-border min-w-[180px] group hover:border-rudore-orange transition-colors">
                        <p className="text-caption-label font-black text-rudore-text/40 uppercase tracking-[0.2em] mb-1">Cote du Point</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-header font-bold text-rudore-orange">
                                {pointValue > 0 ? pointValue.toLocaleString() : '—'}
                            </span>
                            <span className="text-caption-label text-rudore-text/20 font-bold uppercase">XOF / PTS</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* 1. Equity & Vesting (Main Focus) */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {currentUser && (
                        <>
                            <EquityTracker
                                member={currentUser}
                                projects={[]} // No longer used for mock split
                                totalPointsDistributed={totalPointsDistributed}
                                memberPoints={currentUser.computedPoints}
                                projectBreakdown={currentUserProjectPoints}
                            />

                            <Card title="Acquisition de Parts (Vesting)" className="relative overflow-hidden">
                                <VestingChart joinedAt={currentUser.joinedAt} equityAcquired={currentUserEquity} />
                            </Card>
                        </>
                    )}

                    {/* Recent Actions Feed */}
                    <Card title="Flux de Valeur" subtitle="Dernières contributions validées" noPadding>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-rudore-sidebar/30 text-caption-label uppercase text-rudore-text/40 tracking-[0.2em]">
                                        <th className="py-4 pl-6">Livrable</th>
                                        <th className="py-4">Impact</th>
                                        <th className="py-4">Builder</th>
                                        <th className="py-4">Points</th>
                                        <th className="py-4 text-right pr-6">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {allTasks.slice(0, 8).map((task) => {
                                        const member = members.find(m => m.id === task.assigneeId);
                                        const pts = calculateFinalPoints(task, member?.level || 'Confirmé');
                                        const isValidated = validatedStatuses.includes(task.status);
                                        return (
                                            <tr key={task.id} className="border-b border-rudore-border/20 hover:bg-rudore-orange/5 transition-colors group">
                                                <td className="py-4 pl-6">
                                                    <div>
                                                        <p className="font-bold text-rudore-text group-hover:text-rudore-orange transition-colors text-xs uppercase tracking-tight">
                                                            {task.title}
                                                        </p>
                                                        <p className="text-caption-label text-rudore-text/30 font-mono mt-0.5 uppercase">{task.projectId}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="text-caption-label px-2 py-0.5 bg-rudore-sidebar border border-rudore-border text-rudore-text/40 uppercase font-black tracking-tighter">
                                                        {COMPLEXITY_LABELS[task.complexity]}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 bg-rudore-orange text-white text-[8px] flex items-center justify-center font-black rounded-none">
                                                            {member?.avatarInitials}
                                                        </div>
                                                        <span className="text-rudore-text/40 text-caption-label uppercase font-bold tracking-tight">
                                                            {member?.name || '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 font-mono text-rudore-orange font-black text-xs">
                                                    +{pts}
                                                </td>
                                                <td className="py-4 text-right pr-6">
                                                    {isValidated ? (
                                                        <span className="inline-block px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/10 text-[9px] text-emerald-500 uppercase font-black badge-rounded">
                                                            Validé
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-0.5 border border-rudore-border bg-rudore-sidebar/10 text-caption-label text-rudore-text/50 uppercase font-black badge-rounded">
                                                            En Cours
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* 2. Leaderboard & Stats (Side) */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <Card title="Champions du Capital" subtitle="Classement par Méritocratie">
                        <div className="space-y-4">
                            {leaderboard.map((member, idx) => (
                                <div key={member.id} className="flex items-center justify-between p-4 bg-rudore-sidebar/30 border border-rudore-border hover:border-rudore-orange transition-all group">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-8 h-8 flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-rudore-orange text-white' : 'bg-rudore-sidebar border border-rudore-border text-rudore-text/30'}`}>
                                            0{idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-rudore-text uppercase tracking-widest">{member.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-caption-label text-rudore-text/40 uppercase tracking-tighter">{member.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-rudore-orange font-mono font-black text-sm">{member.computedPoints}</div>
                                        <div className="text-[8px] text-rudore-text/20 uppercase font-bold">Points</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Statistiques Pool" className="bg-rudore-sidebar/20 border-dashed">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-caption-label text-rudore-text/40 uppercase font-bold mb-1">Pool Total Builders</p>
                                    <h4 className="text-2xl font-header font-bold text-rudore-text">25.00%</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-caption-label text-rudore-text/40 uppercase font-bold mb-1">Allocated</p>
                                    <h4 className="text-lg font-header font-bold text-rudore-orange">18.4%</h4>
                                </div>
                            </div>
                            <div className="w-full h-1.5 bg-rudore-sidebar border border-rudore-border">
                                <div className="bg-rudore-orange h-full" style={{ width: '73.6%' }} />
                            </div>
                            <p className="text-caption-label text-rudore-text/30 leading-relaxed italic">
                                Le pool de 25% est réservé exclusivement aux builders. Les 75% restants sont répartis entre RUDORE & Co et le CEO du spin-off.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};