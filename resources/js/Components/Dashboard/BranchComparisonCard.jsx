import { Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

/**
 * BranchComparisonCard
 *
 * Usage:
 *   <BranchComparisonCard branches={dashboardData.branchComparison} />
 */
export default function BranchComparisonCard({ branches }) {
  return (
    <div className="rounded-card border border-border bg-white p-5">
      <h3 className="text-sm font-semibold text-text-primary">Branch comparison</h3>
      <p className="mt-0.5 text-xs text-text-secondary">Performance this week, side by side</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {branches.map((branch) => (
          <div key={branch.branchId} className="rounded-dropdown border border-border p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-dropdown bg-muted text-text-primary">
                <Building2 className="size-4" />
              </div>
              <span className="text-sm font-medium text-text-primary">{branch.branchName}</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-text-secondary">Revenue</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">
                  {formatCurrency(branch.revenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Sales</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">
                  {branch.transactions}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Staff</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">{branch.staff}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
