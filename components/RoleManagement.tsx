"use client";

import React, { useState, useEffect } from 'react';
import { AccessRole, Permission } from '../types';
import { Shield, Plus, Trash2, Edit2, Save, X, Check } from 'lucide-react';

const PERMISSIONS: { key: Permission; label: string }[] = [
  { key: 'VIEW_DASHBOARD', label: 'Voir Tableau de Bord' },
  { key: 'VIEW_STUDIO', label: 'Voir Studio' },
  { key: 'VIEW_AGENCY', label: 'Voir Agence' },
  { key: 'VIEW_SQUADS', label: 'Voir Squads' },
  { key: 'VIEW_TALENTS', label: 'Voir Talents RH' },
  { key: 'VIEW_CONTRIBUTIONS', label: 'Voir Contributions' },
  { key: 'MANAGE_SETTINGS', label: 'Gérer Paramètres' },
  { key: 'MANAGE_ROLES', label: 'Gérer Rôles' },
  { key: 'MANAGE_USERS', label: 'Gérer Utilisateurs' },
];

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AccessRole>>({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const res = await fetch('/api/admin/roles');
    if (res.ok) setRoles(await res.json());
  };

  const handleSave = async () => {
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editForm)
    });


    if (res.ok) {
      fetchRoles();
      setIsEditing(null);
      setIsCreating(false);
      setEditForm({});
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) return;

    const res = await fetch(`/api/admin/roles/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchRoles();
    } else {
      const err = await res.json();
      alert(err.message);
    }
  };

  const togglePermission = (perm: Permission) => {
    const currentPerms = editForm.permissions || [];
    if (currentPerms.includes(perm)) {
      setEditForm({ ...editForm, permissions: currentPerms.filter(p => p !== perm) });
    } else {
      setEditForm({ ...editForm, permissions: [...currentPerms, perm] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-header font-bold text-white flex items-center">
          <Shield className="mr-2 text-rudore-orange" size={20} />
          Gestion des Rôles
        </h3>
        <button
          onClick={() => { setIsCreating(true); setEditForm({ name: '', permissions: [] }); }}
          className="bg-rudore-sidebar hover:bg-rudore-border text-rudore-text px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border border-rudore-border"
        >
          <Plus size={14} /> Nouveau Rôle
        </button>
      </div>

      <div className="grid gap-4">
        {/* Create Form */}
        {isCreating && (
          <div className="bg-rudore-panel border border-rudore-orange/50 p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-full space-y-3">
                <input
                  placeholder="Nom du rôle"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-rudore-sidebar border border-rudore-border px-3 py-2 w-full text-rudore-text focus:border-rudore-orange outline-none"
                />
                <input
                  placeholder="Description"
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="bg-rudore-sidebar border border-rudore-border px-3 py-2 w-full text-sm text-rudore-text/70 focus:border-rudore-orange outline-none"
                />
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={handleSave} className="p-2 bg-rudore-orange text-white hover:brightness-110"><Save size={16} /></button>
                <button onClick={() => setIsCreating(false)} className="p-2 bg-rudore-sidebar text-rudore-text hover:bg-rudore-border border border-rudore-border"><X size={16} /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PERMISSIONS.map(perm => (
                <button
                  key={perm.key}
                  onClick={() => togglePermission(perm.key)}
                  className={`text-xs p-2 border text-left transition-colors ${editForm.permissions?.includes(perm.key)
                    ? 'bg-rudore-orange/10 border-rudore-orange text-rudore-orange'
                    : 'bg-rudore-sidebar border-rudore-border text-rudore-text/50 hover:border-rudore-orange/50'
                    }`}
                >
                  {perm.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Roles List */}
        {roles.map(role => (
          <div key={role.id} className="bg-rudore-panel border border-rudore-border p-4">
            {isEditing === role.id ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-full space-y-3">
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="bg-rudore-sidebar border border-rudore-border px-3 py-2 w-full text-rudore-text focus:border-rudore-orange outline-none"
                    />
                    <input
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      className="bg-rudore-sidebar border border-rudore-border px-3 py-2 w-full text-sm text-rudore-text/70 focus:border-rudore-orange outline-none"
                    />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={handleSave} className="p-2 bg-rudore-orange text-white hover:brightness-110"><Save size={16} /></button>
                    <button onClick={() => setIsEditing(null)} className="p-2 bg-rudore-sidebar text-rudore-text hover:bg-rudore-border border border-rudore-border"><X size={16} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PERMISSIONS.map(perm => (
                    <button
                      key={perm.key}
                      onClick={() => togglePermission(perm.key)}
                      className={`text-xs p-2 border text-left transition-colors ${editForm.permissions?.includes(perm.key)
                        ? 'bg-rudore-orange/10 border-rudore-orange text-rudore-orange'
                        : 'bg-rudore-sidebar border-rudore-border text-rudore-text/50 hover:border-rudore-orange/50'
                        }`}
                    >
                      {perm.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-rudore-text flex items-center gap-2 uppercase tracking-wide">
                      {role.name}
                      {role.isSystem && <span className="text-caption-label bg-rudore-sidebar text-rudore-text/60 px-1.5 py-0.5 border border-rudore-border uppercase tracking-widest badge-rounded">Système</span>}
                    </h4>
                    <p className="text-sm text-rudore-text/50">{role.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setIsEditing(role.id); setEditForm(role); }}
                      className="p-1.5 text-rudore-text hover:text-rudore-orange hover:bg-rudore-sidebar transition-colors border border-transparent hover:border-rudore-border"
                    >
                      <Edit2 size={16} />
                    </button>
                    {!role.isSystem && (
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="p-1.5 text-rudore-text hover:text-red-500 hover:bg-rudore-sidebar transition-colors border border-transparent hover:border-rudore-border"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {role.permissions.map(p => (
                    <span key={p} className="text-caption-label bg-rudore-sidebar border border-rudore-border text-rudore-text px-2 py-1 badge-rounded uppercase tracking-tight">
                      {PERMISSIONS.find(pm => pm.key === p)?.label || p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
