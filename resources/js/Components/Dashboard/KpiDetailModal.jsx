import Modal from '@/Components/UI/Modal';
import { formatKpiValue } from '@/lib/formatters';

/**
 * KpiDetailModal
 *
 * Generic detail modal reused by every dashboard KPI card. Shows the
 * overall value plus a per-branch breakdown table.
 *
 * Usage:
 *   <KpiDetailModal
 *     isOpen={activeMetric === 'totalRevenue'}
 *     onClose={() => setActiveMetric(null)}
 *     title="Total revenue"
 *     kpi={dashboardData.kpis.totalRevenue}
 *   />
 */
export default function KpiDetailModal({ isOpen, onClose, title, kpi }) {
  if (!kpi) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="text-center">
        <p className="text-3xl font-semibold text-text-primary font-display">
          {formatKpiValue(kpi)}
        </p>
        {kpi.change && (
          <p
            className={
              kpi.change.direction === 'up'
                ? 'mt-1.5 text-sm font-medium text-success'
                : 'mt-1.5 text-sm font-medium text-danger'
            }
          >
            {kpi.change.label}
          </p>
        )}
      </div>

      {kpi.breakdown?.length > 0 && (
        <div className="mt-6 rounded-dropdown border border-border divide-y divide-border">
          {kpi.breakdown.map((row) => (
            <div key={row.branchId} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-secondary">{row.branchName}</span>
              <span className="text-sm font-medium text-text-primary">
                {kpi.format === 'currency'
                  ? formatKpiValue({ ...kpi, value: row.value })
                  : row.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
