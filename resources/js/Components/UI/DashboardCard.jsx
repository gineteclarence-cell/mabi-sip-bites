import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * DashboardCard
 *
 * Usage:
 *   <DashboardCard
 *     icon={DollarSign}
 *     title="Total revenue"
 *     value="₱128,450"
 *     change={{ direction: 'up', label: '+12.4% vs last week' }}
 *     onClick={() => openDetailModal('revenue')}
 *   />
 */
export default function DashboardCard({ icon: Icon, title, value, change, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-card border border-border bg-white p-5 transition-all hover:border-text-muted hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{title}</p>
        {Icon && (
          <div className="flex items-center justify-center size-9 rounded-dropdown bg-muted text-text-primary">
            <Icon className="size-4" />
          </div>
        )}
      </div>

      <p className="mt-3 text-2xl font-semibold text-text-primary font-display">{value}</p>

      {change && (
        <p
          className={cn(
            'mt-2 inline-flex items-center gap-1 text-xs font-medium',
            change.direction === 'up' ? 'text-success' : 'text-danger'
          )}
        >
          {change.direction === 'up' ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          )}
          {change.label}
        </p>
      )}
    </button>
  );
}
