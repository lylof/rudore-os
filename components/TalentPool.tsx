"use client";

import React, { useState, useMemo, useDeferredValue } from 'react';
import { Member, Skill, Department } from '../types';
import { Zap, Battery, BatteryMedium, BatteryLow, Search } from 'lucide-react';

interface TalentPoolProps {
  members: Member[];
}

const AvailabilityBadge = ({ value }: { value: number }) => {
  let icon = <BatteryLow size={14} className="text-red-500" />;
  let textClass = 'text-red-500';
  let text = 'Occupé';

  if (value >= 80) {
    icon = <Battery size={14} className="text-emerald-500" />;
    textClass = 'text-emerald-500';
    text = 'Dispo';
  } else if (value >= 40) {
    icon = <BatteryMedium size={14} className="text-yellow-500" />;
    textClass = 'text-yellow-500';
    text = 'Partiel';
  }

  return (
    <div className={`flex items-center space-x-1 border border-rudore-border bg-rudore-sidebar px-2 py-1 badge-rounded ${textClass}`}>
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-wider">{text} ({value}%)</span>
    </div>
  );
};

const SkillRow: React.FC<{ skill: Skill }> = ({ skill }) => (
  <div className="flex justify-between items-center text-[10px]">
    <span className="text-rudore-text/40 font-mono">{skill.name}</span>
    <div className="flex space-x-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1 h-2 ${i <= skill.level ? 'bg-rudore-orange' : 'bg-rudore-border'}`}
        />
      ))}
    </div>
  </div>
);

export const TalentPool: React.FC<TalentPoolProps> = ({ members }) => {
  const [filter, setFilter] = useState<'ALL' | Department>('ALL');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const filteredMembers = useMemo(() => {
    const lowerSearch = deferredSearch.toLowerCase();
    return members.filter(m => {
      const matchesFilter = filter === 'ALL' ? true : m.department === filter;
      const matchesSearch = m.name.toLowerCase().includes(lowerSearch) || m.role.toLowerCase().includes(lowerSearch);
      return matchesFilter && matchesSearch;
    });
  }, [members, filter, deferredSearch]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-header text-3xl font-bold text-rudore-text uppercase tracking-widest">Vivier de Talents</h2>
          <p className="text-rudore-text/40 font-mono text-xs mt-1 uppercase">Expertises et polyvalence des membres</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative text-rudore-text/20 focus-within:text-rudore-orange transition-colors">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} />
            <input
              type="text"
              placeholder="Trouver un membre..."
              className="pl-10 pr-4 py-2 bg-rudore-panel border border-rudore-border focus:border-rudore-orange focus:outline-none text-xs text-rudore-text placeholder-rudore-text/50 transition-colors w-full md:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-rudore-text/20 font-mono border-l border-rudore-border pl-4">
            <span>Total: {filteredMembers.length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-rudore-border scrollbar-hide">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all ${filter === 'ALL' ? 'text-rudore-panel bg-rudore-text border border-rudore-text' : 'text-rudore-text/40 hover:text-rudore-orange border border-rudore-border hover:border-rudore-orange'}`}
        >
          Tous
        </button>
        {Object.values(Department).map(dept => (
          <button
            key={dept}
            onClick={() => setFilter(dept as Department)}
            className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all whitespace-nowrap ${filter === dept ? 'bg-rudore-text text-rudore-panel border border-rudore-text' : 'text-rudore-text/40 hover:text-rudore-orange border border-rudore-border hover:border-rudore-orange'}`}
          >
            {dept}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMembers.map((member) => (
          <div key={member.id} className="bg-rudore-panel border border-rudore-border hover:border-rudore-orange/40 transition-all p-0 group flex flex-col h-full shadow-lg">
            {/* Header / Avatar */}
            <div className="p-4 flex items-center space-x-4 border-b border-rudore-border bg-rudore-panel">
              <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center font-bold text-sm ${member.isLead ? 'bg-rudore-sidebar text-white border border-rudore-border shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-rudore-sidebar text-rudore-text border border-rudore-border'}`}>
                {member.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <h3 className="text-rudore-text font-bold uppercase tracking-wide truncate">{member.name}</h3>
                    {member.hasLPT && (
                      <div className="flex items-center gap-1 px-1 py-0.5 bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)] shrink-0">
                        <span className="text-[7px] font-black text-black uppercase tracking-tighter">LPT Node</span>
                      </div>
                    )}
                  </div>
                  {member.isLead && <Zap size={12} className="text-rudore-orange fill-rudore-orange shrink-0" />}
                </div>
                <p className="text-[10px] text-rudore-text/40 uppercase font-mono truncate">{member.role}</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 flex-1">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] px-2 py-0.5 border border-rudore-border bg-rudore-sidebar text-rudore-text uppercase tracking-wider badge-rounded">
                  {member.department}
                </span>
                <AvailabilityBadge value={member.availability} />
              </div>

              <div className="space-y-2 bg-rudore-sidebar/30 p-2 border border-rudore-border">
                <p className="text-[9px] uppercase font-bold text-rudore-text tracking-widest mb-1 border-b border-rudore-border pb-1">Compétences</p>
                <div className="space-y-1.5">
                  {member.skills.map((skill, idx) => (
                    <SkillRow key={idx} skill={skill} />
                  ))}
                </div>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="p-3 bg-rudore-sidebar/50 border-t border-rudore-border flex justify-between items-center">
              <div className="text-[10px] text-rudore-text">
                <span className="font-bold text-rudore-orange">{member.wallet.currentMonthPoints} pts</span> ce mois-ci
              </div>
              <div className="text-[10px] text-rudore-text font-mono">
                Lifetime: {member.wallet.totalPoints}
              </div>
            </div>

            {/* Footer Action */}
            <div className="border-t border-rudore-border p-2">
              <button className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-rudore-text hover:text-rudore-orange hover:bg-rudore-sidebar transition-colors cursor-pointer">
                Voir les compétences
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 border border-dashed border-rudore-border text-rudore-text text-sm">
          Aucun membre ne correspond à votre recherche.
        </div>
      )}
    </div>
  );
};