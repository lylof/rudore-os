"use client";

import React, { useState, useEffect } from 'react';
import { Member, AccessRole } from '../types';
import { Users, Search, Edit2, Save, X } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
  };

  const fetchRoles = async () => {
    const res = await fetch('/api/admin/roles');
    if (res.ok) setRoles(await res.json());
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessRoleId: roleId })
    });


    if (res.ok) {
      fetchUsers();
      setEditingUser(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-header font-bold text-white flex items-center">
          <Users className="mr-2 text-rudore-orange" size={20} />
          Gestion des Utilisateurs
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-rudore-text/50" size={16} />
          <input
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-rudore-panel border border-rudore-border pl-10 pr-4 py-2 text-sm text-white focus:border-rudore-orange outline-none w-64"
          />
        </div>
      </div>

      <div className="bg-rudore-panel border border-rudore-border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-rudore-sidebar/50 text-rudore-text/50 uppercase font-bold text-caption-label">
            <tr>
              <th className="px-6 py-4">Utilisateur</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Rôle Système</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rudore-border">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-rudore-sidebar/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-rudore-sidebar flex items-center justify-center text-xs font-bold text-white border border-rudore-border">
                      {user.avatarInitials}
                    </div>
                    <div>
                      <div className="font-bold text-white">{user.name}</div>
                      <div className="text-caption-label text-rudore-text/40">{user.role}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-rudore-text/60 font-mono text-caption-label">{user.email}</td>
                <td className="px-6 py-4">
                  {editingUser === user.id ? (
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value)}
                      className="bg-rudore-panel border border-rudore-border px-2 py-1 text-white text-xs focus:border-rudore-orange outline-none"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 badge-rounded text-xs font-medium
                      ${user.accessRoleId === 'admin'
                        ? 'bg-rudore-orange/10 text-rudore-orange border border-rudore-orange/20'
                        : 'bg-rudore-sidebar text-rudore-text/40 border border-rudore-border'}
                    `}>
                      {roles.find(r => r.id === user.accessRoleId)?.name || 'Inconnu'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {editingUser === user.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleRoleChange(user.id, selectedRole)}
                        className="p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="p-1.5 bg-rudore-sidebar text-rudore-text hover:bg-rudore-border"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingUser(user.id); setSelectedRole(user.accessRoleId || ''); }}
                      className="p-1.5 text-rudore-text hover:text-rudore-orange hover:bg-rudore-sidebar transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
