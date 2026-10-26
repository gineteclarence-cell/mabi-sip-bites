import { useMemo, useState } from "react";

import { Head, usePage } from "@inertiajs/react";

import { Plus, Search, Users } from "lucide-react";

import AppLayout from "@/Components/Layout/AppLayout";
import DataTable from "@/Components/UI/DataTable";
import ActionDropdown from "@/Components/UI/ActionDropdown";
import Modal from "@/Components/UI/Modal";
import ConfirmModal from "@/Components/UI/ConfirmModal";
import Button from "@/Components/UI/Button";
import Input from "@/Components/UI/Input";
import Select from "@/Components/UI/Select";
import Badge from "@/Components/UI/Badge";
import RecordDetailModal from "@/Components/Records/RecordDetailModal";

import { useArchivableRecords } from "@/lib/useArchivableRecords";

import { buildActiveActions } from "@/lib/buildActionItems";

const roleVariant = {
    owner: "brand",
    manager: "warning",
    staff: "neutral",
};

function emptyForm(defaultBranchId) {
    return {
        name: "",
        email: "",
        contact_number: "",
        role: "staff",
        branch_id: defaultBranchId ?? "",
        password: "",
        password_confirmation: "",
    };
}

function StaffForm({
    initial,
    onSubmit,
    onCancel,
    submitLabel,
    loading,
    isOwner,
    branches,
    selectedBranchId,
}) {
    const { props } = usePage();

    const currentUser = props.auth?.user;

    const defaultBranch =
        selectedBranchId || currentUser?.branch_id || branches[0]?.id || "";

    const [form, setForm] = useState(
        initial
            ? {
                  ...initial,

                  password: "",

                  password_confirmation: "",
              }
            : emptyForm(defaultBranch),
    );

    const [errors, setErrors] = useState({});

    function handleSubmit(event) {
        event.preventDefault();

        onSubmit(
            {
                name: form.name,

                email: form.email,

                contact_number: form.contact_number,

                role: form.role,

                branch_id: form.role === "owner" ? null : form.branch_id,

                password: form.password,

                password_confirmation: form.password_confirmation,
            },
            {
                onError: setErrors,
            },
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Full name"
                inputModeType="alpha"
                value={form.name}
                onChange={(value) =>
                    setForm((current) => ({
                        ...current,
                        name: value,
                    }))
                }
                error={errors.name}
                placeholder="Juan Dela Cruz"
                required
            />

            <Input
                label="Email"
                inputModeType="email"
                value={form.email}
                onChange={(value) =>
                    setForm((current) => ({
                        ...current,
                        email: value,
                    }))
                }
                error={errors.email}
                placeholder="staff@mabisipbites.test"
                required
            />

            <Input
                label="Contact number"
                inputModeType="contact"
                value={form.contact_number || ""}
                onChange={(value) =>
                    setForm((current) => ({
                        ...current,

                        contact_number: value,
                    }))
                }
                error={errors.contact_number}
                placeholder="09171234567"
                helpText="11 digits, starts with 09"
            />

            <div className="grid grid-cols-2 gap-4">
                <Select
                    label="Role"
                    value={form.role}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,
                            role: value,
                        }))
                    }
                    required
                    disabled={!isOwner}
                    helpText={
                        !isOwner
                            ? "Managers can only manage staff accounts."
                            : undefined
                    }
                >
                    {isOwner && <option value="owner">Owner</option>}

                    {isOwner && <option value="manager">Manager</option>}

                    <option value="staff">Staff</option>
                </Select>

                <Select
                    label="Branch"
                    value={form.role === "owner" ? "" : form.branch_id}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,

                            branch_id: value,
                        }))
                    }
                    error={errors.branch_id}
                    disabled={form.role === "owner" || !isOwner}
                    required={form.role !== "owner"}
                >
                    <option value="">
                        {form.role === "owner"
                            ? "All branches"
                            : "Select branch"}
                    </option>

                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name.replace("Mabi Sip and Bites ", "")}
                        </option>
                    ))}
                </Select>
            </div>

            {initial && (
                <div className="rounded-card border border-border bg-muted/40 p-4">
                    <p className="text-sm font-medium text-text-primary">
                        Password reset
                    </p>

                    <p className="mt-1 text-xs text-text-secondary">
                        Existing passwords cannot be viewed. Enter a new
                        password below only if this user forgot their password.
                    </p>
                </div>
            )}

            <Input
                label={initial ? "New password" : "Password"}
                inputModeType="password"
                value={form.password}
                onChange={(value) =>
                    setForm((current) => ({
                        ...current,

                        password: value,
                    }))
                }
                error={errors.password}
                placeholder={
                    initial
                        ? "Leave blank to keep current password"
                        : "Create a password"
                }
                helpText={
                    initial
                        ? "Enter a new password only when resetting this account."
                        : "Min 8 characters with a letter, number, and symbol"
                }
                required={!initial}
            />

            <Input
                label="Confirm password"
                inputModeType="password"
                value={form.password_confirmation}
                onChange={(value) =>
                    setForm((current) => ({
                        ...current,

                        password_confirmation: value,
                    }))
                }
                error={errors.password_confirmation}
                placeholder={
                    initial ? "Confirm new password" : "Re-enter password"
                }
                required={form.password !== ""}
            />

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>

                <Button type="submit" variant="primary" loading={loading}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

