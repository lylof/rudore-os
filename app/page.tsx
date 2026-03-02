"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { BentoGrid } from '@/components/BentoGrid';
import { SquadMatrix } from '@/components/SquadMatrix';
import { TalentPool } from '@/components/TalentPool';
import { ProjectHub } from '@/components/ProjectHub';
import { Contributions } from '@/components/Contributions';
import { Settings } from '@/components/Settings';
import { Profile } from '@/components/Profile';
import { Login } from '@/components/auth/Login';
import { Register } from '@/components/auth/Register';
import { KanbanBoard } from '@/components/Kanban/KanbanBoard';
import { ViewState, Member, Project } from '@/types';
import { useFeatureFlags } from '@/context/FeatureFlagContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Menu, Sun, Moon } from 'lucide-react';

export default function Page() {
    const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { flags } = useFeatureFlags();
    const { isAuthenticated, hasPermission } = useAuth();
    const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

    // MIGRATION: Vraies Données desde la Base
    const [members, setMembers] = useState<Member[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    // Redirect if current view is disabled or unauthorized
    useEffect(() => {
        if (currentView === 'DASHBOARD' && (!flags.ENABLE_DASHBOARD || !hasPermission('DASHBOARD'))) setCurrentView('PROFILE');
        if (currentView === 'STUDIO' && (!flags.ENABLE_STUDIO || !hasPermission('STUDIO'))) setCurrentView('PROFILE');
        if (currentView === 'AGENCY' && (!flags.ENABLE_AGENCY || !hasPermission('AGENCY'))) setCurrentView('PROFILE');
        if (currentView === 'SQUADS' && (!flags.ENABLE_SQUADS || !hasPermission('SQUADS'))) setCurrentView('PROFILE');
        if (currentView === 'TALENTS' && (!flags.ENABLE_TALENTS || !hasPermission('TALENTS'))) setCurrentView('PROFILE');
        if (currentView === 'CONTRIBUTIONS' && (!flags.ENABLE_CONTRIBUTIONS || !hasPermission('CONTRIBUTIONS'))) setCurrentView('PROFILE');
        if (currentView === 'KANBAN' && (!flags.ENABLE_KANBAN || !hasPermission('KANBAN'))) setCurrentView('PROFILE');
        if (currentView === 'SETTINGS' && !hasPermission('SETTINGS')) setCurrentView('PROFILE');
    }, [flags, currentView, hasPermission]);

    // Data Fetching Logic
    useEffect(() => {
        if (!isAuthenticated) return;

        let isMounted = true;
        setIsDataLoading(true);
        setDataError(null);

        const fetchCriticalData = async () => {
            try {
                const [membersRes, projectsRes] = await Promise.all([
                    fetch('/api/members'),
                    fetch('/api/projects')
                ]);

                if (!membersRes.ok || !projectsRes.ok) throw new Error("Failed to load global data streams.");

                const membersData = await membersRes.json();
                const projectsData = await projectsRes.json();

                if (isMounted) {
                    setMembers(membersData.members || []);
                    setProjects(projectsData.projects || []);
                    setIsDataLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error("[ORCHESTRATOR ERROR]", err);
                    setDataError("System Critical Error: Data nodes unreachable.");
                    setIsDataLoading(false);
                }
            }
        };

        fetchCriticalData();

        return () => { isMounted = false; };
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return authView === 'LOGIN'
            ? <Login onRegisterClick={() => setAuthView('REGISTER')} />
            : <Register onLoginClick={() => setAuthView('LOGIN')} />;
    }

    const renderContent = () => {
        // Global Loading Skeleton
        if (isDataLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-8 animate-pulse">
                    <div className="w-16 h-16 border-4 border-rudore-border border-t-rudore-orange rounded-full animate-spin"></div>
                    <div className="flex flex-col items-center gap-2">
                        <h2 className="text-2xl font-header font-black uppercase tracking-[0.3em] text-rudore-text/40">Synchronisation Mainframe</h2>
                        <p className="text-rudore-text/20 font-mono text-[10px] uppercase tracking-widest border border-rudore-border/50 p-4">Fetching core entities from Neon Node...</p>
                    </div>
                </div>
            );
        }

        // Global Error State
        if (dataError) {
            return (
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <p className="text-red-500 font-mono text-sm uppercase border border-red-500/20 bg-red-500/5 p-4">{dataError}</p>
                </div>
            );
        }

        switch (currentView) {
            case 'DASHBOARD':
                return flags.ENABLE_DASHBOARD && hasPermission('DASHBOARD') ? <BentoGrid projects={projects} members={members} onNavigate={(view) => setCurrentView(view as ViewState)} /> : null;
            case 'SQUADS':
                return flags.ENABLE_SQUADS && hasPermission('SQUADS') ? <SquadMatrix members={members} /> : null;
            case 'TALENTS':
                return flags.ENABLE_TALENTS && hasPermission('TALENTS') ? <TalentPool members={members} /> : null;
            case 'CONTRIBUTIONS':
                return flags.ENABLE_CONTRIBUTIONS && hasPermission('CONTRIBUTIONS') ? <Contributions members={members} /> : null;
            case 'STUDIO':
                return flags.ENABLE_STUDIO && hasPermission('STUDIO') ? <ProjectHub projects={projects.filter(p => p.type === 'STUDIO')} members={members} type="STUDIO" /> : null;
            case 'AGENCY':
                return flags.ENABLE_AGENCY && hasPermission('AGENCY') ? <ProjectHub projects={projects.filter(p => p.type === 'AGENCY')} members={members} type="AGENCY" /> : null;
            case 'KANBAN':
                return flags.ENABLE_KANBAN && hasPermission('KANBAN') ? <KanbanBoard members={members} projects={projects} /> : null;
            case 'SETTINGS':
                return hasPermission('SETTINGS') ? <Settings /> : null;
            case 'PROFILE':
                return <Profile />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-rudore-black text-rudore-light flex font-sans selection:bg-rudore-orange selection:text-black">
            <Sidebar
                currentView={currentView}
                onChangeView={setCurrentView}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-1 lg:ml-64 p-4 lg:p-12 overflow-y-auto h-screen w-full transition-all duration-300">
                {/* Top Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 lg:mb-16 gap-6 relative z-10">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden text-rudore-text/60 hover:text-white p-3 border border-rudore-border bg-rudore-sidebar shrink-0 shadow-sm active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-4xl lg:text-6xl font-header font-black text-rudore-text uppercase tracking-[-0.02em] leading-[0.85] mb-4">
                                {currentView === 'DASHBOARD' ? 'Nexus View' :
                                    currentView === 'TALENTS' ? 'Core Resources' :
                                        currentView === 'CONTRIBUTIONS' ? 'Action Ledger' :
                                            currentView === 'KANBAN' ? 'Operations' :
                                                currentView === 'SETTINGS' ? 'System Prefs' :
                                                    currentView === 'PROFILE' ? 'Identity Node' :
                                                        currentView}
                            </h1>
                            <div className="flex items-center gap-3">
                                <div className="h-[2px] w-12 bg-rudore-orange"></div>
                                <p className="text-rudore-text/20 font-mono text-[9px] uppercase tracking-[0.5em] hidden sm:block">
                                    NODE_STATUS: <span className="text-rudore-orange/60 font-black">STABLE_V4.2</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-0 ml-auto sm:ml-0 bg-rudore-panel shadow-sm border border-rudore-border">
                        <div className="text-right hidden md:block px-4 py-2 border-r border-rudore-border">
                            <p className="text-[10px] font-black text-rudore-text uppercase tracking-[0.2em] mb-0.5">LOC_TGO</p>
                            <p className="text-[9px] text-rudore-text/40 font-mono uppercase">{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                        </div>
                        <ThemeToggle />
                        <button className="w-12 h-12 border-l border-rudore-border bg-transparent flex items-center justify-center text-rudore-text/40 hover:bg-rudore-orange hover:text-white transition-all">
                            <span className="text-xl font-black font-header">?</span>
                        </button>
                    </div>
                </header>

                {/* Dynamic Content */}
                {renderContent()}
            </main>
        </div>
    );
}

// Theme toggle button component
const ThemeToggle: React.FC = () => {
    const { toggleTheme, isDark } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className={`w-12 h-12 flex items-center justify-center transition-all border-l border-black/10 dark:border-white/10
        ${isDark
                    ? 'text-rudore-orange hover:bg-white hover:text-black'
                    : 'text-rudore-orange hover:bg-black hover:text-white'}`}
            title={isDark ? 'LIGHT_MODE' : 'DARK_MODE'}
        >
            {isDark ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
        </button>
    );
}
