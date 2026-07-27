'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, ShieldHalf, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NAV_LINKS } from '@/lib/nav-links';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { usuario, logout } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-graphite-950/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-graphite-700 bg-graphite-900 transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-graphite-700 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
              <ShieldHalf className="h-4 w-4" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wide text-gray-100">ANPR Console</span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-clear" />
                Sistema operativo
              </span>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-500 transition hover:text-gray-300 md:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`group flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                    : 'border-transparent text-gray-400 hover:border-graphite-500 hover:bg-graphite-800/60 hover:text-gray-200'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? 'text-amber-400' : 'text-gray-500 group-hover:text-gray-300'}`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {usuario && (
          <div className="border-t border-graphite-700 p-4">
            <div className="flex items-center gap-3 rounded-md bg-graphite-800/60 px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-semibold text-amber-300">
                {iniciales(usuario.nombre)}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-gray-100">{usuario.nombre}</span>
                <span className="text-[11px] uppercase tracking-wide text-gray-500">{usuario.rol}</span>
              </div>
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="ml-auto rounded p-1.5 text-gray-500 transition hover:bg-alert/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
}
