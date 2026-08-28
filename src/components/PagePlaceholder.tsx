import type { ReactNode } from 'react';
import { Construction } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function PagePlaceholder({ title, description, icon }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
        {icon ?? <Construction className="h-8 w-8" />}
      </div>
      <h2 className="text-xl font-bold text-navy-900 dark:text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-navy-400">
        {description ?? 'This module is part of the platform roadmap and will be available in an upcoming phase.'}
      </p>
      <span className="mt-4 badge bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        Coming soon
      </span>
    </div>
  );
}
