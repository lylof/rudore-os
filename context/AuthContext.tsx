"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Member } from '../types';

interface AuthContextType {
  user: Member | null;
  // Note: login no longer takes a token string because cookies are HttpOnly
  login: (user: Member) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (view: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Member | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. SECURE SESSION HYDRATION (No localStorage)
  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AUTH] Hydration failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    hydrateSession();
  }, []);

  const login = (userData: Member) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('[AUTH] Logout request failed', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // Optional: Force a hard reload to clear any residual in-memory state across the app
      window.location.href = '/login';
    }
  };

  const hasPermission = (view: string): boolean => {
    if (!user) return false;
    if (user.isAdmin) return true; // Admins have access to everything
    return user.permissions?.includes(view) || view === 'PROFILE'; // Everyone has profile
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
