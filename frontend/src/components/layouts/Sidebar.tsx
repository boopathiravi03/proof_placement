'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Award,
  FileCheck,
  GraduationCap,
  FileText,
  ShieldCheck,
  Briefcase,
  Users,
  CheckSquare,
  Search,
  Calendar,
  FileBarChart,
  GitBranch,
  Building2,
  ScrollText,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  roleTag: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  // Student
  { title: 'Dashboard', href: '/student/dashboard', roleTag: 'S', icon: <LayoutDashboard size={18} /> },
  { title: 'Readiness', href: '/student/readiness', roleTag: 'S', icon: <Award size={18} /> },
  { title: 'Evidence', href: '/student/evidence', roleTag: 'S', icon: <FileCheck size={18} /> },
  { title: 'Assessment', href: '/student/assessment', roleTag: 'S', icon: <GraduationCap size={18} /> },
  { title: 'Learning Path', href: '/student/learning', roleTag: 'S', icon: <GraduationCap size={18} /> },
  { title: 'Resume', href: '/student/resume', roleTag: 'S', icon: <FileText size={18} /> },
  { title: 'Privacy & Consent', href: '/student/privacy', roleTag: 'S', icon: <ShieldCheck size={18} /> },
  { title: 'My Drives', href: '/student/drives', roleTag: 'S', icon: <Briefcase size={18} /> },
  // Officer
  { title: 'Cohort Insights', href: '/officer/cohort-insights', roleTag: 'O', icon: <Users size={18} /> },
  { title: 'Approvals Queue', href: '/officer/approvals', roleTag: 'O', icon: <CheckSquare size={18} /> },
  { title: 'Talent Search', href: '/officer/talent-search', roleTag: 'O', icon: <Search size={18} /> },
  { title: 'Drive Calendar', href: '/officer/calendar', roleTag: 'O', icon: <Calendar size={18} /> },
  { title: 'Reports & Export', href: '/officer/reports', roleTag: 'O', icon: <FileBarChart size={18} /> },
  { title: 'Audit Log', href: '/officer/audit', roleTag: 'O', icon: <ScrollText size={18} /> },
  // Recruiter
  { title: 'Hiring Pipeline', href: '/recruiter/hiring-pipeline', roleTag: 'R', icon: <GitBranch size={18} /> },
  // University
  { title: 'University View', href: '/university/dashboard', roleTag: 'U', icon: <Building2 size={18} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { college, setCollege } = useApp();

  return (
    <aside className="bg-side text-[#e9e6ff] p-5 flex flex-col gap-1.5 sticky top-0 h-screen overflow-y-auto">
      {/* Brand Logo */}
      <Link href="/" className="font-extrabold text-[21px] mx-2 mb-4 flex gap-2.5 items-center text-white no-underline">
        <b className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-[#8a6cff] to-[#4cc3ff] grid place-items-center text-white text-base font-extrabold">
          P
        </b>
        ProofHire 2.0
      </Link>

      {/* Nav List */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2.5 rounded-xl font-medium flex items-center gap-2.5 transition-colors text-sm ${
                isActive
                  ? 'bg-pri text-white font-bold'
                  : 'text-[#b9b4e6] hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.title}</span>
              <small className="ml-auto opacity-60 text-[11px] font-bold">
                {item.roleTag}
              </small>
            </Link>
          );
        })}
      </nav>

      {/* College Tenant Switcher */}
      <div className="pt-4 mt-auto border-t border-white/10">
        <div className="text-[12px] text-[#9d98c9] font-medium px-2 mb-2">College Tenant</div>
        <div className="flex gap-1.5 bg-white/10 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setCollege('A')}
            className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
              college === 'A' ? 'bg-white text-side shadow-sm' : 'text-[#e9e6ff] hover:bg-white/10'
            }`}
          >
            College A
          </button>
          <button
            type="button"
            onClick={() => setCollege('B')}
            className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
              college === 'B' ? 'bg-white text-side shadow-sm' : 'text-[#e9e6ff] hover:bg-white/10'
            }`}
          >
            College B
          </button>
        </div>
      </div>
    </aside>
  );
}
