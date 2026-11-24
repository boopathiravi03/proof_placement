'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { GraduationCap, Building2, ShieldCheck, Plus, CheckCircle2, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface CollegeEntity {
  id: string;
  name: string;
  code: string;
  dean: string;
  officerEmail: string;
  studentCount: number;
  departments: string[];
  status: 'Active' | 'Provisioning';
  rlsKey: string;
}

const INITIAL_COLLEGES: CollegeEntity[] = [
  {
    id: 'col-1',
    name: 'Apex Institute of Technology',
    code: 'COLLEGE-A',
    dean: 'Dr. R. Ramanathan',
    officerEmail: 'placement@apex.edu',
    studentCount: 480,
    departments: ['CSE', 'IT', 'ECE', 'MECH'],
    status: 'Active',
    rlsKey: 'tenant_college_a_isolated',
  },
  {
    id: 'col-2',
    name: 'Beacon College of Engineering',
    code: 'COLLEGE-B',
    dean: 'Dr. Ananya Sen',
    officerEmail: 'tpo@beacon.ac.in',
    studentCount: 520,
    departments: ['CSE', 'IT', 'AI & DS'],
    status: 'Active',
    rlsKey: 'tenant_college_b_isolated',
  },
  {
    id: 'col-3',
    name: 'Crestline Engineering Institute',
    code: 'COLLEGE-C',
    dean: 'Dr. Suresh Verma',
    officerEmail: 'corporate@crestline.edu',
    studentCount: 390,
    departments: ['CSE', 'ECE', 'EEE', 'CIVIL'],
    status: 'Active',
    rlsKey: 'tenant_college_c_isolated',
  },
];

export default function CollegeManagementPage() {
  const { showToast } = useApp();
  const [colleges, setColleges] = useState<CollegeEntity[]>(INITIAL_COLLEGES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCode, setNewCode] = useState('');

  const handleAddCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName || !newCode) return;

    const newCol: CollegeEntity = {
      id: `col-${colleges.length + 1}`,
      name: newCollegeName,
      code: newCode.toUpperCase(),
      dean: 'Pending Appointment',
      officerEmail: `tpo@${newCode.toLowerCase()}.edu`,
      studentCount: 0,
      departments: ['CSE', 'IT'],
      status: 'Provisioning',
      rlsKey: `tenant_${newCode.toLowerCase()}_isolated`,
    };

    setColleges([...colleges, newCol]);
    setIsModalOpen(false);
    setNewCollegeName('');
    setNewCode('');
    showToast(`Provisioned tenant for ${newCollegeName} with PostgreSQL RLS isolation.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="College & Campus Tenant Management"
        description="Provision, manage, and monitor affiliated college tenants across the university placement network with cryptographic boundary verification."
        breadcrumbs={[{ label: 'University' }, { label: 'College Management' }]}
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-pri text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Plus size={14} />
            Provision New Campus Tenant
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Affiliated Campuses" value={colleges.length} trend="All RLS Enforced" trendPositive={true} />
        <StatCard label="Enrolled Engineering Cohort" value="1,390" trend="Active Students" trendPositive={true} />
        <StatCard label="Tenant Security Health" value="100%" trend="Zero Policy Violations" trendPositive={true} />
      </div>

      <div className="bg-card border border-line rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-line pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Registered College Campuses</h2>
            <p className="text-xs text-mut mt-0.5">
              Each institution operates in a cryptographically isolated tenant schema
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pri/10 text-pri">
            {colleges.length} Active Campuses
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {colleges.map((col) => (
            <div
              key={col.id}
              className="p-5 rounded-xl bg-bg border border-line flex flex-col justify-between space-y-4 hover:border-line/80 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <b className="text-sm font-bold text-ink block">{col.name}</b>
                    <span className="text-xs font-mono text-pri font-bold">{col.code}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      col.status === 'Active' ? 'bg-okt text-ok' : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {col.status}
                  </span>
                </div>

                <div className="text-xs text-mut space-y-1 pt-1 border-t border-line/60">
                  <div><b>Campus Dean:</b> {col.dean}</div>
                  <div><b>T&P Office:</b> {col.officerEmail}</div>
                  <div><b>Batch Size:</b> {col.studentCount} Students</div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mut block mb-1">Departments</span>
                  <div className="flex flex-wrap gap-1">
                    {col.departments.map((d) => (
                      <span key={d} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-card border border-line text-ink">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-line text-[11px] font-mono text-mut flex items-center gap-1.5">
                  <Lock size={12} className="text-ok shrink-0" />
                  <span className="truncate">RLS: {col.rlsKey}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => showToast(`Configuring policy settings for ${col.name}`)}
                  className="w-full text-center text-xs font-bold py-2 rounded-xl bg-card border border-line text-ink hover:bg-line/40 transition-colors"
                >
                  Manage Campus Tenant
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provision College Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provision New College Tenant">
        <form onSubmit={handleAddCollege} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-ink block mb-1">Campus / Institution Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Delta Institute of Science & Technology"
              value={newCollegeName}
              onChange={(e) => setNewCollegeName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-bg border border-line text-ink focus:outline-none focus:border-pri"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-ink block mb-1">Tenant Code Identifier</label>
            <input
              type="text"
              required
              placeholder="e.g. COLLEGE-D"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-bg border border-line text-ink focus:outline-none focus:border-pri font-mono"
            />
          </div>

          <div className="p-3 bg-bg rounded-xl border border-line text-xs text-mut">
            Provisioning automatically installs PostgreSQL row-level isolation policies and creates the default T&P officer administrator account.
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-line">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-mut hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-pri text-white text-xs font-bold shadow-sm hover:opacity-95"
            >
              Provision College
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
