import React, { useState } from 'react';
import { useFeatureFlags, FeatureKey } from '../context/FeatureFlagContext';
import { useAuth } from '../context/AuthContext';
import { ToggleLeft, ToggleRight, RotateCcw } from 'lucide-react';
import { PointsConfigPanel } from './Kanban/PointsConfigPanel';
import { UserManagement } from './UserManagement';
import { RoleManagement } from './RoleManagement';

const FEATURE_LABELS: Record<FeatureKey, string> = {
  ENABLE_DASHBOARD: 'Tableau de Bord',
  ENABLE_STUDIO: 'Studio',
  ENABLE_AGENCY: 'Agence',
  ENABLE_SQUADS: 'Squads',
  ENABLE_TALENTS: 'Talents RH',
  ENABLE_CONTRIBUTIONS: 'Contributions',
  ENABLE_KANBAN: 'Gestion de Projet',
};

export const Settings: React.FC = () => {
  const { flags, toggleFlag, resetFlags } = useFeatureFlags();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'FEATURES' | 'USERS' | 'ROLES' | 'POINTS'>('FEATURES');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-rudore-border pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('FEATURES')}
          className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'FEATURES' ? 'border-rudore-orange text-rudore-text' : 'border-transparent text-rudore-text/30 hover:text-rudore-text'}`}
        >
          Fonctionnalités
        </button>
        {user?.isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('USERS')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'USERS' ? 'border-rudore-orange text-rudore-text' : 'border-transparent text-rudore-text/30 hover:text-rudore-text'}`}
            >
              Utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('ROLES')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'ROLES' ? 'border-rudore-orange text-rudore-text' : 'border-transparent text-rudore-text/30 hover:text-rudore-text'}`}
            >
              Rôles & Permissions
            </button>
            <button
              onClick={() => setActiveTab('POINTS')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'POINTS' ? 'border-rudore-orange text-rudore-text' : 'border-transparent text-rudore-text/30 hover:text-rudore-text'}`}
            >
              Configuration Points
            </button>
          </>
        )}
      </div>

      {activeTab === 'FEATURES' && (
        <div className="bg-rudore-panel border border-rudore-border p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-header font-bold text-rudore-text mb-2 uppercase tracking-tight">Feature Flags</h2>
              <p className="text-rudore-text/50 text-sm uppercase font-mono">
                Gérez l'activation des modules de l'application en temps réel.
              </p>
            </div>
            <button
              onClick={resetFlags}
              className="flex items-center space-x-2 px-4 py-2 bg-rudore-sidebar hover:bg-rudore-text hover:text-rudore-panel text-rudore-text/40 transition-all text-sm font-bold uppercase tracking-widest border border-rudore-border"
            >
              <RotateCcw size={16} />
              <span>Réinitialiser</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(Object.keys(flags) as FeatureKey[]).map((key) => (
              <div
                key={key}
                className={`
                  flex items-center justify-between p-4 border transition-all duration-300
                  ${flags[key]
                    ? 'bg-rudore-sidebar border-rudore-orange shadow-[5px_5px_0px_rgba(252,83,42,0.1)]'
                    : 'bg-rudore-panel border-rudore-border opacity-50'}
                `}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-rudore-text uppercase tracking-widest text-sm">
                    {FEATURE_LABELS[key]}
                  </span>
                  <span className="text-[10px] text-rudore-text/30 font-mono mt-1 lowercase">
                    {key}
                  </span>
                </div>

                <button
                  onClick={() => toggleFlag(key)}
                  className={`transition-all duration-300 ${flags[key] ? 'text-rudore-orange' : 'text-rudore-text/10'}`}
                >
                  {flags[key] ? <ToggleRight size={48} strokeWidth={1} /> : <ToggleLeft size={48} strokeWidth={1} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'USERS' && user?.isAdmin && <UserManagement />}
      {activeTab === 'ROLES' && user?.isAdmin && <RoleManagement />}
      {activeTab === 'POINTS' && user?.isAdmin && (
        <div className="bg-rudore-panel border border-rudore-border p-8">
          <PointsConfigPanel />
        </div>
      )}
    </div>
  );
};

