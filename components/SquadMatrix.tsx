"use client";

import React, { useState } from 'react';
import { Card, Badge } from './ui/Card';
import { Status, Department, Member, Level } from '../types';
import { Network, Zap, GitBranch, Plus, X, Filter } from 'lucide-react';

interface SquadMember extends Member {
  assigned: boolean;
}

const PROJECT_INFO_DEFAULT = {
  id: 'koodi-01',
  name: 'PROJET KOODI',
  status: Status.DEVELOPMENT,
  description: 'Solution Fintech pour micro-transactions au Togo.'
};

// Simplified Initial Data for Matrix View to match the richer structure
// const INITIAL_MEMBERS: SquadMember[] = [
//   { id: 'm1', name: 'Victor', email: 'v@rudore.os', role: 'Lead Product', department: Department.DESIGN, avatarInitials: 'VI', isLead: true, assigned: true, level: Level.EXPERT, skills: [{ name: 'Figma', level: 5 }], availability: 80, joinedAt: '2023-01-01T00:00:00.000Z', wallet: { totalPoints: 0, currentMonthPoints: 0, equityValue: 0 } },
//   { id: 'm2', name: 'Fellow A', email: 'fa@rudore.os', role: 'Fullstack Dev', department: Department.TECH, avatarInitials: 'FA', assigned: true, level: Level.JUNIOR, skills: [{ name: 'React', level: 2 }], availability: 40, joinedAt: '2024-02-01T00:00:00.000Z', wallet: { totalPoints: 0, currentMonthPoints: 0, equityValue: 0 } },
//   { id: 'm3', name: 'Fellow B', email: 'fb@rudore.os', role: 'Growth Hacker', department: Department.MARKETING, avatarInitials: 'FB', assigned: true, level: Level.CONFIRMED, skills: [{ name: 'SEO', level: 4 }], availability: 100, joinedAt: '2024-03-01T00:00:00.000Z', wallet: { totalPoints: 0, currentMonthPoints: 0, equityValue: 0 } },
//   { id: 'm4', name: 'Lionel', email: 'l@rudore.os', role: 'Tech Lead', department: Department.TECH, avatarInitials: 'LI', isLead: true, assigned: true, level: Level.EXPERT, skills: [{ name: 'Cloud', level: 5 }], availability: 20, joinedAt: '2023-01-01T00:00:00.000Z', wallet: { totalPoints: 0, currentMonthPoints: 0, equityValue: 0 } },
//   { id: 'm5', name: 'Sarah', email: 's@rudore.os', role: 'UI Designer', department: Department.DESIGN, avatarInitials: 'SA', assigned: false, level: Level.CONFIRMED, skills: [{ name: 'UI', level: 4 }], availability: 60, joinedAt: '2024-04-01T00:00:00.000Z', wallet: { totalPoints: 0, currentMonthPoints: 0, equityValue: 0 } },
//   { id: 'm6', name: 'David', email: 'd@rudore.os', role: 'Dév Backend', department: Department.TECH, avatarInitials: 'DA', assigned: false, level: Level.CONFIRMED, skills: [{ name: 'Python', level: 3 }], availability: 90, joinedAt: '2024-05-01T00:00:00.000Z', wallet: { totalPoints: 0, currentMonthPoints: 0, equityValue: 0 } },
//   { id: 'm7', name: 'Elena', email: 'e@rudore.os', role: 'Rédactrice', department: Department.MARKETING, avatarInitials: 'EL', assigned: false, level: Level.JUNIOR, skills: [{ name: 'Copy', level: 2 }], availability: 100, joinedAt: '2024-06-01T00:00:00.000Z', wallet: { totalPoints: 0, currentMonthPoints: 0, equityValue: 0 } },
//   { id: 'm8', name: 'Marc', email: 'm@rudore.os', role: 'Data Scientist', department: Department.R_AND_D, avatarInitials: 'MA', assigned: false, level: Level.EXPERT, skills: [{ name: 'ML', level: 5 }], availability: 50, joinedAt: '2023-01-01T00:00:00.000Z', wallet: { totalPoints: 0, currentMonthPoints: 0, equityValue: 0 } },
// ];

const DepartmentTag = ({ dept }: { dept: Department }) => {
  let color = 'text-rudore-text/40 border-rudore-border';
  switch (dept) {
    case Department.DESIGN: color = 'text-purple-400 border-purple-900/50 bg-purple-900/10'; break;
    case Department.TECH: color = 'text-blue-400 border-blue-900/50 bg-blue-900/10'; break;
    case Department.MARKETING: color = 'text-pink-400 border-pink-900/50 bg-pink-900/10'; break;
    case Department.R_AND_D: color = 'text-yellow-400 border-yellow-900/50 bg-yellow-900/10'; break;
  }
  return (
    <span className={`text-caption-label px-1.5 py-0.5 border badge-rounded uppercase tracking-wider font-mono ${color}`}>
      {dept}
    </span>
  );
};

