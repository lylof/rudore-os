"use client";

import React from 'react';
import { KanbanTask, COMPLEXITY_LABELS, QUALITY_LABELS, TaskComplexity } from '../../types';
import { Clock, User, GripVertical, MessageSquare } from 'lucide-react';
import { usePointsConfig } from '../../context/PointsConfigContext';

interface KanbanCardProps {
    task: KanbanTask;
    memberName?: string;
    memberLevel?: string;
    onClick: () => void;
}

const COMPLEXITY_COLORS: Record<TaskComplexity, string> = {
    [TaskComplexity.VERY_SIMPLE]: 'border-emerald-500/50 text-emerald-400',
    [TaskComplexity.SIMPLE]: 'border-blue-500/50 text-blue-400',
    [TaskComplexity.MEDIUM]: 'border-yellow-500/50 text-yellow-500',
    [TaskComplexity.COMPLEX]: 'border-orange-500/50 text-orange-400',
    [TaskComplexity.VERY_COMPLEX]: 'border-red-500/50 text-red-500',
    [TaskComplexity.CRITICAL]: 'border-rudore-orange text-rudore-orange border-2',
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, memberName, memberLevel, onClick }) => {
    const { calculateFinalPoints, calculateBasePoints } = usePointsConfig();
    const pb = calculateBasePoints(task.complexity);
    const finalPoints = calculateFinalPoints(task, memberLevel || 'Confirmé');
    const hasQuality = !!task.qualityRating;

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('taskId', task.id);
                e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={onClick}
            className="group bg-rudore-panel border border-rudore-border p-3 cursor-pointer hover:border-rudore-orange shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
        >
            {/* Drag handle + Tags */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <GripVertical className="text-rudore-text/20 group-hover:text-rudore-text/40 transition-colors shrink-0 cursor-grab" size={14} />
                    {task.tags?.map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-rudore-sidebar text-rudore-text/40 border border-rudore-border badge-rounded font-mono uppercase tracking-tighter">
                            {tag}
                        </span>
                    ))}
                </div>
                {/* Points badge */}
                <span className="text-[10px] font-mono font-bold text-rudore-orange bg-rudore-sidebar border border-rudore-orange/30 px-1.5 py-0.5 badge-rounded">
                    {hasQuality ? finalPoints : pb} pts
                </span>
            </div>

            {/* Title */}
            <h4 className="text-sm font-bold text-rudore-text group-hover:text-rudore-orange transition-colors leading-tight mb-2 uppercase tracking-wide">
                {task.title}
            </h4>

            {/* Complexity badge */}
            <div className="flex items-center gap-2 mb-2">
                <span className={`text-[8px] px-2 py-0.5 badge-rounded font-bold uppercase tracking-[0.1em] border bg-rudore-sidebar/50 ${COMPLEXITY_COLORS[task.complexity]}`}>
                    {COMPLEXITY_LABELS[task.complexity]}
                </span>
                {hasQuality && (
                    <span className="text-[8px] px-2 py-0.5 badge-rounded font-bold uppercase tracking-[0.1em] bg-rudore-sidebar text-rudore-text/40 border border-rudore-border">
                        MQ: {QUALITY_LABELS[task.qualityRating!]}
                    </span>
                )}
            </div>

            {/* Footer: assignee + deadline */}
            <div className="flex items-center justify-between text-[10px] text-rudore-text/30 mt-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-rudore-sidebar border border-rudore-border flex items-center justify-center badge-rounded">
                        <User size={10} className="text-rudore-text/30" />
                    </div>
                    <span className="truncate max-w-[80px] uppercase font-mono tracking-tighter">{memberName || 'NON ASSIGNÉ'}</span>
                </div>
                {task.deadline && (
                    <div className="flex items-center gap-1 text-rudore-text/20 font-mono">
                        <Clock size={10} />
                        <span>{task.deadline}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
