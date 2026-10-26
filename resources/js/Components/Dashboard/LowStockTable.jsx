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
          <h3 className="text-sm font-semibold text-text-primary">Inventory stock alerts</h3>
          <p className="mt-0.5 text-xs text-text-secondary">Low stock (yellow) and out of stock (red)</p>
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
              className={`flex items-center justify-between rounded-dropdown border px-3.5 py-2.5 ${Number(product.stock) <= 0 ? "border-red-300 bg-red-50" : "border-yellow-300 bg-yellow-50"}`}
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
              <span className={`rounded px-2 py-1 text-xs font-semibold ${Number(product.stock) <= 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                {Number(product.stock) <= 0 ? 'Out of stock' : `Low stock: ${product.stock} left`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
