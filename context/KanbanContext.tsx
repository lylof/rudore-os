"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { KanbanTask, KanbanTaskStatus, TaskComplexity } from '../types';

const STORAGE_KEY = 'rudore_kanban_tasks';

// --- MOCK DATA ---
const INITIAL_TASKS: KanbanTask[] = [
    {
        id: 'kt-1',
        title: 'Design System V2 — Tokens couleurs',
        description: 'Créer le système de tokens de couleurs pour le design system RUDORE v2.',
        projectId: 'p2',
        assigneeId: 'm1',
        status: KanbanTaskStatus.VALIDATED,
        complexity: TaskComplexity.COMPLEX,
        qualityRating: 'EXCELLENT' as any,
        createdAt: '2024-05-01',
        updatedAt: '2024-05-10',
        tags: ['design', 'urgent'],
    },
    {
        id: 'kt-2',
        title: 'API Gateway — Setup Express + JWT',
        description: 'Configurer le gateway API avec Express, JWT auth, et rate limiting.',
        projectId: 'p2',
        assigneeId: 'm4',
        status: KanbanTaskStatus.VALIDATED,
        complexity: TaskComplexity.VERY_COMPLEX,
        qualityRating: 'GOOD' as any,
        createdAt: '2024-05-05',
        updatedAt: '2024-05-12',
        tags: ['backend'],
    },
    {
        id: 'kt-3',
        title: 'Landing Page Copy — DoAsi',
        description: 'Rédiger le copywriting de la landing page pour le projet DoAsi.',
        projectId: 'p1',
        assigneeId: 'm3',
        status: KanbanTaskStatus.REVIEW,
        complexity: TaskComplexity.SIMPLE,
        createdAt: '2024-05-10',
        updatedAt: '2024-05-14',
        tags: ['marketing'],
    },
    {
        id: 'kt-4',
        title: 'User Research — Interviews utilisateurs',
        description: 'Conduire 10 interviews utilisateurs pour valider le concept KOODI.',
        projectId: 'p2',
        assigneeId: 'm1',
        status: KanbanTaskStatus.IN_PROGRESS,
        complexity: TaskComplexity.MEDIUM,
        createdAt: '2024-05-12',
        updatedAt: '2024-05-15',
        tags: ['research'],
    },
    {
        id: 'kt-5',
        title: 'Composants React — Banque Atlantique',
        description: 'Développer les composants React pour le dashboard bancaire.',
        projectId: 'p3',
        assigneeId: 'm2',
        status: KanbanTaskStatus.IN_PROGRESS,
        complexity: TaskComplexity.COMPLEX,
        createdAt: '2024-05-14',
        updatedAt: '2024-05-16',
        tags: ['frontend'],
    },
    {
        id: 'kt-6',
        title: 'Intégration USSD — Architecture codes',
        description: 'Concevoir l\'architecture de l\'annuaire de codes USSD pour KOODI.',
        projectId: 'p2',
        assigneeId: 'm4',
        status: KanbanTaskStatus.BACKLOG,
        complexity: TaskComplexity.VERY_COMPLEX,
        createdAt: '2024-05-16',
        updatedAt: '2024-05-16',
        tags: ['backend', 'architecture'],
    },
    {
        id: 'kt-7',
        title: 'Onboarding flow — Ecrans de bienvenue',
        description: 'Designer et implémenter le flux d\'onboarding pour nouveaux utilisateurs.',
        projectId: 'p1',
        assigneeId: 'm5',
        status: KanbanTaskStatus.BACKLOG,
        complexity: TaskComplexity.MEDIUM,
        createdAt: '2024-05-17',
        updatedAt: '2024-05-17',
        tags: ['design', 'frontend'],
    },
];

// --- CONTEXT INTERFACE ---
interface KanbanContextType {
    tasks: KanbanTask[];
    addTask: (task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateTask: (id: string, patch: Partial<KanbanTask>) => void;
    deleteTask: (id: string) => void;
    moveTask: (id: string, newStatus: KanbanTaskStatus) => void;
    getTasksByStatus: (status: KanbanTaskStatus) => KanbanTask[];
    getTasksByProject: (projectId: string) => KanbanTask[];
    getTasksByAssignee: (assigneeId: string) => KanbanTask[];
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

// --- PROVIDER ---
export const KanbanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // O(N) Pre-indexing for O(1) lookups
    const { byStatus, byProject, byAssignee } = useMemo(() => {
        const _byStatus: Record<string, KanbanTask[]> = {};
        const _byProject: Record<string, KanbanTask[]> = {};
        const _byAssignee: Record<string, KanbanTask[]> = {};

        tasks.forEach(t => {
            if (!_byStatus[t.status]) _byStatus[t.status] = [];
            _byStatus[t.status].push(t);

            if (!_byProject[t.projectId]) _byProject[t.projectId] = [];
            _byProject[t.projectId].push(t);

            if (!_byAssignee[t.assigneeId]) _byAssignee[t.assigneeId] = [];
            _byAssignee[t.assigneeId].push(t);
        });

        return { byStatus: _byStatus, byProject: _byProject, byAssignee: _byAssignee };
    }, [tasks]);

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/kanban');
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const addTask = useCallback(async (taskData: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>) => {
        const tempId = `kt-temp-${Date.now()}`;
        try {
            const res = await fetch('/api/kanban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...taskData, id: tempId })
            });
            if (res.ok) {
                const newTask = await res.json();
                setTasks(prev => [newTask, ...prev]);
            }
        } catch (error) {
            console.error("Error adding task:", error);
        }
    }, []);

    const updateTask = useCallback(async (id: string, patch: Partial<KanbanTask>) => {
        try {
            const res = await fetch('/api/kanban', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...patch })
            });
            if (res.ok) {
                const updatedTask = await res.json();
                setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
            }
        } catch (error) {
            console.error("Error updating task:", error);
        }
    }, []);

    const deleteTask = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/kanban?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setTasks(prev => prev.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    }, []);

    const moveTask = useCallback((id: string, newStatus: KanbanTaskStatus) => {
        updateTask(id, { status: newStatus });
    }, [updateTask]);

    const getTasksByStatus = useCallback((status: KanbanTaskStatus) => {
        return byStatus[status] || [];
    }, [byStatus]);

    const getTasksByProject = useCallback((projectId: string) => {
        return byProject[projectId] || [];
    }, [byProject]);

    const getTasksByAssignee = useCallback((assigneeId: string) => {
        return byAssignee[assigneeId] || [];
    }, [byAssignee]);

    return (
        <KanbanContext.Provider value={{
            tasks,
            addTask,
            updateTask,
            deleteTask,
            moveTask,
            getTasksByStatus,
            getTasksByProject,
            getTasksByAssignee,
        }}>
            {children}
        </KanbanContext.Provider>
    );
};


export const useKanban = () => {
    const context = useContext(KanbanContext);
    if (context === undefined) {
        throw new Error('useKanban must be used within a KanbanProvider');
    }
    return context;
};