const LevelIndicator = ({ level }: { level: Level }) => {
  let color = 'bg-blue-500';
  if (level === Level.CONFIRMED) color = 'bg-purple-500';
  if (level === Level.EXPERT) color = 'bg-rudore-orange';
  return <div className={`w-1.5 h-1.5 ${color}`} title={level}></div>;
};

interface MemberCardProps {
  member: SquadMember;
  actionIcon: React.ElementType;
  onAction: () => void;
  actionColor: string;
  onUpdateRole: (id: string, newRole: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, actionIcon: Icon, onAction, actionColor, onUpdateRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [roleValue, setRoleValue] = useState(member.role);

  const handleSave = () => {
    if (roleValue.trim() !== '') {
      onUpdateRole(member.id, roleValue);
    } else {
      setRoleValue(member.role); // Reset if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-rudore-panel border border-rudore-border hover:border-rudore-orange transition-all group">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 flex items-center justify-center font-bold text-xs ${member.isLead ? 'bg-rudore-sidebar text-white border border-rudore-border' : 'bg-rudore-sidebar text-rudore-text border border-rudore-border'}`}>
          {member.avatarInitials}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-rudore-text">{member.name}</span>
            {member.isLead && <Zap size={10} className="text-yellow-500 fill-yellow-500" />}
            <LevelIndicator level={member.level} />
          </div>
          <div className="flex items-center space-x-2 mt-1">
            {isEditing ? (
              <input
                autoFocus
                type="text"
                value={roleValue}
                onChange={(e) => setRoleValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="text-caption-label text-rudore-text uppercase bg-rudore-panel border border-rudore-border px-1 py-0.5 w-32 focus:outline-none focus:border-rudore-orange"
              />
            ) : (
              <span
                onClick={() => setIsEditing(true)}
                className="text-caption-label text-rudore-text uppercase cursor-pointer hover:text-rudore-orange border border-transparent hover:border-rudore-border px-1 -ml-1 transition-colors select-none"
                title="Cliquez pour éditer le rôle"
              >
                {member.role}
              </span>
            )}
            <span className="text-rudore-text/20 text-xs">•</span>
            <DepartmentTag dept={member.department} />
          </div>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onAction(); }}
        aria-label={member.assigned ? "Retirer de la squad" : "Ajouter à la squad"}
        className={`w-8 h-8 flex items-center justify-center border border-rudore-border bg-rudore-panel ${actionColor} hover:bg-rudore-sidebar transition-colors opacity-0 group-hover:opacity-100`}
      >
        <Icon size={14} />
      </button>
    </div>
  );
};

// Helper for short labels in filter
const getDeptLabel = (dept: Department | 'ALL') => {
  if (dept === 'ALL') return 'TOUS';
  switch (dept) {
    case Department.DESIGN: return 'DSGN';
    case Department.MARKETING: return 'MKTG';
    case Department.TECH: return 'TECH';
    case Department.R_AND_D: return 'R&D';
    default: return 'AUTRE';
  }
};

interface SquadMatrixProps {
  members: Member[];
}

export const SquadMatrix: React.FC<SquadMatrixProps> = ({ members: initialMembers }) => {
  const [members, setMembers] = useState<SquadMember[]>(() =>
    initialMembers.map(m => ({ ...m, assigned: false }))
  );
  const [projectInfo, setProjectInfo] = useState(PROJECT_INFO_DEFAULT);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'ALL'>('ALL');

  const toggleAssignment = (id: string) => {
    setMembers(prev => prev.map(m =>
      m.id === id ? { ...m, assigned: !m.assigned } : m
    ));
  };

  const updateMemberRole = (id: string, newRole: string) => {
    setMembers(prev => prev.map(m =>
      m.id === id ? { ...m, role: newRole } : m
    ));
  };

  const handleStatusChange = (newStatus: Status) => {
    setProjectInfo(prev => ({ ...prev, status: newStatus }));
    setIsStatusDropdownOpen(false);
  };

  const { assignedMembers, availableMembers } = React.useMemo(() => {
    return {
      assignedMembers: members.filter(m => m.assigned),
      availableMembers: members.filter(m =>
        !m.assigned && (departmentFilter === 'ALL' || m.department === departmentFilter)
      )
    };
  }, [members, departmentFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-header text-3xl font-bold text-rudore-text uppercase tracking-widest">Vue d'ensemble Squads</h2>
          <p className="text-rudore-text/40 font-mono text-xs mt-1 uppercase">Système d'Allocation Matricielle des Ressources</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 border border-rudore-orange text-rudore-orange text-xs font-bold uppercase tracking-wider bg-rudore-orange/10">
            Squads Actives
          </button>
          <button className="px-4 py-2 border border-rudore-border text-rudore-text text-xs font-bold uppercase tracking-wider hover:text-white hover:border-rudore-orange transition-colors">
            Réserve de Ressources
          </button>
        </div>
      </div>

      {/* The Matrix Diagram Visualization */}
      <div className="grid grid-cols-12 gap-8 relative">

        {/* Column 1: Departments (Source) */}
        <div className="col-span-3 space-y-4">
          <h3 className="text-xs font-bold text-rudore-text/40 uppercase tracking-[0.2em] mb-6">La Source (Départements)</h3>

          {[Department.DESIGN, Department.TECH, Department.MARKETING, Department.R_AND_D].map((dept, i) => (
            <div key={i} className="group relative p-4 bg-rudore-sidebar/50 border border-rudore-border hover:border-rudore-orange transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rudore-text/60 uppercase">{dept}</span>
                <GitBranch size={14} className="text-rudore-text/20 group-hover:text-rudore-orange" />
              </div>
              {/* Visual line connector stub */}
              <div className="absolute top-1/2 -right-4 w-4 h-[1px] bg-rudore-border group-hover:bg-rudore-orange transition-colors"></div>
            </div>
          ))}
        </div>

        {/* Column 2: The Squad (The Matrix Intersection) */}
        <div className="col-span-6">
          <h3 className="text-xs font-bold text-rudore-text/40 uppercase tracking-[0.2em] mb-6 text-center">Squad Active : {projectInfo.name}</h3>

          <Card className="border-rudore-orange/30 h-full">
            <div className="flex justify-between items-start mb-8 border-b border-rudore-border pb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-header font-bold text-rudore-text">{projectInfo.name}</h2>
                  <div className="relative">
                    <Badge
                      status={projectInfo.status}
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      aria-haspopup="listbox"
                      aria-expanded={isStatusDropdownOpen}
                      aria-label="Changer le statut du projet"
                    />
                    {isStatusDropdownOpen && (
                      <div
                        className="absolute top-full left-0 mt-2 w-32 bg-rudore-panel border border-rudore-border shadow-xl z-50 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-200"
                        role="listbox"
                      >
                        {Object.values(Status).map((s) => (
                          <button
                            key={s}
                            role="option"
                            aria-selected={projectInfo.status === s}
                            onClick={() => handleStatusChange(s as Status)}
                            className="text-left px-3 py-2 text-caption-label uppercase font-bold text-rudore-text/40 hover:bg-rudore-sidebar hover:text-rudore-orange transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-rudore-text/40 text-sm mt-2">{projectInfo.description}</p>
              </div>
              <div className="p-2 bg-rudore-orange/10 badge-rounded">
                <Network className="text-rudore-orange" size={24} />
              </div>
            </div>

            <div className="space-y-6">
              {/* Assigned Section */}
              <div>
                <h4 className="text-[10px] font-bold text-rudore-text/40 uppercase tracking-widest mb-3">
                  Équipe Assignée ({assignedMembers.length})
                </h4>
                {assignedMembers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {assignedMembers.map(member => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        actionIcon={X}
                        actionColor="text-red-500 hover:text-red-400 hover:border-red-500/50"
                        onAction={() => toggleAssignment(member.id)}
                        onUpdateRole={updateMemberRole}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-rudore-border text-center text-rudore-text text-xs italic">
                    Aucun membre assigné. Sélectionnez parmi les ressources disponibles ci-dessous.
                  </div>
                )}
              </div>

              {/* Available Section */}
              <div className="pt-6 border-t border-rudore-border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Ressources Disponibles ({availableMembers.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <Filter size={10} className="text-rudore-text/20" />
                    <div className="flex gap-2">
                      {['ALL', Department.DESIGN, Department.TECH, Department.MARKETING, Department.R_AND_D].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setDepartmentFilter(filter as Department | 'ALL')}
                          className={`text-[9px] font-bold uppercase tracking-wider transition-colors border-b hover:border-zinc-500 ${departmentFilter === filter
                            ? 'text-rudore-orange border-rudore-orange'
                            : 'text-rudore-text border-transparent'
                            }`}
                        >
                          {getDeptLabel(filter as Department | 'ALL')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {availableMembers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {availableMembers.map(member => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        actionIcon={Plus}
                        actionColor="text-emerald-500 hover:text-emerald-400 hover:border-emerald-500/50"
                        onAction={() => toggleAssignment(member.id)}
                        onUpdateRole={updateMemberRole}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-rudore-border text-center text-rudore-text text-xs italic">
                    Aucune ressource disponible pour ce filtre.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Column 3: Output */}
        <div className="col-span-3 space-y-4">
          <h3 className="text-xs font-bold text-rudore-text/40 uppercase tracking-[0.2em] mb-6 text-right">Sortie / Objectifs</h3>

          <div className="p-4 border border-dashed border-rudore-border text-right opacity-60">
            <h4 className="text-sm font-bold text-rudore-text uppercase">Lancement MVP</h4>
            <p className="text-xs text-rudore-text/40 uppercase font-mono">Cible : T3 2024</p>
          </div>
          <div className="p-4 border border-dashed border-rudore-border text-right opacity-60">
            <h4 className="text-sm font-bold text-rudore-text uppercase">Fit Marché</h4>
            <p className="text-xs text-rudore-text/40 uppercase font-mono">Phase de Validation</p>
          </div>
        </div>

      </div>
    </div>
  );
};