'use client';

import React from 'react';
import RoleLayout, { NavItem } from './RoleLayout';
import {
  LayoutDashboard,
  GitBranch,
  Briefcase,
  Compass,
  CalendarCheck,
} from 'lucide-react';

const RECRUITER_NAV: NavItem[] = [
  { title: 'Overview', href: '/recruiter/dashboard', icon: <LayoutDashboard size={17} /> },
  { title: 'Hiring Pipeline', href: '/recruiter/hiring-pipeline', icon: <GitBranch size={17} /> },
  { title: 'Job Requirements', href: '/recruiter/jobs', icon: <Briefcase size={17} /> },
  { title: 'Candidate Discovery', href: '/recruiter/discovery', icon: <Compass size={17} /> },
  { title: 'Interview Schedule', href: '/recruiter/interviews', icon: <CalendarCheck size={17} /> },
];

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout role="recruiter" roleTitle="Recruiter Workspace" navItems={RECRUITER_NAV}>
      {children}
    </RoleLayout>
  );
}
