import { useState } from "react";

import { Head, router } from "@inertiajs/react";

import {
    AlertTriangle,
    Boxes,
    Clock,
    DollarSign,
    FileDown,
    PackageX,
    Receipt,
    TrendingUp,
    UserCheck,
    UserX,
    Users,
} from "lucide-react";

import AppLayout from "@/Components/Layout/AppLayout";
import DashboardCard from "@/Components/UI/DashboardCard";
import Input from "@/Components/UI/Input";
import Button from "@/Components/UI/Button";
import Badge from "@/Components/UI/Badge";

const paymentLabel = {
    cash: "Cash",
    gcash: "GCash",
    other: "Other",
};

const tabs = [
    {
        key: "sales",
        label: "Sales",
        icon: Receipt,
    },
    {
        key: "inventory",
        label: "Inventory",
        icon: Boxes,
    },
    {
        key: "attendance",
        label: "Attendance",
        icon: Users,
    },
];

function money(value) {
    return `₱${Number(value ?? 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function buildExportUrl(routeName, startDate, endDate) {
    const params = new URLSearchParams(window.location.search);

    params.set("start_date", startDate);

    params.set("end_date", endDate);

    return `${route(routeName)}?${params.toString()}`;
}

function SalesReport({ report, startDate, endDate }) {
    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Sales Report</h2>

                    <p className="text-sm text-text-secondary">
                        Revenue and completed transactions for the selected
                        period.
                    </p>
                </div>

                <a
                    href={buildExportUrl(
                        "reports.sales-pdf",
                        startDate,
                        endDate,
                    )}
                >
                    <Button
                        variant="secondary"
                        leftIcon={<FileDown className="size-4" />}
                    >
                        Export Sales PDF
                    </Button>
                </a>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <DashboardCard
                    icon={DollarSign}
                    title="Total revenue"
                    value={money(report.totalRevenue)}
                />

                <DashboardCard
                    icon={Receipt}
                    title="Transactions"
                    value={report.totalTransactions}
                />

                <DashboardCard
                    icon={TrendingUp}
                    title="Average sale"
                    value={money(report.averageSale)}
                />
            </div>

            {report.byPaymentMethod?.length > 0 && (
                <div className="rounded-card border border-border bg-white p-5">
                    <h3 className="text-sm font-semibold">Payment summary</h3>

                    <div className="mt-3 divide-y divide-border">
                        {report.byPaymentMethod.map((row) => (
                            <div
                                key={row.method}
                                className="grid grid-cols-3 items-center gap-3 py-3"
                            >
                                <Badge variant="neutral">
                                    {paymentLabel[row.method] || row.method}
                                </Badge>

                                <span className="text-sm text-text-secondary">
                                    {row.count} transactions
                                </span>

                                <span className="text-right text-sm font-semibold">
                                    {money(row.total)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="overflow-x-auto rounded-card border border-border bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="px-4 py-3 text-left">Transaction</th>
                            <th className="px-4 py-3 text-left">Branch</th>
                            <th className="px-4 py-3 text-left">Staff</th>
                            <th className="px-4 py-3 text-left">Date</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                        {report.transactions?.map((row) => (
                            <tr key={row.transaction_number}>
                                <td className="px-4 py-3">
                                    {row.transaction_number}
                                </td>

                                <td className="px-4 py-3">{row.branch_name}</td>

                                <td className="px-4 py-3">{row.staff_name}</td>

                                <td className="px-4 py-3">{row.sale_date}</td>

                                <td className="px-4 py-3 text-right font-medium">
                                    {money(row.total_amount)}
                                </td>
                            </tr>
                        ))}

                        {!report.transactions?.length && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-10 text-center text-text-secondary"
                                >
                                    No sales for this period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function InventoryReport({ report, startDate, endDate }) {
    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Inventory Report</h2>

                    <p className="text-sm text-text-secondary">
                        Current ingredient inventory snapshot.
                    </p>
                </div>

                <a
                    href={buildExportUrl(
                        "reports.inventory-pdf",
                        startDate,
                        endDate,
                    )}
                >
                    <Button
                        variant="secondary"
                        leftIcon={<FileDown className="size-4" />}
                    >
                        Export Inventory PDF
                    </Button>
                </a>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardCard
                    icon={Boxes}
                    title="Ingredients"
                    value={report.totalIngredients}
                />

                <DashboardCard
                    icon={DollarSign}
                    title="Stock value"
                    value={money(report.totalStockValue)}
                />

                <DashboardCard
                    icon={AlertTriangle}
                    title="Low stock"
                    value={report.lowStockCount}
                />

                <DashboardCard
                    icon={PackageX}
                    title="Out of stock"
                    value={report.outOfStockCount}
                />
            </div>

            <div className="overflow-x-auto rounded-card border border-border bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="px-4 py-3 text-left">Ingredient</th>

                            <th className="px-4 py-3 text-left">Category</th>

                            <th className="px-4 py-3 text-left">Branch</th>

                            <th className="px-4 py-3 text-left">Stock</th>

                            <th className="px-4 py-3 text-left">Status</th>

                            <th className="px-4 py-3 text-left">Used by</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                        {report.ingredients?.map((row, index) => (
                            <tr key={`${row.branch_name}-${row.name}-${index}`}>
                                <td className="px-4 py-3 font-medium">
                                    {row.name}
                                </td>

                                <td className="px-4 py-3">{row.category}</td>

                                <td className="px-4 py-3">{row.branch_name}</td>

                                <td className="px-4 py-3">
                                    {row.stock} {row.unit}
                                </td>

                                <td className="px-4 py-3">
                                    <Badge
                                        variant={
                                            row.stock_status === "Available"
                                                ? "success"
                                                : "warning"
                                        }
                                    >
                                        {row.stock_status}
                                    </Badge>
                                </td>

                                <td className="px-4 py-3 text-text-secondary">
                                    {row.used_by?.length
                                        ? row.used_by.join(", ")
                                        : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function AttendanceReport({ report, startDate, endDate }) {
    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Attendance Report</h2>

                    <p className="text-sm text-text-secondary">
                        Staff attendance, sessions and total worked time.
                    </p>
                </div>

                <a
                    href={buildExportUrl(
                        "reports.attendance-pdf",
                        startDate,
                        endDate,
                    )}
                >
                    <Button
                        variant="secondary"
                        leftIcon={<FileDown className="size-4" />}
                    >
                        Export Attendance PDF
                    </Button>
                </a>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardCard
                    icon={Users}
                    title="Attendance logs"
                    value={report.totalLogs}
                />

                <DashboardCard
                    icon={UserCheck}
                    title="Present"
                    value={report.present}
                />

                <DashboardCard
                    icon={UserX}
                    title="Absent"
                    value={report.absent}
                />

                <DashboardCard
                    icon={Clock}
                    title="Total worked"
                    value={report.totalWorkedTime}
                />
            </div>

            <div className="overflow-x-auto rounded-card border border-border bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="px-4 py-3 text-left">Staff</th>

                            <th className="px-4 py-3 text-left">Branch</th>

                            <th className="px-4 py-3 text-left">Date</th>

                            <th className="px-4 py-3 text-left">First in</th>

                            <th className="px-4 py-3 text-left">Last out</th>

                            <th className="px-4 py-3 text-left">Sessions</th>

                            <th className="px-4 py-3 text-left">Worked</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                        {report.records?.map((row, index) => (
                            <tr
                                key={`${row.staff_name}-${row.work_date}-${index}`}
                            >
                                <td className="px-4 py-3 font-medium">
                                    {row.staff_name}
                                </td>

                                <td className="px-4 py-3">{row.branch_name}</td>

                                <td className="px-4 py-3">{row.work_date}</td>

                                <td className="px-4 py-3">
                                    {row.first_time_in}
                                </td>

                                <td className="px-4 py-3">
                                    {row.last_time_out}
                                </td>

                                <td className="px-4 py-3">{row.sessions}</td>

                                <td className="px-4 py-3 font-medium">
                                    {row.worked_time}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default function ReportsIndex({
    filters,
    salesReport,
    inventoryReport,
    attendanceReport,
}) {
    const [activeTab, setActiveTab] = useState("sales");

    const [startDate, setStartDate] = useState(filters.start_date);

    const [endDate, setEndDate] = useState(filters.end_date);

    function applyFilters() {
        const params = new URLSearchParams(window.location.search);

        params.set("start_date", startDate);

        params.set("end_date", endDate);

        router.get(
            route("reports.index"),
            Object.fromEntries(params.entries()),
            {
                preserveScroll: true,

                preserveState: true,

                replace: true,
            },
        );
    }

    return (
        <AppLayout
            title="Reports"
            subtitle="Separate sales, inventory and attendance reports"
        >
            <Head title="Reports" />

            <div className="mb-5 rounded-card border border-border bg-white px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="grid w-full grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,180px)_minmax(0,180px)_auto] lg:w-auto">
                        <Input
                            label="Start date"
                            type="date"
                            value={startDate}
                            onChange={setStartDate}
                            className="w-full min-w-0"
                        />
                        <Input
                            label="End date"
                            type="date"
                            value={endDate}
                            onChange={setEndDate}
                            min={startDate}
                            className="w-full min-w-0"
                        />
                        <Button
                            variant="outline"
                            onClick={applyFilters}
                            className="h-10 w-full whitespace-nowrap sm:w-auto"
                            disabled={!startDate || !endDate || endDate < startDate}
                        >
                            Apply dates
                        </Button>
                    </div>
                    <p className="text-xs text-text-secondary lg:pb-2 lg:text-right">
                        Branch: use the selector at the top-right.
                    </p>
                </div>
            </div>

            <div className="mb-6 flex w-fit rounded-xl bg-muted p-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={[
                                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",

                                activeTab === tab.key
                                    ? "bg-white text-text-primary shadow-sm"
                                    : "text-text-secondary hover:text-text-primary",
                            ].join(" ")}
                        >
                            <Icon className="size-4" />

                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === "sales" && (
                <SalesReport
                    report={salesReport}
                    startDate={startDate}
                    endDate={endDate}
                />
            )}

            {activeTab === "inventory" && (
                <InventoryReport
                    report={inventoryReport}
                    startDate={startDate}
                    endDate={endDate}
                />
            )}

            {activeTab === "attendance" && (
                <AttendanceReport
                    report={attendanceReport}
                    startDate={startDate}
                    endDate={endDate}
                />
            )}
        </AppLayout>
    );
}
