"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Hexagon, User, Mail, Lock, Briefcase, GraduationCap, FileText, ArrowLeft, Loader } from 'lucide-react';

interface RegisterProps {
  onLoginClick: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onLoginClick }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '', // Rider Role
    academicRole: '', // External/Student Role
    bio: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Erreur lors de la création du compte');
        return;
      }

      login(data.user);
    } catch (err: any) {
      console.error('Network error during registration:', err);
      setError('Erreur réseau ou serveur indisponible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rudore-app p-4 py-12 font-sans">
      <div className="w-full max-w-2xl bg-rudore-panel border border-rudore-border p-10 shadow-[20px_20px_0px_rgba(252,83,42,0.1)] relative overflow-hidden">

        <button onClick={onLoginClick} className="absolute top-8 left-8 text-rudore-text/30 hover:text-rudore-text transition-colors flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest">
          <ArrowLeft size={14} />
          <span>Annuler</span>
        </button>

        <div className="flex flex-col items-center mb-10 mt-6 relative z-10">
          <Hexagon className="text-rudore-orange fill-rudore-orange/10 mb-6" size={56} strokeWidth={1} />
          <h1 className="text-3xl font-header font-black text-rudore-text tracking-[0.2em] uppercase">Provisionning Profil</h1>
          <p className="text-rudore-text/40 text-[11px] mt-4 text-center max-w-md uppercase tracking-wider leading-relaxed">
            Configurez votre node au sein de l'écosystème. Définissez vos attributs opérationnels et académiques.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 text-[10px] p-4 text-center font-mono uppercase tracking-widest mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-rudore-text/30 uppercase tracking-[0.2em] ml-1">Nom Complet</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-rudore-text/20" size={18} />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-rudore-sidebar border border-rudore-border py-3.5 pl-12 pr-4 text-rudore-text focus:outline-none focus:border-rudore-orange transition-colors"
                  placeholder="EX: JEAN DUPONT"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-rudore-text/30 uppercase tracking-[0.2em] ml-1">Identifiant Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-rudore-text/20" size={18} />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-rudore-sidebar border border-rudore-border py-3.5 pl-12 pr-4 text-rudore-text focus:outline-none focus:border-rudore-orange transition-colors"
                  placeholder="NOM@RUDORE.COM"
                  required
                />
              </div>
            </div>

            {/* Roles */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-rudore-text/30 uppercase tracking-[0.2em] ml-1">Rôle Opérationnel</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-rudore-text/20" size={18} />
                <input
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-rudore-sidebar border border-rudore-border py-3.5 pl-12 pr-4 text-rudore-text focus:outline-none focus:border-rudore-orange transition-colors"
                  placeholder="EX: PROJECT MANAGER"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-rudore-text/30 uppercase tracking-[0.2em] ml-1">Parcours Académique</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-rudore-text/20" size={18} />
                <input
                  name="academicRole"
                  value={formData.academicRole}
                  onChange={handleChange}
                  className="w-full bg-rudore-sidebar border border-rudore-border py-3.5 pl-12 pr-4 text-rudore-text focus:outline-none focus:border-rudore-orange transition-colors"
                  placeholder="EX: ÉTUDIANT IT"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-rudore-text/30 uppercase tracking-[0.2em] ml-1">Bio & Matrix Skills</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-rudore-text/20" size={18} />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full bg-rudore-sidebar border border-rudore-border py-3.5 pl-12 pr-4 text-rudore-text focus:outline-none focus:border-rudore-orange transition-colors resize-none font-sans"
                placeholder="Décrivez vos compétences et votre parcours opérationnel..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-rudore-text/30 uppercase tracking-[0.2em] ml-1">Clé d'Accès</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-rudore-text/20" size={18} />
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-rudore-sidebar border border-rudore-border py-3.5 pl-12 pr-4 text-rudore-text focus:outline-none focus:border-rudore-orange transition-colors font-mono"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rudore-text text-rudore-panel font-black py-4 hover:bg-rudore-orange hover:text-white transition-all duration-300 flex items-center justify-center space-x-3 group uppercase tracking-[0.2em] border border-rudore-border"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : <span>Initialiser Node</span>}
          </button>
        </form>
      </div>
    </div>
  );
};
