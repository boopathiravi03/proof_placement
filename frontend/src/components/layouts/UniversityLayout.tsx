'use client';

import React from 'react';
import RoleLayout, { NavItem } from './RoleLayout';
import {
  Building2,
  GraduationCap,
  BarChart3,
  Settings,
} from 'lucide-react';

const UNIVERSITY_NAV: NavItem[] = [
  { title: 'Institutional Overview', href: '/university/dashboard', icon: <Building2 size={17} /> },
  { title: 'College Management', href: '/university/colleges', icon: <GraduationCap size={17} /> },
  { title: 'Comparative Analytics', href: '/university/analytics', icon: <BarChart3 size={17} /> },
  { title: 'Administration & RLS', href: '/university/admin', icon: <Settings size={17} /> },
];

export default function UniversityLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout role="university" roleTitle="University Admin" navItems={UNIVERSITY_NAV}>
      {children}
    </RoleLayout>
  );
}
