"use client";

import React, { useState, useEffect } from 'react';
import { KanbanTask, KanbanTaskStatus, TaskComplexity, QualityRating, COMPLEXITY_LABELS, QUALITY_LABELS } from '../../types';
import { X, Save, Trash2, Zap } from 'lucide-react';
import { usePointsConfig } from '../../context/PointsConfigContext';
import { useKanban } from '../../context/KanbanContext';

interface TaskModalProps {
    task?: KanbanTask | null;     // null = create mode
    isOpen: boolean;
    onClose: () => void;
    projects: { id: string; name: string }[];
    members: { id: string; name: string; level: string }[];
    defaultStatus?: KanbanTaskStatus;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose, projects, members, defaultStatus }) => {
    const { addTask, updateTask, deleteTask } = useKanban();
    const { calculateBasePoints, calculateFinalPoints } = usePointsConfig();

    const [form, setForm] = useState({
        title: '',
        description: '',
        projectId: '',
        assigneeId: '',
        complexity: TaskComplexity.MEDIUM,
        qualityRating: '' as QualityRating | '',
        status: defaultStatus || KanbanTaskStatus.BACKLOG,
        deadline: '',
        tags: '',
    });

    useEffect(() => {
        if (task) {
            setForm({
                title: task.title,
                description: task.description,
                projectId: task.projectId,
                assigneeId: task.assigneeId,
                complexity: task.complexity,
                qualityRating: task.qualityRating || '',
                status: task.status,
                deadline: task.deadline || '',
                tags: task.tags?.join(', ') || '',
            });
        } else {
            setForm({
                title: '',
                description: '',
                projectId: projects[0]?.id || '',
                assigneeId: members[0]?.id || '',
                complexity: TaskComplexity.MEDIUM,
                qualityRating: '',
                status: defaultStatus || KanbanTaskStatus.BACKLOG,
                deadline: '',
                tags: '',
            });
        }
    }, [task, isOpen, defaultStatus]);

    if (!isOpen) return null;

    const selectedMember = members.find(m => m.id === form.assigneeId);
    const pb = calculateBasePoints(form.complexity);

    // Mock task to calculate final points
    const mockTask: KanbanTask = {
        id: '',
        title: '',
        description: '',
        projectId: form.projectId,
        assigneeId: form.assigneeId,
        status: form.status,
        complexity: form.complexity,
        qualityRating: form.qualityRating ? form.qualityRating as QualityRating : undefined,
        createdAt: '',
        updatedAt: '',
    };
    const finalPts = calculateFinalPoints(mockTask, selectedMember?.level || 'Confirmé');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;

        const taskData = {
            title: form.title.trim(),
            description: form.description.trim(),
            projectId: form.projectId,
            assigneeId: form.assigneeId,
            status: form.status,
            complexity: form.complexity,
            qualityRating: form.qualityRating ? form.qualityRating as QualityRating : undefined,
            deadline: form.deadline || undefined,
            tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        };

        if (task) {
            updateTask(task.id, taskData);
        } else {
            addTask(taskData);
        }
        onClose();
    };

    const handleDelete = () => {
        if (task && window.confirm('Supprimer cette tâche ?')) {
            deleteTask(task.id);
            onClose();
        }
    };

    const inputClass = 'w-full bg-rudore-sidebar border border-rudore-border p-3 text-sm text-rudore-text focus:outline-none focus:border-rudore-orange transition-colors placeholder:text-rudore-text/20 font-sans';
    const labelClass = 'text-[10px] font-bold text-rudore-text/30 uppercase tracking-[0.2em] mb-1.5 block';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-rudore-panel/90" onClick={onClose} />
            <div className="relative bg-rudore-panel border border-rudore-border w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-rudore-border bg-rudore-sidebar/50">
                    <h2 className="font-header text-xl font-bold text-rudore-text uppercase tracking-widest">
                        {task ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {task && (
                            <button onClick={handleDelete} className="p-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-rudore-text/30 hover:text-rudore-text transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Points Preview */}
                <div className="mx-5 mt-6 p-4 bg-rudore-sidebar border border-rudore-border flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-2">
                        <Zap className="text-rudore-orange" size={16} />
                        <span className="text-[10px] text-rudore-text/30 uppercase font-bold tracking-widest">Calcul en temps réel</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] text-rudore-text/30 font-mono">PB: <strong className="text-rudore-text/60">{pb}</strong></span>
                        {form.qualityRating && (
                            <span className="text-[10px] text-rudore-text/20 font-mono lowercase">× MQ × MR</span>
                        )}
                        <span className="text-2xl font-mono font-bold text-rudore-orange">{form.qualityRating ? finalPts : pb} <span className="text-xs uppercase">pts</span></span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Title */}
                    <div>
                        <label className={labelClass}>Titre de la Tâche</label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                            className={inputClass}
                            placeholder="Ex: Intégration API Stripe"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                            className={`${inputClass} resize-none`}
                            rows={3}
                            placeholder="Détails de la tâche..."
                        />
                    </div>

                    {/* Row: Project + Assignee */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Projet</label>
                            <select
                                value={form.projectId}
                                onChange={(e) => setForm(f => ({ ...f, projectId: e.target.value }))}
                                className={inputClass}
                            >
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Assigné à</label>
                            <select
                                value={form.assigneeId}
                                onChange={(e) => setForm(f => ({ ...f, assigneeId: e.target.value }))}
                                className={inputClass}
                            >
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Row: Complexity + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Complexité (→ Points de Base)</label>
                            <select
                                value={form.complexity}
                                onChange={(e) => setForm(f => ({ ...f, complexity: e.target.value as TaskComplexity }))}
                                className={inputClass}
                            >
                                {Object.values(TaskComplexity).map(c => (
                                    <option key={c} value={c}>
                                        {COMPLEXITY_LABELS[c]} — {calculateBasePoints(c)} pts
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Statut</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm(f => ({ ...f, status: e.target.value as KanbanTaskStatus }))}
                                className={inputClass}
                            >
                                {Object.values(KanbanTaskStatus).map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Quality Rating (only for Review/Validated) */}
                    {(form.status === KanbanTaskStatus.REVIEW || form.status === KanbanTaskStatus.VALIDATED || form.status === KanbanTaskStatus.ARCHIVED) && (
                        <div>
                            <label className={labelClass}>Évaluation Qualité (Multiplicateur MQ)</label>
                            <select
                                value={form.qualityRating}
                                onChange={(e) => setForm(f => ({ ...f, qualityRating: e.target.value as QualityRating }))}
                                className={inputClass}
                            >
                                <option value="">— Non évalué —</option>
                                {Object.values(QualityRating).map(q => (
                                    <option key={q} value={q}>{QUALITY_LABELS[q]}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Row: Deadline + Tags */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Date limite</label>
                            <input
                                type="date"
                                value={form.deadline}
                                onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Tags (séparés par des virgules)</label>
                            <input
                                value={form.tags}
                                onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
                                className={inputClass}
                                placeholder="design, urgent, frontend"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-4 border-t border-rudore-border mt-6">
                        <button
                            type="submit"
                            className="flex items-center gap-3 bg-rudore-text hover:bg-rudore-orange text-rudore-panel hover:text-white font-bold py-3 px-8 transition-all duration-300 text-sm uppercase tracking-widest border border-rudore-border"
                        >
                            <Save size={16} />
                            {task ? 'Mettre à jour' : 'Créer la tâche'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
