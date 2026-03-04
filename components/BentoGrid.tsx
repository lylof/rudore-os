"use client";

import React from 'react';
import { Card, Badge } from './ui/Card';
import { Status, Project, Department, Member } from '../types';
import { ArrowUpRight, Activity, Users, DollarSign, ArrowRight, BarChart3, TrendingUp, Clock, Layers, Database } from 'lucide-react';
import { usePointsConfig } from '../context/PointsConfigContext';

interface BentoGridProps {
  projects: Project[];
  members?: Member[];
  onNavigate: (view: string) => void;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ projects = [], members = [], onNavigate }) => {

  const studioProjects = React.useMemo(() => projects.filter(p => p.type === 'STUDIO'), [projects]);
  const agencyProjectsData = React.useMemo(() => projects.filter(p => p.type === 'AGENCY'), [projects]);

  const departments = React.useMemo(() => {
    const getDeptLead = (dept: Department) => {
      const deptMembers = members.filter(m => m.department === dept);
      const lead = deptMembers.find(m => m.isLead) || deptMembers[0];
      return lead ? lead.name : 'À définir';
    };

    const getDeptCount = (dept: Department) => members.filter(m => m.department === dept).length;

    return [
      { name: 'Design', lead: getDeptLead(Department.DESIGN), count: getDeptCount(Department.DESIGN), icon: Layers },
      { name: 'Marketing & Com', lead: getDeptLead(Department.MARKETING), count: getDeptCount(Department.MARKETING), icon: Activity },
      { name: 'Tech & Dév', lead: getDeptLead(Department.TECH), count: getDeptCount(Department.TECH), icon: Database },
      { name: 'R&D', lead: getDeptLead(Department.R_AND_D), count: getDeptCount(Department.R_AND_D), icon: Activity },
    ];
  }, [members]);

  const { config } = usePointsConfig();
  const studioFund = (config.agencyMonthlyRevenue * config.studioFundPercentage) / 100;
  const agencyOps = (config.agencyMonthlyRevenue * config.agencyOpsPercentage) / 100;

  return (
    <div className="grid grid-cols-12 gap-6 pb-10">
      {/* 1. Global Metrics (Top Row) */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1 border-l-4 border-l-rudore-orange">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-card-title text-rudore-text/60">Produits Studio</p>
              <h2 className="text-medium-value text-rudore-text mt-2">
                {studioProjects.length < 10 ? `0${studioProjects.length}` : studioProjects.length}
              </h2>
            </div>
            <Activity className="text-rudore-orange" size={20} />
          </div>
        </Card>

        <Card className="col-span-1 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-card-title text-rudore-text/60">Clients Agence</p>
              <h2 className="text-medium-value text-rudore-text mt-2">
                {agencyProjectsData.length < 10 ? `0${agencyProjectsData.length}` : agencyProjectsData.length}
              </h2>
            </div>
            <Users className="text-emerald-500" size={20} />
          </div>
        </Card>

        {/* 70% Agency Ops */}
        <Card className="col-span-1 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-card-title text-rudore-text/60">Opérations (70%)</p>
              <h2 className="text-medium-value text-rudore-text mt-2">
                {(agencyOps / 1000000).toFixed(1)}M <span className="text-xs text-rudore-text/40 font-sans font-normal lowercase tracking-tight">XOF</span>
              </h2>
            </div>
            <BarChart3 className="text-blue-500" size={20} />
          </div>
        </Card>

        {/* 30% Studio Fund */}
        <Card className="col-span-1 border-l-4 border-l-rudore-orange bg-rudore-orange/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-card-title text-rudore-orange font-bold">Studio Fund (30%)</p>
              <h2 className="text-medium-value text-rudore-text mt-2">
                {(studioFund / 1000000).toFixed(1)}M <span className="text-xs text-rudore-text/40 font-sans font-normal lowercase tracking-tight">XOF</span>
              </h2>
            </div>
            <Activity className="text-rudore-orange" size={20} />
          </div>
        </Card>
      </div>

      {/* 2. Studio Section (Large Left) */}
      <div className="col-span-12 lg:col-span-4 h-full">
        <Card title="Studio // Projets Internes" subtitle="Pipeline de développement" className="h-full group hover:border-rudore-border transition-colors">
          <div className="space-y-4">
            {studioProjects.map((p) => (
              <div
                key={p.id}
                className="group/item flex items-center justify-between p-4 bg-rudore-sidebar/50 border border-rudore-border hover:border-rudore-orange transition-colors cursor-pointer"
                onClick={() => onNavigate('STUDIO')}
              >
                <div>
                  <h4 className="font-bold text-rudore-text group-hover/item:text-rudore-orange transition-colors uppercase tracking-wide">{p.name}</h4>
                  <p className="text-xs text-rudore-text/40 font-mono mt-1">{p.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge status={p.status} />
                  {(() => {
                    const spentRatio = p.financials.budget > 0 ? (p.financials.spent / p.financials.budget) * 100 : 0;
                    if (spentRatio >= 100) {
                      return (
                        <span className="text-caption-label bg-rudore-orange text-white font-black px-1.5 py-0.5 border border-rudore-orange/50 animate-pulse uppercase tracking-tighter">
                          ALERTE : BUDGET DÉPASSÉ
                        </span>
                      );
                    }
                    if (spentRatio >= 80) {
                      return (
                        <span className="text-caption-label bg-yellow-600 text-white font-black px-1.5 py-0.5 border border-yellow-400 uppercase tracking-tighter">
                          ⚠ ATTENTION : {spentRatio.toFixed(0)}% DU BUDGET
                        </span>
                      );
                    }
                    return null;
                  })()}
                  <span className="text-caption-label text-rudore-text/30 uppercase font-mono tracking-tighter">Lead: {p.leadId}</span>
                </div>
              </div>
            ))}
            <button
              onClick={() => onNavigate('STUDIO')}
              className="w-full py-3 mt-4 border border-dashed border-rudore-border text-xs text-rudore-text/40 hover:text-rudore-orange hover:border-rudore-orange uppercase tracking-widest transition-colors"
            >
              + Nouvel Incubateur
            </button>
          </div>
        </Card>
      </div>

      {/* 3. Agency Section (Mid) */}
      <div className="col-span-12 lg:col-span-4 h-full">
        <Card title="Agence // Projets Clients" subtitle="Suivi des livrables" className="h-full group hover:border-rudore-orange/50 transition-colors cursor-pointer" onClick={() => onNavigate('AGENCY')}>
          <div className="space-y-6">
            {agencyProjectsData.map((project, idx) => {
              const progress = project.financials.budget > 0 ? (project.financials.spent / project.financials.budget) * 100 : 0;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-rudore-text font-bold uppercase tracking-tight">{project.name}</span>
                    <span className="text-rudore-orange text-xs font-mono">{project.status}</span>
                  </div>
                  <div className="w-full bg-rudore-sidebar h-1 overflow-hidden">
                    <div
                      className="bg-rudore-text/20 h-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 pt-6 border-t border-rudore-border">
            <h4 className="text-caption-label font-mono text-rudore-text/40 mb-4 uppercase tracking-[0.2em]">Factures Récentes</h4>
            <div className="flex justify-between items-center text-xs text-rudore-text/60 mb-3 hover:text-rudore-text transition-colors cursor-pointer group">
              <span className="group-hover:text-rudore-orange transition-colors font-mono">INV-2024-001</span>
              <span className="text-rudore-text uppercase tracking-widest text-caption-label font-bold">Payé</span>
            </div>
            <div className="flex justify-between items-center text-xs text-rudore-text/60 hover:text-rudore-text transition-colors cursor-pointer group">
              <span className="group-hover:text-rudore-orange transition-colors font-mono">INV-2024-002</span>
              <span className="text-rudore-orange font-bold uppercase text-caption-label tracking-wider px-2 py-0.5 border border-rudore-orange/30 bg-rudore-orange/10 badge-rounded">En attente</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Resources / Matrix (Right) */}
      <div className="col-span-12 lg:col-span-4 h-full">
        <Card title="Effectifs" subtitle="Disponibilité par pôle" className="h-full">
          <div className="grid grid-cols-2 gap-4">
            {departments.map((dept, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate('TALENTS')}
                className="aspect-square bg-rudore-sidebar/50 border border-rudore-border p-4 flex flex-col justify-between hover:bg-rudore-sidebar hover:border-rudore-orange transition-all cursor-pointer group"
              >
                <div className="flex justify-between">
                  <dept.icon size={20} className="text-rudore-text/20 group-hover:text-rudore-orange transition-colors" />
                  <ArrowUpRight size={16} className="text-rudore-text/20 group-hover:text-rudore-text transition-colors transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-rudore-text group-hover:text-rudore-orange transition-colors">{dept.count}</div>
                  <div className="text-caption-label uppercase font-bold tracking-[0.2em] text-rudore-text/40 mt-1">{dept.name}</div>
                  <div className="text-caption-label text-rudore-text/20 font-mono mt-2 lowercase">lead: {dept.lead}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 5. Matrix Snapshot (Bottom) */}
      <div className="col-span-12 mt-2">
        <Card noPadding className="bg-rudore-panel border-rudore-border hover:border-rudore-orange/50 transition-colors">
          <div className="p-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-header font-bold text-rudore-text uppercase tracking-widest">
                Structure des Équipes
              </h3>
              <p className="text-rudore-text/50 text-sm mt-2 max-w-md">
                Gérez l'affectation des membres entre le Studio et l'Agence via nos squads dynamiques.
              </p>
            </div>
            <button
              onClick={() => onNavigate('SQUADS')}
              className="px-6 py-3 bg-rudore-orange text-white font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all border border-rudore-orange shadow-sm"
            >
              Gérer les équipes
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};