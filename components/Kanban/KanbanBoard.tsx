"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { KanbanTaskStatus, KANBAN_STATUS_LABELS, KanbanTask, Member, Project } from '../../types';
import { useKanban } from '../../context/KanbanContext';
import { KanbanCard } from './KanbanCard';
import { TaskModal } from './TaskModal';
import { Plus, Filter, LayoutGrid, Zap, ClipboardList, Activity, Eye, CheckCircle2, Archive } from 'lucide-react';
import { usePointsConfig } from '../../context/PointsConfigContext';

interface KanbanBoardProps {
    members: Member[];
    projects: Project[];
}

const COLUMN_ORDER: KanbanTaskStatus[] = [
    KanbanTaskStatus.BACKLOG,
    KanbanTaskStatus.IN_PROGRESS,
    KanbanTaskStatus.REVIEW,
    KanbanTaskStatus.VALIDATED,
    KanbanTaskStatus.ARCHIVED,
];

const COLUMN_CONFIG: Record<KanbanTaskStatus, { accent: string, lightBg: string, lightText: string, icon: React.ElementType }> = {
    [KanbanTaskStatus.BACKLOG]: { accent: 'border-t-rudore-text/20', lightBg: 'bg-rudore-sidebar', lightText: 'text-rudore-text/60', icon: ClipboardList },
    [KanbanTaskStatus.IN_PROGRESS]: { accent: 'border-t-rudore-text/40', lightBg: 'bg-rudore-text', lightText: 'text-rudore-panel', icon: Activity },
    [KanbanTaskStatus.REVIEW]: { accent: 'border-t-rudore-text/30', lightBg: 'bg-rudore-text/50', lightText: 'text-white', icon: Eye },
    [KanbanTaskStatus.VALIDATED]: { accent: 'border-t-rudore-orange', lightBg: 'bg-rudore-orange', lightText: 'text-white', icon: CheckCircle2 },
    [KanbanTaskStatus.ARCHIVED]: { accent: 'border-t-rudore-text/10', lightBg: 'bg-rudore-sidebar/50', lightText: 'text-rudore-text/40', icon: Archive },
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ members, projects }) => {
    const { tasks, moveTask } = useKanban();
    const { calculateFinalPoints } = usePointsConfig();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
    const [createInColumn, setCreateInColumn] = useState<KanbanTaskStatus>(KanbanTaskStatus.BACKLOG);
    const [filterProject, setFilterProject] = useState<string>('ALL');
    const [filterMember, setFilterMember] = useState<string>('ALL');

    const getMember = useCallback((id: string) => members.find(m => m.id === id), [members]);

    // O(N) Filter Pass
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (filterProject !== 'ALL' && t.projectId !== filterProject) return false;
            if (filterMember !== 'ALL' && t.assigneeId !== filterMember) return false;
            return true;
        });
    }, [tasks, filterProject, filterMember]);

    // O(N) Grouping Pass (Eliminates O(N * Columns) penalty)
    const tasksByStatus = useMemo(() => {
        const grouped = {
            [KanbanTaskStatus.BACKLOG]: [] as KanbanTask[],
            [KanbanTaskStatus.IN_PROGRESS]: [] as KanbanTask[],
            [KanbanTaskStatus.REVIEW]: [] as KanbanTask[],
            [KanbanTaskStatus.VALIDATED]: [] as KanbanTask[],
            [KanbanTaskStatus.ARCHIVED]: [] as KanbanTask[],
        };
        filteredTasks.forEach(t => {
            if (grouped[t.status]) grouped[t.status].push(t);
        });
        return grouped;
    }, [filteredTasks]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetStatus: KanbanTaskStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            moveTask(taskId, targetStatus);
        }
    };

    const openCreateModal = (status: KanbanTaskStatus) => {
        setEditingTask(null);
        setCreateInColumn(status);
        setIsModalOpen(true);
    };

    const openEditModal = (task: KanbanTask) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    // Calculate total validated points O(N) Memoized
    const totalValidatedPoints = useMemo(() => {
        return tasks.reduce((sum, t) => {
            if (t.status === KanbanTaskStatus.VALIDATED || t.status === KanbanTaskStatus.ARCHIVED) {
                const member = getMember(t.assigneeId);
                return sum + calculateFinalPoints(t, member?.level || 'Confirmé');
            }
            return sum;
        }, 0);
    }, [tasks, getMember, calculateFinalPoints]);

    const projectList = useMemo(() => projects.map(p => ({ id: p.id, name: p.name })), [projects]);
    const memberList = useMemo(() => members.map(m => ({ id: m.id, name: m.name, level: m.level })), [members]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="font-header text-3xl font-bold text-rudore-text uppercase tracking-widest">
                        Gestion de Projet
                    </h2>
                    <p className="text-rudore-text/50 font-mono text-xs mt-1 uppercase">
                        Tableau Kanban • Système de points intégré
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Stats */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rudore-sidebar border border-rudore-orange/30 badge-rounded">
                        <Zap className="text-rudore-orange" size={14} />
                        <span className="text-xs font-mono font-bold text-rudore-orange uppercase">
                            {totalValidatedPoints} pts validés
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rudore-sidebar border border-rudore-border badge-rounded">
                        <LayoutGrid size={14} className="text-rudore-text/40" />
                        <span className="text-xs font-mono text-rudore-text/40 uppercase">
                            {tasks.length} tâches
                        </span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <Filter size={14} className="text-rudore-text/30" />
                <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="text-xs bg-rudore-panel border border-rudore-border text-rudore-text/60 px-3 py-1.5 focus:outline-none focus:border-rudore-orange transition-colors uppercase tracking-widest"
                >
                    <option value="ALL">Tous les Projets</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                    value={filterMember}
                    onChange={(e) => setFilterMember(e.target.value)}
                    className="text-xs bg-rudore-panel border border-rudore-border text-rudore-text/60 px-3 py-1.5 focus:outline-none focus:border-rudore-orange transition-colors uppercase tracking-widest"
                >
                    <option value="ALL">Tous les Membres</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            </div>

            {/* Kanban Columns - Horizontal Scroll Container */}
            <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-thin scrollbar-thumb-rudore-border">
                {COLUMN_ORDER.map(status => {
                    const columnTasks = tasksByStatus[status] || [];
                    const config = COLUMN_CONFIG[status];
                    const Icon = config.icon;
                    const columnPoints = columnTasks.reduce((sum, t) => {
                        const member = getMember(t.assigneeId);
                        return sum + calculateFinalPoints(t, member?.level || 'Confirmé');
                    }, 0);

                    return (
                        <div
                            key={status}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status)}
                            className={`flex-shrink-0 w-80 lg:w-[calc((100%-48px)/3)] xl:w-[calc((100%-72px)/4)] bg-rudore-sidebar/50 dark:bg-rudore-panel/20 border border-rudore-border flex flex-col min-h-[650px] border-t-4 ${config.accent} transition-all duration-300 shadow-sm`}
                        >
                            {/* Column Header - Action Ledger Style (Light) / Classic (Dark) */}
                            <div className="p-4 border-b border-rudore-border flex items-center justify-between bg-transparent">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 flex items-center justify-center font-black text-sm ${config.lightBg} ${config.lightText} dark:bg-transparent dark:text-rudore-text/40 shrink-0`}>
                                        <Icon size={14} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-black text-rudore-text dark:text-white uppercase tracking-[0.2em] font-header block leading-none mb-1">
                                            {KANBAN_STATUS_LABELS[status]}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] px-1.5 py-0 bg-rudore-sidebar border border-rudore-border text-rudore-text/30 font-mono tracking-tighter">
                                                {columnTasks.length} TÂCHES
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {columnPoints > 0 && (
                                        <span className="text-[10px] font-mono text-rudore-orange font-black uppercase">{columnPoints} pts</span>
                                    )}
                                </div>
                            </div>

                            {/* Column Cards */}
                            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                                {columnTasks.length === 0 ? (
                                    <div className="flex items-center justify-center h-24 text-rudore-text/20 text-[10px] uppercase font-bold tracking-widest border border-dashed border-rudore-border mt-2">
                                        Pipeline vide
                                    </div>
                                ) : (
                                    columnTasks.map(task => (
                                        <KanbanCard
                                            key={task.id}
                                            task={task}
                                            memberName={getMember(task.assigneeId)?.name}
                                            memberLevel={getMember(task.assigneeId)?.level}
                                            onClick={() => openEditModal(task)}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Column Footer: Add button */}
                            <div className="p-2 border-t border-rudore-border bg-transparent">
                                <button
                                    onClick={() => openCreateModal(status)}
                                    className="w-full flex items-center justify-center gap-1.5 py-3 text-[10px] text-rudore-text/40 hover:text-rudore-orange hover:bg-white dark:hover:bg-rudore-sidebar/50 transition-all uppercase font-black tracking-[0.2em]"
                                >
                                    <Plus size={12} strokeWidth={3} />
                                    Nouveau
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Task Modal */}
            <TaskModal
                task={editingTask}
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
                projects={projectList}
                members={memberList}
                defaultStatus={createInColumn}
            />
        </div>
    );
};
