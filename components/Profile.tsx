"use client";

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Briefcase, GraduationCap, Award, Edit2, Save, X, Plus, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { Skill } from '../types';

export const Profile: React.FC = () => {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: user?.role || '',
    academicRole: user?.academicRole || '',
    bio: user?.bio || '',
    skills: user?.skills || []
  });
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<number>(1);

  if (!user) return null;

  const handleSave = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        login(data.user);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile', error);
    }
  };

  const promoteToAdmin = async () => {
    try {
      const response = await fetch('/api/debug/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        login(data.user);
        alert("Succès ! Vous êtes maintenant Administrateur. Vous avez accès aux Paramètres.");
        // Optional: Redirect to settings or just let them navigate
        // window.location.reload(); 
      } else {
        if (response.status === 401) {
          alert("Session expirée. Veuillez vous reconnecter.");
          // Force logout
          window.location.href = '/login';
          return;
        }
        const err = await response.text();
        console.error('Promotion failed:', err);
        alert("Erreur lors de la promotion: " + response.statusText);
      }
    } catch (error) {
      console.error('Failed to promote user', error);
      alert("Erreur réseau ou serveur.");
    }
  };

  const addSkill = () => {
    if (newSkill && !formData.skills.find(s => s.name === newSkill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { name: newSkill, level: newSkillLevel as 1 | 2 | 3 | 4 | 5 }]
      });
      setNewSkill('');
      setNewSkillLevel(1);
    }
  };

  const removeSkill = (skillName: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s.name !== skillName)
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Card */}
      <div className="bg-rudore-panel border border-rudore-border p-8 relative overflow-hidden shadow-sm">
        {/* Removed the large background block decoration that looked like a glitch */}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-rudore-sidebar border-2 border-rudore-orange flex items-center justify-center text-3xl font-bold text-rudore-text shadow-md relative">
              {user.avatarInitials}
              {user.isAdmin && (
                <div className="absolute -top-2 -right-2 bg-rudore-orange text-white p-1 shadow-sm border-2 border-rudore-panel" title="Administrateur">
                  <Shield size={16} fill="currentColor" />
                </div>
              )}
            </div>
            <div>
              {isEditing ? (
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-rudore-sidebar border border-rudore-border px-3 py-1 text-2xl font-header font-bold text-rudore-text mb-1 w-full"
                />
              ) : (
                <h1 className="text-3xl font-header font-bold text-rudore-text tracking-wide uppercase">{user.name}</h1>
              )}

              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center text-rudore-orange font-medium">
                  <Briefcase size={16} className="mr-2" />
                  {isEditing ? (
                    <input
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="bg-rudore-sidebar border border-rudore-border px-2 py-0.5 text-sm w-48 text-rudore-text focus:outline-none focus:border-rudore-orange"
                      placeholder="Rôle chez Rider"
                    />
                  ) : (
                    <span className="uppercase tracking-widest text-[11px] font-bold">{user.role}</span>
                  )}
                </div>
                <div className="flex items-center text-rudore-text/40 text-sm">
                  <GraduationCap size={16} className="mr-2" />
                  {isEditing ? (
                    <input
                      value={formData.academicRole}
                      onChange={(e) => setFormData({ ...formData, academicRole: e.target.value })}
                      className="bg-rudore-sidebar border border-rudore-border px-2 py-0.5 text-sm w-48 text-rudore-text"
                      placeholder="Parcours académique"
                    />
                  ) : (
                    <span>{user.academicRole || 'Non spécifié'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!user.isAdmin && (
              <button
                onClick={promoteToAdmin}
                className="flex items-center gap-2 px-4 py-2 font-bold text-sm uppercase tracking-wider bg-rudore-sidebar text-rudore-text/40 border border-rudore-border hover:border-rudore-orange hover:text-rudore-orange transition-all"
                title="Mode Développeur : Devenir Admin"
              >
                <AlertTriangle size={16} /> Admin (Debug)
              </button>
            )}
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`
                flex items-center gap-2 px-4 py-2 font-bold text-sm uppercase tracking-wider transition-all
                ${isEditing
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/50 hover:bg-emerald-500/20'
                  : 'bg-rudore-orange text-white border border-rudore-orange hover:bg-white hover:text-rudore-orange'}
              `}
            >
              {isEditing ? <><Save size={16} /> Enregistrer</> : <><Edit2 size={16} /> Modifier</>}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Bio Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-rudore-panel border border-rudore-border p-6">
            <h3 className="text-lg font-header font-bold text-rudore-text mb-4 flex items-center uppercase tracking-widest">
              <User size={20} className="mr-2 text-rudore-orange" />
              Bio & Parcours
            </h3>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full h-32 bg-rudore-sidebar border border-rudore-border p-3 text-rudore-text focus:border-rudore-orange focus:outline-none resize-none font-sans"
                placeholder="Racontez votre histoire..."
              />
            ) : (
              <p className="text-rudore-text/50 leading-relaxed font-sans">
                {user.bio || "Aucune biographie renseignée."}
              </p>
            )}
          </div>

          {/* Stats / Wallet (Read Only) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-rudore-sidebar border border-rudore-border p-4">
              <div className="text-rudore-text/30 text-[10px] uppercase font-bold tracking-widest mb-1">Points Totaux</div>
              <div className="text-2xl font-mono font-bold text-rudore-text">{user.wallet.totalPoints.toLocaleString()}</div>
            </div>
            <div className="bg-rudore-sidebar border border-rudore-border p-4">
              <div className="text-rudore-text/30 text-[10px] uppercase font-bold tracking-widest mb-1">Equity Estimée</div>
              <div className="text-2xl font-mono font-bold text-emerald-500">{user.wallet.equityValue.toLocaleString()} XOF</div>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="bg-rudore-panel border border-rudore-border p-6 h-fit">
          <h3 className="text-lg font-header font-bold text-rudore-text mb-4 flex items-center uppercase tracking-widest">
            <Award size={20} className="mr-2 text-rudore-orange" />
            Compétences
          </h3>

          <div className="space-y-3">
            {formData.skills.map((skill, idx) => (
              <div key={idx} className="group flex items-center justify-between bg-rudore-sidebar p-2 border border-rudore-border hover:border-rudore-orange transition-colors">
                <div>
                  <div className="font-bold text-sm text-rudore-text uppercase tracking-tight">{skill.name}</div>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((l) => (
                      <div key={l} className={`w-2 h-1 ${l <= skill.level ? 'bg-rudore-orange' : 'bg-rudore-border'}`} />
                    ))}
                  </div>
                </div>
                {isEditing && (
                  <button onClick={() => removeSkill(skill.name)} className="text-rudore-text/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}

            {isEditing && (
              <div className="mt-4 pt-4 border-t border-rudore-border flex gap-2">
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Nouvelle compétence"
                  className="bg-rudore-sidebar border border-rudore-border px-2 py-1 text-xs w-full text-rudore-text"
                />
                <select
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(Number(e.target.value))}
                  className="bg-rudore-sidebar border border-rudore-border px-1 py-1 text-xs text-rudore-text"
                >
                  {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button onClick={addSkill} className="bg-rudore-orange text-white p-1 hover:brightness-110 transition-all">
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
