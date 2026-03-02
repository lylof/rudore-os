
---

## 🛑 FICHIER : `components/Kanban/KanbanBoard.tsx`

### [PERFORMANCES CRITIQUES : COMPLEXITÉ ALGORITHMIQUE] - Lignes 45-52 & 140-147 :
**Le problème :** Tu fais des `.filter()` en cascade directement dans le corps du composant et à l'intérieur d'un `.map()`.
**Le risque :** C'est une catastrophe de performance (O(N * C) où N est le nombre de tâches et C le nombre de colonnes). À chaque frappe clavier, chaque ouverture de modale, ou chaque réception d'une nouvelle tâche, React re-déclenche l'ensemble de ces itérations synchrones. Pour 1000 tâches, tu fais plus de 6000 itérations bloquantes sur le Main Thread à CHAQUE render. Ton interface va freezer (Frame Drop) et le ventilateur du PC de tes utilisateurs va se déclencher. 
**La Solution Experte :** Utiliser `useMemo` pour grouper les tâches par statut en une SEULE passe (O(N)), et memoïzer les composants enfants pour bloquer la propagation des re-renders.

### [ARCHITECTURE FRONTEND : RE-RENDERS EN CASCADE] - Lignes 36-40 :
**Le problème :** Les modales de création/édition partagent le *même arbre d'état* local que le Kanban entier (`isModalOpen`).
**Le risque :** Quand tu cliques sur "Nouveau" pour ouvrir une modale, l'état `isModalOpen` passe à `true`. React va détruire et recréer virtuellement TOUTES les colonnes et TOUTES les cartes du tableau juste pour afficher ta modale par-dessus. C'est du gâchis pur.
**La Solution Experte :** Isoler l'état d'ouverture de la modale ou utiliser l'API Context/Zustand pour que seuls la modale et le bouton concerné re-rendent.

**La Solution Experte (Code Refactorisé Partiel & Optimisé) :**
```tsx
"use client";

import React, { useState, useMemo } from 'react';
// ... imports ...

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ members, projects }) => {
    const { tasks, moveTask } = useKanban();
    const { calculateFinalPoints } = usePointsConfig();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
    const [createInColumn, setCreateInColumn] = useState<KanbanTaskStatus>(KanbanTaskStatus.BACKLOG);
    const [filterProject, setFilterProject] = useState<string>('ALL');
    const [filterMember, setFilterMember] = useState<string>('ALL');

    // 1. OPTIMISATION EXTRÊME : Mémorisation & Algorithme en O(N) unique
    // On calcule toutes les colonnes, les points et les filtres EN UNE SEULE PASSE.
    const { columnData, totalValidatedPoints } = useMemo(() => {
        // Initialisation de la structure de données
        const cols = COLUMN_ORDER.reduce((acc, status) => {
            acc[status] = { tasks: [], points: 0 };
            return acc;
        }, {} as Record<KanbanTaskStatus, { tasks: KanbanTask[], points: number }>);

        let validatedPts = 0;

        // Une seule boucle pour tout résoudre
        for (let i = 0; i < tasks.length; i++) {
            const t = tasks[i];
            
            // Filtres rapides O(1)
            if (filterProject !== 'ALL' && t.projectId !== filterProject) continue;
            if (filterMember !== 'ALL' && t.assigneeId !== filterMember) continue;

            // Membre (idéalement pré-indexé en Hashmap O(1) au lieu de find() O(M))
            const member = members.find(m => m.id === t.assigneeId);
            const taskPoints = calculateFinalPoints(t, member?.level || 'Confirmé');

            // Ajout direct au bon statut O(1)
            if (cols[t.status]) {
                 cols[t.status].tasks.push(t);
                 cols[t.status].points += taskPoints;
            }

            // Cumul global
            if (t.status === KanbanTaskStatus.VALIDATED || t.status === KanbanTaskStatus.ARCHIVED) {
                validatedPts += taskPoints;
            }
        }

        return { columnData: cols, totalValidatedPoints: validatedPts };
    }, [tasks, filterProject, filterMember, members, calculateFinalPoints]);

    // Indexation des projets et membres pour le rendu O(1)
    const projectList = useMemo(() => projects.map(p => ({ id: p.id, name: p.name })), [projects]);
    const memberList = useMemo(() => members.map(m => ({ id: m.id, name: m.name, level: m.level })), [members]);
    const getMember = (id: string) => members.find(m => m.id === id);

    // ... handleDrop / openModal inchangés ...

    return (
        <div className="space-y-6">
            {/* Header non bloquant pour le rendu */}
            {/* ... */}
            
            <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4">
                {COLUMN_ORDER.map(status => {
                    const colInfo = columnData[status];
                    const config = COLUMN_CONFIG[status];
                    const Icon = config.icon;

                    return (
                        <div key={status} className={`flex-shrink-0 w-80 ...`}>
                            {/* Évite tout recalcul lourd ici */}
                            <div className="p-4 flex justify-between">
                                {/* ... Affichage de colInfo.tasks.length et colInfo.points ... */}
                            </div>

                            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                                {colInfo.tasks.length === 0 ? (
                                    <div>Pipeline vide</div>
                                ) : (
                                    colInfo.tasks.map(task => (
                                        // TODO: Wrapping de <KanbanCard /> dans React.memo() pour bloquer les cascades
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
                        </div>
                    );
                })}
            </div>
            {/* ... Modal ... */}
        </div>
    );
};
```
