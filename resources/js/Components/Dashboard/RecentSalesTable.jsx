import { Link } from '@inertiajs/react';
import Badge from '@/Components/UI/Badge';
import { formatCurrency } from '@/lib/formatters';

const paymentLabel = {
  cash: 'Cash',
  gcash: 'GCash',
  other: 'Other',
};

/**
 * RecentSalesTable
 *
 * Usage:
 *   <RecentSalesTable sales={dashboardData.recentSales} />
 */
export default function RecentSalesTable({ sales }) {
  return (
    <div className="rounded-card border border-border bg-white">
      <div className="flex items-center justify-between p-5 pb-0">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Recent sales</h3>
          <p className="mt-0.5 text-xs text-text-secondary">Latest transactions across both branches</p>
        </div>
        <Link href="/sales" className="text-xs font-medium text-brand-ink hover:underline">
          View all
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-2.5 text-left text-xs font-medium text-text-secondary">Transaction</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-text-secondary">Branch</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-text-secondary">Staff</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-text-secondary">Payment</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-text-secondary">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-b border-border last:border-b-0">
                <td className="px-5 py-3 text-text-primary">{sale.transactionNumber}</td>
                <td className="px-5 py-3 text-text-secondary">{sale.branchName}</td>
                <td className="px-5 py-3 text-text-secondary">{sale.staffName}</td>
                <td className="px-5 py-3">
                  <Badge variant="neutral">{paymentLabel[sale.paymentMethod] || sale.paymentMethod}</Badge>
                </td>
                <td className="px-5 py-3 text-right font-medium text-text-primary">
                  {formatCurrency(sale.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h-2" />
    </div>
  );
}