function StaffPageContent({ staff, branches, selectedBranchId }) {
    const { props } = usePage();

    const currentRole = props.auth?.user?.role;

    const isOwner = currentRole === "owner";

    const [search, setSearch] = useState("");

    const {
        records,
        isSubmitting,

        creating,
        viewing,
        editing,
        archiving,

        openCreate,
        closeCreate,
        createRecord,

        openView,
        closeView,

        openEdit,
        closeEdit,
        updateRecord,

        openArchive,
        closeArchive,
        confirmArchive,
    } = useArchivableRecords({
        records: staff,

        storeRoute: "staff.store",

        updateRouteName: "staff.update",

        module: "staff",
    });

    /*
    |--------------------------------------------------------------------------
    | Client-side search
    |--------------------------------------------------------------------------
    */

    const visibleRecords = useMemo(() => {
        let result = isOwner
            ? records
            : records.filter((record) => record.role === "staff");

        const term = search.trim().toLowerCase();

        if (term) {
            result = result.filter(
                (record) =>
                    record.name?.toLowerCase().includes(term) ||
                    record.email?.toLowerCase().includes(term) ||
                    record.branch_name?.toLowerCase().includes(term),
            );
        }

        return result;
    }, [records, isOwner, search]);

    const columns = [
        {
            key: "name",
            header: "Name",
        },

        {
            key: "email",
            header: "Email",
        },

        {
            key: "branch_name",
            header: "Branch",
        },

        {
            key: "role",
            header: "Role",

            render: (row) => (
                <Badge variant={roleVariant[row.role] || "neutral"}>
                    {row.role}
                </Badge>
            ),
        },

        {
            key: "status",
            header: "Status",

            render: (row) => (
                <Badge
                    variant={row.status === "active" ? "success" : "neutral"}
                >
                    {row.status}
                </Badge>
            ),
        },
    ];

    const viewFields = [
        {
            key: "name",
            label: "Full name",
        },

        {
            key: "email",
            label: "Email",
        },

        {
            key: "contact_number",
            label: "Contact number",
        },

        {
            key: "role",
            label: "Role",

            render: (row) => (
                <Badge variant={roleVariant[row.role] || "neutral"}>
                    {row.role}
                </Badge>
            ),
        },

        {
            key: "branch_name",
            label: "Branch",
        },

        {
            key: "status",
            label: "Status",

            render: (row) => (
                <Badge
                    variant={row.status === "active" ? "success" : "neutral"}
                >
                    {row.status}
                </Badge>
            ),
        },

        {
            key: "transactions_this_month",

            label: "Transactions this month",

            render: (row) =>
                row.role === "staff" ? (row.transactions_this_month ?? 0) : "—",
        },
    ];

    return (
        <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:max-w-sm">
                    <Input
                        leftIcon={<Search className="size-4" />}
                        value={search}
                        onChange={setSearch}
                        placeholder="Search staff..."
                    />
                </div>

                <Button
                    variant="primary"
                    leftIcon={<Plus className="size-4" />}
                    onClick={openCreate}
                >
                    Add staff
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={visibleRecords}
                actions={(row) => (
                    <ActionDropdown
                        items={buildActiveActions({
                            onView: () => openView(row),

                            onEdit: () => openEdit(row),

                            onArchive: () => openArchive(row),
                        })}
                    />
                )}
                emptyIcon={Users}
                emptyTitle="No staff found"
                emptyDescription={
                    selectedBranchId
                        ? "No staff members were found for the selected branch."
                        : "Staff you add will appear here."
                }
                emptyActionLabel="Add staff"
                onEmptyAction={openCreate}
            />

            <Modal
                isOpen={creating}
                onClose={closeCreate}
                title="Add staff"
                maxWidth="md"
            >
                <StaffForm
                    onSubmit={createRecord}
                    onCancel={closeCreate}
                    submitLabel="Create staff"
                    loading={isSubmitting}
                    isOwner={isOwner}
                    branches={branches}
                    selectedBranchId={selectedBranchId}
                />
            </Modal>

            <Modal
                isOpen={!!editing}
                onClose={closeEdit}
                title="Edit staff"
                maxWidth="md"
            >
                {editing && (
                    <StaffForm
                        initial={editing}
                        onSubmit={(data, options) =>
                            updateRecord(editing.id, data, options)
                        }
                        onCancel={closeEdit}
                        submitLabel="Save changes"
                        loading={isSubmitting}
                        isOwner={isOwner}
                        branches={branches}
                        selectedBranchId={selectedBranchId}
                    />
                )}
            </Modal>

            <RecordDetailModal
                isOpen={!!viewing}
                onClose={closeView}
                title="Staff details"
                record={viewing}
                fields={viewFields}
            />

            <ConfirmModal
                isOpen={!!archiving}
                onClose={closeArchive}
                onConfirm={confirmArchive}
                intent="archive"
                title="Archive this staff member?"
                description="You can restore it later from Archived Records."
                loading={isSubmitting}
            />
        </>
    );
}

export default function StaffIndex({ staff = [], selectedBranchId = null }) {
    const { props } = usePage();

    const branches = props.branches || [];

    const isOwner = props.auth?.user?.role === "owner";

    return (
        <AppLayout
            title="Staff"
            subtitle={
                isOwner
                    ? selectedBranchId
                        ? "Manage team members for the selected branch"
                        : "Manage team members across both branches"
                    : "Manage staff members for your branch"
            }
        >
            <Head title="Staff" />

            <StaffPageContent
                staff={staff}
                branches={branches}
                selectedBranchId={selectedBranchId}
            />
        </AppLayout>
    );
}
