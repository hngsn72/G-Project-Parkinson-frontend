'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, User } from '@/services/auth.service';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  // Role and permission helpers
  hasRole: (roleName: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isDoctor: () => boolean;
  isPatient: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user info if token exists
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const access = AuthService.getAccessToken();
      if (!access) {
        const cached = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
        setUser(cached ? JSON.parse(cached) : null);
        setLoading(false);
        return;
      }
      const res = await AuthService.me();
      if (res.success && res.data) {
        setUser(res.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(res.data));
        }
      } else {
        setUser(null);
        AuthService.setAccessToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_user');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    const res = await AuthService.login(identifier, password);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
      }
      setLoading(false);
      return true;
    } else {
      setUser(null);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setLoading(true);
    await AuthService.logout();
    setUser(null);
    setLoading(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
    }
    router.push('/signin');
  };

  // Role and permission helpers
  const hasRole = (roleName: string) => {
    if (!user) return false;
    // Check matrix roles first
    if (user.roles?.some(role => role.name === roleName)) return true;
    // Fallback to legacy role field
    return user.role === roleName;
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    // Super admin has all permissions
    if (hasRole('super_admin') || user.role === 'admin') return true;
    // Check specific permissions
    return user.permissions?.includes(permission) || false;
  };

  const isAdmin = () => hasRole('super_admin') || hasRole('admin') || user?.role === 'admin';
  const isDoctor = () => hasRole('doctor') || user?.role === 'doctor';
  const isPatient = () => hasRole('patient') || user?.role === 'patient' || user?.role === 'user';

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      setUser,
      hasRole,
      hasPermission,
      isAdmin,
      isDoctor,
      isPatient
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}
