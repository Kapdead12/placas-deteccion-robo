type BadgeTone = 'alert' | 'clear' | 'neutral' | 'amber';

interface BadgeProps {
  tone: BadgeTone;
  children: React.ReactNode;
}

const TONE_STYLES: Record<BadgeTone, string> = {
  alert: 'border-alert/40 bg-alert/15 text-red-300',
  clear: 'border-clear/40 bg-clear/15 text-green-300',
  neutral: 'border-graphite-600 bg-graphite-700/60 text-gray-400',
  amber: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
};

export function Badge({ tone, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
