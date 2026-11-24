'use client';

import React from 'react';
import RoleLayout, { NavItem } from './RoleLayout';
import {
  Users,
  CheckSquare,
  Search,
  Calendar,
  FileBarChart,
  ScrollText,
} from 'lucide-react';

const OFFICER_NAV: NavItem[] = [
  { title: 'Cohort Insights', href: '/officer/cohort-insights', icon: <Users size={17} /> },
  { title: 'Approvals Queue', href: '/officer/approvals', icon: <CheckSquare size={17} /> },
  { title: 'Talent Search', href: '/officer/talent-search', icon: <Search size={17} /> },
  { title: 'Drive Calendar', href: '/officer/calendar', icon: <Calendar size={17} /> },
  { title: 'Reports & Export', href: '/officer/reports', icon: <FileBarChart size={17} /> },
  { title: 'Audit Ledger', href: '/officer/audit', icon: <ScrollText size={17} /> },
];

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout role="officer" roleTitle="T&P Officer" navItems={OFFICER_NAV}>
      {children}
    </RoleLayout>
  );
}
