"use client";

import React from 'react';
import { LayoutDashboard, Rocket, Briefcase, Users, Layers, Settings, LogOut, Hexagon, UserCheck, Trophy, User, X } from 'lucide-react';
import { ViewState } from '../types';
import { useFeatureFlags } from '../context/FeatureFlagContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NavItem = ({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: React.ElementType,
  label: string,
  active: boolean,
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    aria-label={label}
    className={`
      w-full flex items-center space-x-3 px-4 py-3 transition-colors border-l-2
      ${active
        ? 'border-rudore-orange text-white dark:text-white bg-black/10 dark:bg-white/5'
        : 'border-transparent text-rudore-text/60 hover:text-white dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}
      text-caption-label
    `}
  >
    <Icon size={18} className={active ? 'text-rudore-orange' : ''} />
    <span>{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose }) => {
  const { flags } = useFeatureFlags();
  const { user, logout, hasPermission } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 xl:hidden backdrop-blur-sm animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`
          fixed left-0 top-0 h-[100dvh] w-64 bg-rudore-sidebar flex flex-col z-50 text-rudore-text transition-transform duration-300 ease-in-out
          xl:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-rudore-border/10 shrink-0">
          <div className="flex items-center space-x-2">
            <Hexagon className="text-rudore-orange" size={24} strokeWidth={1.5} />
            <span className="font-header text-xl font-bold tracking-[0.2em] text-black dark:text-white">RUDORE</span>
          </div>
          <button onClick={onClose} className="xl:hidden text-rudore-text/60 hover:text-white dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 space-y-1 overflow-y-auto scrollbar-hide">
          {flags.ENABLE_DASHBOARD && hasPermission('DASHBOARD') && (
            <NavItem
              icon={LayoutDashboard}
              label="Tableau de Bord"
              active={currentView === 'DASHBOARD'}
              onClick={() => { onChangeView('DASHBOARD'); onClose(); }}
            />
          )}
          {flags.ENABLE_STUDIO && hasPermission('STUDIO') && (
            <NavItem
              icon={Rocket}
              label="Studio"
              active={currentView === 'STUDIO'}
              onClick={() => { onChangeView('STUDIO'); onClose(); }}
            />
          )}
          {flags.ENABLE_AGENCY && hasPermission('AGENCY') && (
            <NavItem
              icon={Briefcase}
              label="Agence"
              active={currentView === 'AGENCY'}
              onClick={() => { onChangeView('AGENCY'); onClose(); }}
            />
          )}
          {flags.ENABLE_SQUADS && hasPermission('SQUADS') && (
            <NavItem
              icon={Users}
              label="Squads"
              active={currentView === 'SQUADS'}
              onClick={() => { onChangeView('SQUADS'); onClose(); }}
            />
          )}
          {flags.ENABLE_TALENTS && hasPermission('TALENTS') && (
            <NavItem
              icon={UserCheck}
              label="Talents RH"
              active={currentView === 'TALENTS'}
              onClick={() => { onChangeView('TALENTS'); onClose(); }}
            />
          )}
          {flags.ENABLE_CONTRIBUTIONS && hasPermission('CONTRIBUTIONS') && (
            <NavItem
              icon={Trophy}
              label="Contributions"
              active={currentView === 'CONTRIBUTIONS'}
              onClick={() => { onChangeView('CONTRIBUTIONS'); onClose(); }}
            />
          )}
          {flags.ENABLE_KANBAN && hasPermission('KANBAN') && (
            <NavItem
              icon={Layers}
              label="Gestion Projet"
              active={currentView === 'KANBAN'}
              onClick={() => { onChangeView('KANBAN'); onClose(); }}
            />
          )}

          <div className="pt-8 mt-8 border-t border-rudore-border">
            <NavItem
              icon={User}
              label="Mon Profil"
              active={currentView === 'PROFILE'}
              onClick={() => { onChangeView('PROFILE'); onClose(); }}
            />
            {hasPermission('SETTINGS') && (
              <NavItem
                icon={Settings}
                label="Paramètres"
                active={currentView === 'SETTINGS'}
                onClick={() => { onChangeView('SETTINGS'); onClose(); }}
              />
            )}
          </div>
        </nav>

        {/* Footer / Profile */}
        <div className="p-6 border-t border-rudore-border bg-rudore-sidebar shrink-0">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-rudore-panel flex items-center justify-center text-rudore-orange font-bold border border-rudore-border shrink-0">
                  {user.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white uppercase truncate" title={user.name}>{user.name}</div>
                  <div className="text-caption-label text-rudore-text font-mono truncate" title={user.role}>{user.role}</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-rudore-text hover:text-rudore-orange transition-colors p-1"
                aria-label="Se déconnecter"
                title="Déconnexion"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="text-center text-xs text-rudore-text">Non connecté</div>
          )}

          <div className="text-caption-label text-rudore-text/50 uppercase tracking-widest text-center border-t border-rudore-border pt-4 mt-4">
            Du Brut au Rare
          </div>
        </div>
      </aside>
    </>
  );
};