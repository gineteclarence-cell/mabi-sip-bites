import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { DollarSign, Receipt, TrendingUp, Package, AlertTriangle, Users, Clock, UserX, FileDown } from 'lucide-react';
import AppLayout from '@/Components/Layout/AppLayout';
import DashboardCard from '@/Components/UI/DashboardCard';
import Select from '@/Components/UI/Select';
import Input from '@/Components/UI/Input';
import Button from '@/Components/UI/Button';
import Badge from '@/Components/UI/Badge';

const paymentLabel = { cash: 'Cash', gcash: 'GCash', other: 'Other' };

function ReportsPageContent({ filters, branches, salesSummary, inventorySnapshot, attendanceSummary }) {
  const [startDate, setStartDate] = useState(filters.start_date);
  const [endDate, setEndDate] = useState(filters.end_date);
  const [branchId, setBranchId] = useState(filters.branch_id ?? '');

  function applyFilters() {
    router.get(
      route('reports.index'),
      { start_date: startDate, end_date: endDate, branch_id: branchId || undefined },
      { preserveState: true, preserveScroll: true }
    );
  }

  /**
   * PDF export: build the export URL with the same filters currently
   * applied and open it in a new tab. The browser handles it as a file
   * download because the server returns Content-Disposition: attachment.
   * We use a plain anchor href rather than Inertia's router because Inertia
   * handles JSON/HTML responses from the server — it would break on the raw
   * binary PDF stream the controller returns.
   */
  function exportPdf() {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (branchId) params.set('branch_id', branchId);
    window.open(`${route('reports.export-pdf')}?${params.toString()}`, '_blank');
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-card border border-border bg-white p-5">
        <Input
          label="Start date"
          type="date"
          value={startDate}
          onChange={setStartDate}
          className="w-44"
        />
        <Input
          label="End date"
          type="date"
          value={endDate}
          onChange={setEndDate}
          className="w-44"
        />
        {branches.length > 1 && (
          <Select label="Branch" value={branchId} onChange={setBranchId} className="w-48">
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name.replace('Mabi Sip and Bites ', '')}</option>
            ))}
          </Select>
        )}

        <div className="flex items-end gap-2 ml-auto">
          <Button variant="outline" onClick={applyFilters}>
            Apply filters
          </Button>
          <Button
            variant="secondary"
            leftIcon={<FileDown className="size-4" />}
            onClick={exportPdf}
          >
            Export PDF
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Sales summary</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DashboardCard
              icon={DollarSign}
              title="Total revenue"
              value={`₱${Number(salesSummary.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            />
            <DashboardCard
              icon={Receipt}
              title="Total transactions"
              value={salesSummary.totalTransactions}
            />
            <DashboardCard
              icon={TrendingUp}
              title="Average sale"
              value={`₱${Number(salesSummary.averageSale).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            />
          </div>

          {salesSummary.byPaymentMethod?.length > 0 && (
            <div className="mt-4 rounded-card border border-border bg-white p-5">
              <h3 className="text-sm font-semibold text-text-primary">By payment method</h3>
              <div className="mt-3 divide-y divide-border">
                {salesSummary.byPaymentMethod.map((row) => (
                  <div key={row.method} className="flex items-center justify-between py-2.5">
                    <Badge variant="neutral">{paymentLabel[row.method] || row.method}</Badge>
                    <span className="text-sm text-text-secondary">{row.count} transactions</span>
                    <span className="text-sm font-medium text-text-primary">
                      ₱{Number(row.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Inventory snapshot</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DashboardCard icon={Package} title="Active products" value={inventorySnapshot.totalProducts} />
            <DashboardCard
              icon={DollarSign}
              title="Total stock value"
              value={`₱${Number(inventorySnapshot.totalStockValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            />
            <DashboardCard icon={AlertTriangle} title="Low stock items" value={inventorySnapshot.lowStockCount} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Attendance summary</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard icon={Users} title="Total logs" value={attendanceSummary.totalLogs} />
            <DashboardCard icon={Users} title="Present" value={attendanceSummary.present} />
            <DashboardCard icon={Clock} title="Late" value={attendanceSummary.late} />
            <DashboardCard icon={UserX} title="Absent" value={attendanceSummary.absent} />
          </div>
        </section>
      </div>
    </>
  );
}

export default function ReportsIndex(props) {
  return (
    <AppLayout title="Reports" subtitle="Filtered summaries by date range and branch">
      <Head title="Reports" />
      <ReportsPageContent {...props} />
    </AppLayout>
  );
}
