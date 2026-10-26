import { useMemo, useState } from "react";
import { Head, usePage } from "@inertiajs/react";

import {
    DollarSign,
    Receipt,
    Hash,
    PackageX,
    Users,
    CalendarCheck,
    ListTodo,
    TrendingUp,
} from "lucide-react";

import AppLayout from "@/Components/Layout/AppLayout";
import DashboardCard from "@/Components/UI/DashboardCard";

import KpiDetailModal from "@/Components/Dashboard/KpiDetailModal";
import BranchComparisonCard from "@/Components/Dashboard/BranchComparisonCard";
import RecentSalesTable from "@/Components/Dashboard/RecentSalesTable";
import LowStockTable from "@/Components/Dashboard/LowStockTable";
import AttendanceSummary from "@/Components/Dashboard/AttendanceSummary";
import PendingTasksPanel from "@/Components/Dashboard/PendingTasksPanel";

const kpiCardDefs = [
    {
        key: "totalRevenue",
        title: "Monthly revenue",
        icon: DollarSign,
    },
    {
        key: "todaysSales",
        title: "Today's sales",
        icon: Receipt,
    },
    {
        key: "totalTransactions",
        title: "Total transactions",
        icon: Hash,
    },
    {
        key: "lowStockItems",
        title: "Low stock items",
        icon: PackageX,
    },
    {
        key: "activeStaff",
        title: "Active staff",
        icon: Users,
    },
    {
        key: "attendanceToday",
        title: "Attendance today",
        icon: CalendarCheck,
    },
    {
        key: "pendingTasks",
        title: "Pending tasks",
        icon: ListTodo,
    },
    {
        key: "branchGrowth",
        title: "Branch growth",
        icon: TrendingUp,
    },
];

export default function Dashboard({ dashboardData }) {
    const { auth } = usePage().props;

    const data = dashboardData;

    const [activeMetric, setActiveMetric] = useState(null);

    const isOwner = auth?.user?.role === "owner";

    /*
     * Owner = all branches.
     * Manager/staff = their assigned branch only.
     */
    const visibleBranchComparison = useMemo(() => {
        if (!data?.branchComparison) {
            return [];
        }

        if (isOwner) {
            return data.branchComparison;
        }

        return data.branchComparison.filter(
            (branch) => branch.branchId === auth?.user?.branch_id,
        );
    }, [data?.branchComparison, isOwner, auth?.user?.branch_id]);

    const activeCardDef = kpiCardDefs.find((card) => card.key === activeMetric);

    if (!data) {
        return (
            <AppLayout title="Dashboard" subtitle="Loading dashboard data...">
                <Head title="Dashboard" />

                <div className="flex min-h-[400px] items-center justify-center">
                    <p className="text-sm text-gray-500">
                        Dashboard data is unavailable.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            title="Dashboard"
            subtitle={
                isOwner
                    ? "Overview across both branches"
                    : "Overview for your branch"
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* =========================================================
                    1. KPI CARDS
                ========================================================= */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpiCardDefs.map((card) => {
                        const kpi = data.kpis?.[card.key];

                        if (!kpi) {
                            return null;
                        }

                        let formattedValue = kpi.value;

                        if (kpi.format === "currency") {
                            formattedValue = `₱${Number(
                                kpi.value ?? 0,
                            ).toLocaleString("en-PH", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                            })}`;
                        }

                        return (
                            <DashboardCard
                                key={card.key}
                                icon={card.icon}
                                title={card.title}
                                value={formattedValue}
                                change={kpi.change}
                                onClick={() => setActiveMetric(card.key)}
                            />
                        );
                    })}
                </div>

                {/* =========================================================
                    2. BRANCH COMPARISON GRAPH
                    OWNER ONLY
                ========================================================= */}

                {isOwner && (
                    <BranchComparisonCard
                        branches={visibleBranchComparison}
                        period={data.period?.label}
                    />
                )}

                {/* =========================================================
                    3. RECENT SALES + LOW STOCK
                ========================================================= */}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <RecentSalesTable sales={data.recentSales ?? []} />

                    <LowStockTable products={data.lowStockProducts ?? []} />
                </div>

                {/* =========================================================
                    4. ATTENDANCE + TASKS
                ========================================================= */}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <AttendanceSummary records={data.attendanceSummary ?? []} />

                    <PendingTasksPanel tasks={data.pendingTasksList ?? []} />
                </div>
            </div>

            {/* =============================================================
                KPI DETAILS MODAL

                Monthly Revenue remains clickable.

                Backend now sends current-month revenue and current-month
                branch breakdown to this same modal.
            ============================================================= */}

            <KpiDetailModal
                isOpen={!!activeMetric}
                onClose={() => setActiveMetric(null)}
                title={activeCardDef?.title}
                kpi={activeMetric ? data.kpis?.[activeMetric] : null}
            />
        </AppLayout>
    );
}
