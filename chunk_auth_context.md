
---

## 🛑 FICHIER : `context/AuthContext.tsx`

### [SÉCURITÉ CRITIQUE : VULNÉRABILITÉ XSS] - Lignes 21-31 :
**Le problème :** L'authentification stockée en `localStorage` (`localStorage.setItem('token', token);` et `localStorage.getItem('token');`).
**Le risque :** C'est la vulnérabilité frontend n°1 (Cross-Site Scripting - XSS). Le `localStorage` est accessible par *n'importe quel script JavaScript* exécuté sur ta page (extensions navigateur malveillantes, dépendances NPM compromises, scripts de tracking). Si tu as bien regardé ton API de Login (`app/api/auth/login/route.ts`), tu as *déjà* mis en place un cookie `httpOnly`, ce qui est la bonne pratique ! Mettre le token en plus dans le `localStorage` annule totalement la protection du cookie `httpOnly`. 
**La Solution Experte :** Supprimer purement et simplement toute manipulation de JWT côté client. Le client ne doit connaître que l'état de validation (via un call `/api/auth/me`).

### [SÉCURITÉ ARCHITECTURE : PRIVILEGE ESCALATION] - Ligne 45 :
**Le problème :** `if (user.isAdmin) return true;` basé sur une donnée extraite du `localStorage`.
**Le risque :** Élévation de privilèges côté client. Un utilisateur normal peut ouvrir sa console Chrome, taper `localStorage.setItem('user', JSON.stringify({ isAdmin: true }))`, recharger la page, et ton `AuthContext` va lui accorder l'accès à toute ton UI d'administration. Même si ton backend rejette ses requêtes, il verra tous tes écrans cachés, tes endpoints API et potentiellement des logiques métier sensibles codées en dur dans les composants admin.
**La Solution Experte :** L'état d'authentification doit provenir exclusivement d'une source de confiance (Server-Side) au chargement de l'application, et non du LocalStorage modifiable par l'utilisateur.

**La Solution Experte (Code Refactorisé Complet) :**
```tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Member } from '../types';

interface AuthContextType {
  user: Member | null;
  login: (userData: Member) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (view: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Member | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Indispensable pour éviter le flash de l'UI

  // Hydratation sécurisée via API (le token voyage via le cookie HTTPOnly, invisible pour JS)
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/me'); // Route qui valide le cookie httpOnly et renvoie l'user
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AUTH] Session restoration failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, []);

  // Le login ne manipule PLUS DE TOKEN. L'API a déjà setté le cookie.
  const login = (userData: Member) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Destruction du cookie côté serveur
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch(e) {
      console.error('[AUTH] Logout failed', e);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // Forcer un rechargement dur pour purger l'état React et le cache
      window.location.href = '/login';
    }
  };

  const hasPermission = (view: string): boolean => {
    if (!user) return false;
    // user.role est la source de vérité (venant de l'API sécurisée)
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true; 
    return user.permissions?.includes(view) || view === 'PROFILE';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```
