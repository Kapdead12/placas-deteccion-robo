import type { LucideIcon } from 'lucide-react';

type StatTone = 'default' | 'alert' | 'clear';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | undefined;
  hint?: string;
  tone?: StatTone;
}

const TONE_STYLES: Record<StatTone, string> = {
  default: 'bg-amber-500/10 text-amber-400',
  alert: 'bg-alert/10 text-red-400',
  clear: 'bg-clear/10 text-green-400',
};

export function StatCard({ icon: Icon, label, value, hint, tone = 'default' }: StatCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-graphite-700 bg-graphite-900/60 p-5 transition hover:border-graphite-600">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${TONE_STYLES[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-100">{value ?? '—'}</span>
        <span className="text-xs text-gray-400">{label}</span>
        {hint && <span className="mt-0.5 text-[11px] text-gray-500">{hint}</span>}
      </div>
    </div>
  );
}
