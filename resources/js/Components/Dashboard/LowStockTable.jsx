import { Link } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import Badge from '@/Components/UI/Badge';

/**
 * LowStockTable
 *
 * Usage:
 *   <LowStockTable products={dashboardData.lowStockProducts} />
 */
export default function LowStockTable({ products }) {
  return (
    <div className="rounded-card border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Low stock alerts</h3>
          <p className="mt-0.5 text-xs text-text-secondary">Items at or below threshold</p>
        </div>
        <Link href="/inventory" className="text-xs font-medium text-brand-ink hover:underline">
          View all
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-6 text-sm text-text-secondary">No products are currently low on stock.</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-dropdown border border-border px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-dropdown bg-warning-bg text-warning">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{product.name}</p>
                  <p className="text-xs text-text-secondary">{product.branchName}</p>
                </div>
              </div>
              <Badge variant="warning">{product.stock} left</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
