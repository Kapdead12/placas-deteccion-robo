import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-graphite-700 bg-graphite-900/30 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-graphite-800 text-gray-500">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium text-gray-300">{title}</p>
      {description && <p className="max-w-sm text-xs text-gray-500">{description}</p>}
    </div>
  );
}
