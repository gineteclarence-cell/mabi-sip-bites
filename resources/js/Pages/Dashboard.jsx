import { useState, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
  DollarSign,
  Receipt,
  Hash,
  PackageX,
  Users,
  CalendarCheck,
  ListTodo,
  TrendingUp,
} from 'lucide-react';
import AppLayout from '@/Components/Layout/AppLayout';
import DashboardCard from '@/Components/UI/DashboardCard';
import KpiDetailModal from '@/Components/Dashboard/KpiDetailModal';
import BranchComparisonCard from '@/Components/Dashboard/BranchComparisonCard';
import RecentSalesTable from '@/Components/Dashboard/RecentSalesTable';
import LowStockTable from '@/Components/Dashboard/LowStockTable';
import AttendanceSummary from '@/Components/Dashboard/AttendanceSummary';
import PendingTasksPanel from '@/Components/Dashboard/PendingTasksPanel';
import { dashboardSampleData } from '@/lib/sampleData';

const kpiCardDefs = [
  { key: 'totalRevenue', title: 'Total revenue', icon: DollarSign },
  { key: 'todaysSales', title: "Today's sales", icon: Receipt },
  { key: 'totalTransactions', title: 'Total transactions', icon: Hash },
  { key: 'lowStockItems', title: 'Low stock items', icon: PackageX },
  { key: 'activeStaff', title: 'Active staff', icon: Users },
  { key: 'attendanceToday', title: 'Attendance today', icon: CalendarCheck },
  { key: 'pendingTasks', title: 'Pending tasks', icon: ListTodo },
  { key: 'branchGrowth', title: 'Branch growth', icon: TrendingUp },
];

/**
 * Dashboard
 *
 * Accepts `dashboardData` as an Inertia prop. Until DashboardController
 * (Phase 7) is wired up, falls back to dashboardSampleData so the page
 * is fully functional during earlier phases. Once the controller passes
 * real props with the same shape, this fallback becomes a no-op and can
 * be removed.
 *
 * Branch visibility: owner sees both branches' data and the comparison
 * section; manager/staff only see their assigned branch (the comparison
 * section is hidden for them since there's nothing to compare).
 */
export default function Dashboard({ dashboardData }) {
  const { auth } = usePage().props;
  const data = dashboardData ?? dashboardSampleData;
  const [activeMetric, setActiveMetric] = useState(null);

  const isOwner = auth?.user?.role === 'owner';

  const visibleBranchComparison = useMemo(() => {
    if (isOwner) return data.branchComparison;
    return data.branchComparison.filter((b) => b.branchId === auth?.user?.branch_id);
  }, [data.branchComparison, isOwner, auth?.user?.branch_id]);

  const activeCardDef = kpiCardDefs.find((c) => c.key === activeMetric);

  return (
    <AppLayout
      title="Dashboard"
      subtitle={isOwner ? 'Overview across both branches' : 'Overview for your branch'}
    >
      <Head title="Dashboard" />

      <div className="space-y-6">
        {/* 1. KPI cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCardDefs.map((card) => {
            const kpi = data.kpis[card.key];
            return (
              <DashboardCard
                key={card.key}
                icon={card.icon}
                title={card.title}
                value={
                  kpi.format === 'currency'
                    ? `₱${Number(kpi.value).toLocaleString()}`
                    : kpi.value
                }
                change={kpi.change}
                onClick={() => setActiveMetric(card.key)}
              />
            );
          })}
        </div>

        {/* 2. Branch comparison — owner only */}
        {isOwner && <BranchComparisonCard branches={visibleBranchComparison} />}

        {/* 3 & 4. Recent sales + low stock, side by side on large screens */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentSalesTable sales={data.recentSales} />
          <LowStockTable products={data.lowStockProducts} />
        </div>

        {/* 5 & 6. Attendance + pending tasks, side by side on large screens */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AttendanceSummary records={data.attendanceSummary} />
          <PendingTasksPanel tasks={data.pendingTasksList} />
        </div>
      </div>

      <KpiDetailModal
        isOpen={!!activeMetric}
        onClose={() => setActiveMetric(null)}
        title={activeCardDef?.title}
        kpi={activeMetric ? data.kpis[activeMetric] : null}
      />
    </AppLayout>
  );
}
