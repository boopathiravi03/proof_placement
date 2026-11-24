import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 font-extrabold text-2xl text-ink">
          <span className="w-9 h-9 rounded-xl bg-pri text-white font-bold flex items-center justify-center shadow-md">
            P
          </span>
          ProofHire 2.0
        </Link>
        <p className="mt-1.5 text-xs text-mut font-medium">
          Evidence-Based Talent Intelligence & Institutional Placement Ecosystem
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-6 sm:px-10 border border-line rounded-3xl shadow-xl space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
