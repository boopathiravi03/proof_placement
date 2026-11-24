'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'student' | 'officer' | 'recruiter' | 'university';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  collegeId: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  register: (name: string, email: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const DEFAULT_USERS: Record<UserRole, User> = {
  student: {
    id: 'student-rahul-01',
    name: 'Rahul K.',
    email: 'rahul.k@apex.edu',
    role: 'student',
    collegeId: 'COLLEGE-A',
  },
  officer: {
    id: 'officer-meena-01',
    name: 'Prof. Meena',
    email: 'placement.officer@apex.edu',
    role: 'officer',
    collegeId: 'COLLEGE-A',
  },
  recruiter: {
    id: 'recruiter-sarah-01',
    name: 'Sarah Jenkins',
    email: 'recruiter@acme.tech',
    role: 'recruiter',
    collegeId: 'COLLEGE-A',
  },
  university: {
    id: 'admin-verma-01',
    name: 'Dr. V. Verma',
    email: 'admin@apex-university.edu',
    role: 'university',
    collegeId: 'COLLEGE-A',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(DEFAULT_USERS.student);

  // Restore saved session if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('proofhire_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const login = async (email: string, explicitRole?: UserRole): Promise<boolean> => {
    const matchedRole = explicitRole || (
      email.includes('officer') ? 'officer' :
      email.includes('recruiter') ? 'recruiter' :
      email.includes('university') || email.includes('admin') ? 'university' : 'student'
    );
    const selected = { ...DEFAULT_USERS[matchedRole], email };
    setUser(selected);
    try {
      localStorage.setItem('proofhire_user', JSON.stringify(selected));
    } catch {}
    return true;
  };

  const register = async (name: string, email: string, role: UserRole): Promise<boolean> => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      collegeId: 'COLLEGE-A',
    };
    setUser(newUser);
    try {
      localStorage.setItem('proofhire_user', JSON.stringify(newUser));
    } catch {}
    return true;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('proofhire_user');
    } catch {}
    router.push('/login');
  };

  const switchRole = (newRole: UserRole) => {
    const targetUser = DEFAULT_USERS[newRole];
    setUser(targetUser);
    try {
      localStorage.setItem('proofhire_user', JSON.stringify(targetUser));
    } catch {}
    const routes: Record<UserRole, string> = {
      student: '/student/dashboard',
      officer: '/officer/cohort-insights',
      recruiter: '/recruiter/hiring-pipeline',
      university: '/university/dashboard',
    };
    router.push(routes[newRole]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'student',
        isAuthenticated: !!user,
        login,
        register,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
