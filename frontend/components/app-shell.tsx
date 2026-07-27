'use client';

import { useState } from 'react';
import { ShieldHalf } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sin sesión (login, landing pública): shell minimalista, sin sidebar.
  if (!usuario) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-graphite-700 px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
              <ShieldHalf className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-wide text-gray-100">ANPR Console</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-col md:pl-64">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
