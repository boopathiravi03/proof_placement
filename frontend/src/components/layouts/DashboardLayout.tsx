'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] min-h-screen bg-bg">
      <Sidebar />
      <main className="p-6 md:p-8 max-w-[1200px] w-full">
        <Header />
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}
