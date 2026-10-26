import { useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";

import { Download, Eye, Receipt } from "lucide-react";

import AppLayout from "@/Components/Layout/AppLayout";
import ActionDropdown from "@/Components/UI/ActionDropdown";
import Badge from "@/Components/UI/Badge";
import Button from "@/Components/UI/Button";
import DataTable from "@/Components/UI/DataTable";
import Modal from "@/Components/UI/Modal";

const paymentLabel = {
    cash: "Cash",
    gcash: "GCash",
    other: "Other",
};

function formatCurrency(value) {
    return `₱${Number(value ?? 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

/**
 * Receipt modal
 */
function ReceiptModal({ sale, isOpen, onClose }) {
    if (!sale) {
        return null;
    }

    const downloadUrl = route("sales.receipt.pdf", sale.id);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Sales receipt"
            maxWidth="md"
        >
            <div className="space-y-5">
                {/* Receipt */}
                <div className="overflow-hidden rounded-2xl border border-border bg-white">
                    {/* Header */}
                    <div className="border-b border-dashed border-border px-6 py-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFDE59] text-black">
                            <Receipt className="size-6" />
                        </div>

                        <h2 className="mt-3 text-lg font-bold text-text-primary">
                            Mabi Sip & Bites
                        </h2>

                        <p className="mt-1 text-sm text-text-secondary">
                            {sale.branch_name}
                        </p>

                        <p className="mt-1 text-xs text-text-secondary">
                            Sales Receipt
                        </p>
                    </div>

                    {/* Transaction information */}
                    <div className="space-y-3 border-b border-dashed border-border px-6 py-5 text-sm">
                        <div className="flex items-start justify-between gap-4">
                            <span className="text-text-secondary">
                                Transaction
                            </span>

                            <span className="text-right font-medium text-text-primary">
                                {sale.transaction_number}
                            </span>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                            <span className="text-text-secondary">Date</span>

                            <span className="text-right font-medium text-text-primary">
                                {formatDate(sale.sale_date)}
                            </span>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                            <span className="text-text-secondary">Staff</span>

                            <span className="text-right font-medium text-text-primary">
                                {sale.staff_name || "—"}
                            </span>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                            <span className="text-text-secondary">Payment</span>

                            <Badge variant="neutral">
                                {paymentLabel[sale.payment_method] ||
                                    sale.payment_method}
                            </Badge>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="px-6 py-5">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Items
                        </p>

                        <div className="space-y-4">
                            {sale.items?.length > 0 ? (
                                sale.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start justify-between gap-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-text-primary">
                                                {item.product_name}

                                                {item.size_oz
                                                    ? ` (${item.size_oz} oz)`
                                                    : ""}
                                            </p>

                                            <p className="mt-1 text-xs text-text-secondary">
                                                {item.quantity} ×{" "}
                                                {formatCurrency(
                                                    item.unit_price,
                                                )}
                                            </p>
                                        </div>

                                        <p className="shrink-0 text-sm font-medium text-text-primary">
                                            {formatCurrency(item.subtotal)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-text-secondary">
                                    No item information available.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="border-t border-dashed border-border bg-muted px-6 py-5">
                        <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-text-primary">
                                Total
                            </span>

                            <span className="text-xl font-bold text-text-primary">
                                {formatCurrency(sale.total_amount)}
                            </span>
                        </div>
                    </div>

                    <div className="px-6 py-4 text-center">
                        <p className="text-xs text-text-secondary">
                            Thank you for your purchase!
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Close
                    </Button>

                    <a
                        href={downloadUrl}
                        className="inline-flex items-center justify-center gap-2 rounded-dropdown bg-[#FFDE59] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-95"
                    >
                        <Download className="size-4" />
                        Download PDF
                    </a>
                </div>
            </div>
        </Modal>
    );
}

export default function SalesIndex({ sales = [], selectedBranchId = null }) {
    const { props } = usePage();

    const user = props.auth?.user;
    const branches = props.branches || [];

    const isOwner = user?.role === "owner";

    const [viewingReceipt, setViewingReceipt] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | Client-side safety filter
    |--------------------------------------------------------------------------
    |
    | The controller already filters the database query.
    | This also keeps the rendered list aligned with the selected branch.
    |
    */
    const records = useMemo(() => {
        if (!isOwner || !selectedBranchId) {
            return sales;
        }

        return sales.filter(
            (sale) => String(sale.branch_id) === String(selectedBranchId),
        );
    }, [sales, selectedBranchId, isOwner]);

    /*
    |--------------------------------------------------------------------------
    | Branch filter
    |--------------------------------------------------------------------------
    |
    | If your global AppLayout branch selector is already navigating with
    | ?branch_id=, this backend supports it immediately.
    |
    | This function is also available if you later move the selector here.
    |
    */
    function changeBranch(branchId) {
        router.get(
            route("sales.index"),
            branchId
                ? {
                      branch_id: branchId,
                  }
                : {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    const columns = [
        {
            key: "transaction_number",
            header: "Transaction",
        },

        {
            key: "branch_name",
            header: "Branch",
        },

        {
            key: "staff_name",
            header: "Staff",
        },

        {
            key: "payment_method",
            header: "Payment",

            render: (row) => (
                <Badge variant="neutral">
                    {paymentLabel[row.payment_method] || row.payment_method}
                </Badge>
            ),
        },

        {
            key: "total_amount",
            header: "Amount",

            render: (row) => formatCurrency(row.total_amount),
        },
    ];

    return (
        <AppLayout
            title="Sales"
            subtitle="Completed sales and transaction details"
        >
            <Head title="Sales" />

            <DataTable
                columns={columns}
                data={records}
                actions={(row) => (
                    <ActionDropdown
                        items={[
                            {
                                key: "receipt",
                                label: "View receipt",
                                icon: Eye,

                                onClick: () => setViewingReceipt(row),
                            },
                        ]}
                    />
                )}
                emptyIcon={Receipt}
                emptyTitle="No sales found"
                emptyDescription={
                    selectedBranchId
                        ? "There are no completed sales for the selected branch."
                        : "Completed sales will appear here."
                }
            />

            <ReceiptModal
                sale={viewingReceipt}
                isOpen={!!viewingReceipt}
                onClose={() => setViewingReceipt(null)}
            />
        </AppLayout>
    );
}
