'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { NAV_LINKS } from '@/lib/nav-links';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const actual = NAV_LINKS.find((link) => link.href === pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-graphite-700 bg-graphite-950/80 px-6 py-4 backdrop-blur">
      <button
        onClick={onMenuClick}
        className="rounded-md border border-graphite-700 p-1.5 text-gray-400 transition hover:text-amber-400 md:hidden"
        aria-label="Abrir navegación"
      >
        <Menu className="h-4 w-4" />
      </button>
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
        {actual?.label ?? 'ANPR Console'}
      </h2>
    </header>
  );
}
