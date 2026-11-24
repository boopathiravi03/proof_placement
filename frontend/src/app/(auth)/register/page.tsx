'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/context/AppContext';
import { useAuth, UserRole } from '@/context/AuthContext';
import { ArrowRight, ShieldCheck } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid institutional email'),
  role: z.enum(['student', 'officer', 'recruiter', 'university']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useApp();
  const { switchRole } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: 'Rahul K.',
      email: 'rahul.k@apex.edu',
      role: 'student',
      password: 'password123',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    switchRole(data.role as UserRole);
    showToast(`Account provisioned for ${data.fullName} (${data.role})!`);
    if (data.role === 'student') router.push('/student/dashboard');
    else if (data.role === 'officer') router.push('/officer/cohort-insights');
    else if (data.role === 'recruiter') router.push('/recruiter/dashboard');
    else router.push('/university/dashboard');
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
          <p className="text-xs text-mut font-medium">Institutional Placement Account Registration</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Full Name</label>
            <input
              type="text"
              {...register('fullName')}
              className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-xs text-ink outline-none focus:border-pri transition-colors"
              placeholder="Rahul K."
            />
            {errors.fullName && <p className="text-xs text-bad">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Institutional Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-xs text-ink outline-none focus:border-pri transition-colors"
              placeholder="student@apex.edu"
            />
            {errors.email && <p className="text-xs text-bad">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Platform Persona Role</label>
            <select
              {...register('role')}
              className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-xs text-ink outline-none focus:border-pri transition-colors"
            >
              <option value="student">Student (Evidence & Assessment Dossier)</option>
              <option value="officer">T&P Officer (Intervention Queue & Cohort Insights)</option>
              <option value="recruiter">Recruiter (Candidate Discovery & Pipeline)</option>
              <option value="university">University Administrator (Macro Governance & RLS)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Account Password</label>
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
            {isSubmitting ? 'Provisioning Tenant Account...' : 'Complete Registration'}
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="text-center text-xs text-mut border-t border-line pt-4 space-y-1">
          <p>Already have an account? <Link href="/login" className="text-pri font-bold hover:underline">Sign In</Link></p>
          <p className="text-[11px] text-mut/80">Row-Level Security isolates multi-tenant student records</p>
        </div>
      </div>
    </div>
  );
}
