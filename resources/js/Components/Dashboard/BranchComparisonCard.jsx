import { useMemo, useState } from "react";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import { PhilippinePeso, ReceiptText, Users } from "lucide-react";

/*
|--------------------------------------------------------------------------
| Graph Metrics
|--------------------------------------------------------------------------
|
| User can switch between:
|
| Revenue      = current month
| Transactions = current month
| Staff        = current active staff
|
*/
const metrics = [
    {
        key: "revenue",
        label: "Revenue",
        icon: PhilippinePeso,
    },
    {
        key: "transactions",
        label: "Transactions",
        icon: ReceiptText,
    },
    {
        key: "staff",
        label: "Staff",
        icon: Users,
    },
];

function formatCurrency(value) {
    return `₱${Number(value ?? 0).toLocaleString("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}

/*
|--------------------------------------------------------------------------
| Tooltip
|--------------------------------------------------------------------------
*/
function CustomTooltip({ active, payload, label, metric }) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const value = payload[0]?.value ?? 0;

    let displayValue = value;

    if (metric === "revenue") {
        displayValue = formatCurrency(value);
    }

    if (metric === "transactions") {
        displayValue = `${Number(value).toLocaleString()} ${
            Number(value) === 1 ? "transaction" : "transactions"
        }`;
    }

    if (metric === "staff") {
        displayValue = `${Number(value).toLocaleString()} ${
            Number(value) === 1 ? "staff member" : "staff members"
        }`;
    }

    return (
        <div className="min-w-[170px] rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
            <p className="text-sm font-semibold text-gray-900">{label}</p>

            <p className="mt-1 text-sm text-gray-600">{displayValue}</p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Branch Comparison Graph
|--------------------------------------------------------------------------
*/
export default function BranchComparisonCard({ branches = [], period }) {
    const [metric, setMetric] = useState("revenue");

    /*
     * Format backend data for Recharts.
     */
    const chartData = useMemo(
        () =>
            branches.map((branch) => ({
                name: branch.branchName || `Branch ${branch.branchId}`,

                revenue: Number(branch.revenue ?? 0),

                transactions: Number(branch.transactions ?? 0),

                staff: Number(branch.staff ?? 0),
            })),
        [branches],
    );

    const selectedMetric = metrics.find((item) => item.key === metric);

    /*
     * Short formatter for the Y Axis.
     */
    const formatYAxis = (value) => {
        if (metric !== "revenue") {
            return Number(value).toLocaleString();
        }

        if (value >= 1000000) {
            return `₱${(value / 1000000).toFixed(1)}M`;
        }

        if (value >= 1000) {
            return `₱${(value / 1000).toFixed(1)}K`;
        }

        return `₱${value}`;
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {/* ============================================================
                HEADER
            ============================================================ */}

            <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">
                        Branch comparison
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Compare branch performance
                        {period ? ` • ${period}` : ""}
                    </p>
                </div>

                {/* ========================================================
                    METRIC SELECTOR
                ======================================================== */}

                <div className="flex w-fit flex-wrap items-center gap-1 rounded-xl bg-gray-100 p-1">
                    {metrics.map((item) => {
                        const Icon = item.icon;

                        const isActive = metric === item.key;

                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setMetric(item.key)}
                                className={[
                                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm",

                                    isActive
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:bg-white/60 hover:text-gray-900",
                                ].join(" ")}
                            >
                                <Icon size={15} strokeWidth={1.8} />

                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ============================================================
                GRAPH
            ============================================================ */}

            {chartData.length > 0 ? (
                <div className="px-3 pb-5 pt-6 sm:px-5">
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 15,
                                    left: metric === "revenue" ? 10 : 0,
                                    bottom: 5,
                                }}
                                barCategoryGap="35%"
                            >
                                <CartesianGrid
                                    stroke="#E5E7EB"
                                    strokeDasharray="4 4"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{
                                        fill: "#64748B",
                                        fontSize: 12,
                                    }}
                                    dy={10}
                                />

                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    width={metric === "revenue" ? 70 : 45}
                                    tick={{
                                        fill: "#64748B",
                                        fontSize: 12,
                                    }}
                                    tickFormatter={formatYAxis}
                                    allowDecimals={false}
                                />

                                <Tooltip
                                    cursor={{
                                        fill: "rgba(15, 23, 42, 0.035)",
                                    }}
                                    content={(props) => (
                                        <CustomTooltip
                                            {...props}
                                            metric={metric}
                                        />
                                    )}
                                />

                                <Bar
                                    dataKey={metric}
                                    name={selectedMetric?.label}
                                    fill="#FACC15"
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={110}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ====================================================
                        SMALL VALUES SUMMARY
                    ==================================================== */}

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {chartData.map((branch) => (
                            <div
                                key={branch.name}
                                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                            >
                                <div>
                                    <p className="text-xs text-gray-500">
                                        {branch.name}
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {metric === "revenue"
                                            ? formatCurrency(branch[metric])
                                            : Number(
                                                  branch[metric],
                                              ).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-50 text-yellow-700">
                                    {selectedMetric?.icon &&
                                        (() => {
                                            const Icon = selectedMetric.icon;

                                            return <Icon size={17} />;
                                        })()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex h-[300px] items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                            No branch comparison data
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            Branch data will appear here once available.
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}
