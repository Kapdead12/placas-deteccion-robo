import { Camera, History, LayoutDashboard, ScanLine, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/detectar', label: 'Detectar', icon: ScanLine },
  { href: '/historial', label: 'Historial', icon: History },
  { href: '/alertas', label: 'Alertas', icon: ShieldAlert },
  { href: '/camaras', label: 'Cámaras', icon: Camera },
  { href: '/placas', label: 'Placas reportadas', icon: ShieldCheck },
];
