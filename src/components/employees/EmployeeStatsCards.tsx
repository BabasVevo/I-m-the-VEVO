import { motion } from 'motion/react';
import { Users, UserCheck, UserX, UserPlus, Shield } from 'lucide-react';
import type { EmployeeStats } from '@/types/database';

interface EmployeeStatsCardsProps {
  stats: EmployeeStats;
  totalBranches?: number;
}

export function EmployeeStatsCards({ stats, totalBranches = 3 }: EmployeeStatsCardsProps) {
  const cards = [
    {
      id: 'stat-total-employees',
      label: 'Total Staff',
      value: stats.totalEmployees,
      subtext: `${totalBranches} store locations`,
      icon: Users,
      color: 'text-primary-600 bg-primary-50 border-primary-100',
    },
    {
      id: 'stat-active-employees',
      label: 'Active Members',
      value: stats.activeEmployees,
      subtext: `${Math.round((stats.activeEmployees / Math.max(1, stats.totalEmployees)) * 100)}% active workforce`,
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      id: 'stat-inactive-employees',
      label: 'Inactive / On Leave',
      value: stats.inactiveEmployees,
      subtext: stats.inactiveEmployees === 0 ? 'All staff active' : 'Requires review',
      icon: UserX,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      id: 'stat-roles-types',
      label: 'Active Roles',
      value: Object.keys(stats.roleCounts).length || 6,
      subtext: '6 standard system roles',
      icon: Shield,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      id: 'stat-new-hires',
      label: 'New This Month',
      value: stats.newThisMonth,
      subtext: 'Recently onboarded',
      icon: UserPlus,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            id={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500 truncate">{card.label}</span>
              <div className={`p-2 rounded-lg border ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">{card.subtext}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
