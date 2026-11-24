'use client';

import React from 'react';
import RoleLayout, { NavItem } from './RoleLayout';
import {
  LayoutDashboard,
  Award,
  FileCheck,
  GraduationCap,
  ListTodo,
  FileText,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

const STUDENT_NAV: NavItem[] = [
  { title: 'Overview', href: '/student/dashboard', icon: <LayoutDashboard size={17} /> },
  { title: 'Readiness Index', href: '/student/readiness', icon: <Award size={17} /> },
  { title: 'Verifiable Evidence', href: '/student/evidence', icon: <FileCheck size={17} /> },
  { title: 'Adaptive Assessment', href: '/student/assessment', icon: <GraduationCap size={17} /> },
  { title: 'Learning Path', href: '/student/learning', icon: <ListTodo size={17} /> },
  { title: 'Verified Resume', href: '/student/resume', icon: <FileText size={17} /> },
  { title: 'Privacy & DPDP', href: '/student/privacy', icon: <ShieldCheck size={17} /> },
  { title: 'My Drives', href: '/student/drives', icon: <Briefcase size={17} /> },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout role="student" roleTitle="Student Portal" navItems={STUDENT_NAV}>
      {children}
    </RoleLayout>
  );
}
