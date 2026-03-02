"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Hexagon, Lock, Mail, ArrowRight, Loader } from 'lucide-react';

interface LoginProps {
  onRegisterClick: () => void;
}

export const Login: React.FC<LoginProps> = ({ onRegisterClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { user: userData } = await response.json();
        login(userData);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || 'Identifiants invalides');
      }
    } catch (err: any) {
      setError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rudore-app p-4 font-sans">
      <div className="w-full max-w-md bg-rudore-panel border border-rudore-border p-10 shadow-[20px_20px_0px_rgba(252,83,42,0.1)] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rudore-orange/10 border-l border-b border-rudore-orange/20 -translate-y-1/2 translate-x-1/2 rotate-45"></div>

        <div className="flex flex-col items-center mb-10 relative z-10">
          <Hexagon className="text-rudore-orange fill-rudore-orange/10 mb-6" size={64} strokeWidth={1} />
          <h1 className="text-4xl font-header font-black text-rudore-text tracking-[0.2em] uppercase">RUDORE OS</h1>
          <p className="text-rudore-text/40 text-[10px] mt-3 font-mono uppercase tracking-[0.3em] border-t border-rudore-border pt-2 w-full text-center">Accès Système Sécurisé</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 text-[10px] p-4 text-center font-mono uppercase tracking-widest">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-rudore-text/30 uppercase tracking-[0.2em] ml-1">Identifiant Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-rudore-text/20" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-rudore-sidebar border border-rudore-border py-4 pl-12 pr-4 text-rudore-text focus:outline-none focus:border-rudore-orange transition-colors placeholder:text-rudore-text/10"
                placeholder="PROFIL@RUDORE.COM"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-rudore-text/30 uppercase tracking-[0.2em] ml-1">Clé d'Accès</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-rudore-text/20" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-rudore-sidebar border border-rudore-border py-4 pl-12 pr-4 text-rudore-text focus:outline-none focus:border-rudore-orange transition-colors placeholder:text-rudore-text/10 font-mono"
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
            {loading ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              <>
                <span>Initialiser Session</span>
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center border-t border-rudore-border pt-6">
          <p className="text-rudore-text/30 text-[11px] uppercase tracking-widest">
            Nouveau sur RUDORE ?{' '}
            <button onClick={onRegisterClick} className="text-rudore-orange hover:text-white font-black transition-colors ml-2 underline underline-offset-4">
              Rejoindre le HUB
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
