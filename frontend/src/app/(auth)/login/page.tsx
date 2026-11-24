'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/context/AppContext';
import { useAuth, UserRole } from '@/context/AuthContext';
import { ShieldCheck, Award, Users, Briefcase, Building2, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const PRESET_ACCOUNTS = [
  { role: 'student' as UserRole, name: 'Rahul K. (Student)', email: 'rahul.k@apex.edu', path: '/student/dashboard', icon: <Award size={14} /> },
  { role: 'officer' as UserRole, name: 'T&P Officer', email: 'officer@apex.edu', path: '/officer/cohort-insights', icon: <Users size={14} /> },
  { role: 'recruiter' as UserRole, name: 'Acme Recruiter', email: 'talent@acmetech.com', path: '/recruiter/dashboard', icon: <Briefcase size={14} /> },
  { role: 'university' as UserRole, name: 'University Admin', email: 'admin@university.edu', path: '/university/dashboard', icon: <Building2 size={14} /> },
];

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useApp();
  const { switchRole } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState<UserRole>('student');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'rahul.k@apex.edu',
      password: 'password123',
    },
  });

  const handleSelectPreset = (preset: typeof PRESET_ACCOUNTS[0]) => {
    setSelectedPreset(preset.role);
    setValue('email', preset.email);
    switchRole(preset.role);
  };

  const onSubmit = async (data: LoginFormData) => {
    const matchedPreset = PRESET_ACCOUNTS.find((p) => p.email === data.email) || PRESET_ACCOUNTS[0];
    switchRole(matchedPreset.role);
    showToast(`Authenticated as ${matchedPreset.name}`);
    router.push(matchedPreset.path);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-bg p-4 py-12">
      <div className="w-full max-w-md bg-card border border-line rounded-3xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 font-extrabold text-2xl text-ink">
            <span className="w-10 h-10 rounded-2xl bg-pri text-white grid place-items-center text-lg font-black shadow-sm">
              P
            </span>
            <span className="tracking-tight">ProofHire 2.0</span>
          </Link>
          <p className="text-xs text-mut font-medium">Evidence-Based Talent Intelligence Platform</p>
        </div>

        {/* Demo Persona Quick Select */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mut block text-center">
            Quick Persona Autofill
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_ACCOUNTS.map((preset) => (
              <button
                key={preset.role}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  selectedPreset === preset.role
                    ? 'bg-pri text-white border-pri shadow-xs'
                    : 'bg-bg border-line text-ink hover:border-pri/40'
                }`}
              >
                {preset.icon}
                <span className="truncate">{preset.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Institutional Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-xs text-ink outline-none focus:border-pri transition-colors"
              placeholder="rahul.k@apex.edu"
            />
            {errors.email && <p className="text-xs text-bad">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-xs text-ink outline-none focus:border-pri transition-colors"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-bad">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-pri text-white font-bold text-xs py-3 rounded-xl shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="text-center text-xs text-mut border-t border-line pt-4 space-y-1">
          <p>Don&apos;t have an account? <Link href="/register" className="text-pri font-bold hover:underline">Register</Link></p>
          <p className="text-[11px] text-mut/80">Protected by PostgreSQL RLS & Supabase Auth</p>
        </div>
      </div>
    </div>
  );
}
