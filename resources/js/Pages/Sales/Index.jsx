import { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { Plus, Receipt, Trash2, AlertCircle } from 'lucide-react';
import AppLayout from '@/Components/Layout/AppLayout';
import DataTable from '@/Components/UI/DataTable';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import Modal from '@/Components/UI/Modal';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import Button from '@/Components/UI/Button';
import Input from '@/Components/UI/Input';
import Select from '@/Components/UI/Select';
import Badge from '@/Components/UI/Badge';
import RecordDetailModal from '@/Components/Records/RecordDetailModal';
import { useArchivableRecords } from '@/lib/useArchivableRecords';
import { sampleSales, sampleBranches, sampleCustomers, sampleStaff, sampleProducts } from '@/lib/sampleRecords';

const paymentLabel = { cash: 'Cash', gcash: 'GCash', other: 'Other' };

/**
 * SALE CREATION CONTRACT (matches App\Http\Requests\StoreSaleRequest):
 *   { branch_id, customer_id, staff_id, payment_method, items: [{ product_id, quantity }] }
 *
 * total_amount is never sent by the client — the server recalculates it
 * from current product prices and performs the stock deduction inside a
 * DB transaction with row locking. This form's "live total" is a preview
 * only; the authoritative total comes back from the server response.
 *
 * Editing an existing sale is intentionally not supported: once stock has
 * been deducted, changing line items would require recalculating deltas
 * across potentially-changed prices and re-validating stock, which is
 * real complexity outside what 07_BACKEND_CONTROLLERS_AND_ROUTES.md
 * describes ("Inventory Stock Behavior" only covers creation). The Sale
 * route group excludes `update` for this reason — so this page only
 * offers View and Archive in the action menu, not Edit.
 */

function emptyLineItem() {
  return { lineId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, product_id: '', quantity: 1 };
}

function emptyForm() {
  return {
    branch_id: sampleBranches[0]?.id ?? '',
    customer_id: '',
    staff_id: '',
    payment_method: 'cash',
    items: [emptyLineItem()],
  };
}

function SaleForm({ onSubmit, onCancel, submitLabel, loading }) {
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const branchStaff = sampleStaff.filter((s) => String(s.branch_id) === String(form.branch_id) && s.role === 'staff');
  const branchCustomers = sampleCustomers.filter((c) => String(c.branch_id) === String(form.branch_id));
  const branchProducts = sampleProducts.filter(
    (p) => String(p.branch_id) === String(form.branch_id) && p.status === 'active'
  );

  function updateLine(lineId, patch) {
    setForm((f) => ({
      ...f,
      items: f.items.map((line) => (line.lineId === lineId ? { ...line, ...patch } : line)),
    }));
  }

  function addLine() {
    setForm((f) => ({ ...f, items: [...f.items, emptyLineItem()] }));
  }

  function removeLine(lineId) {
    setForm((f) => ({ ...f, items: f.items.filter((line) => line.lineId !== lineId) }));
  }

  const lineDetails = useMemo(
    () =>
      form.items.map((line) => {
        const product = branchProducts.find((p) => String(p.id) === String(line.product_id));
        const quantity = Number(line.quantity) || 0;
        const subtotal = product ? product.selling_price * quantity : 0;
        const exceedsStock = product ? quantity > product.stock : false;
        return { ...line, product, quantity, subtotal, exceedsStock };
      }),
    [form.items, branchProducts]
  );

  const total = lineDetails.reduce((sum, l) => sum + l.subtotal, 0);

  function validate() {
    const next = {};
    if (!form.branch_id) next.branch_id = 'Branch is required.';
    if (!form.staff_id) next.staff_id = 'Staff is required.';

    const validLines = lineDetails.filter((l) => l.product_id && l.quantity > 0);
    if (validLines.length === 0) {
      next.items = 'Add at least one product.';
    } else if (lineDetails.some((l) => l.product_id && l.exceedsStock)) {
      next.items = 'One or more items exceed available stock.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const branch = sampleBranches.find((b) => String(b.id) === String(form.branch_id));
    const staff = sampleStaff.find((s) => String(s.id) === String(form.staff_id));
    const customer = sampleCustomers.find((c) => String(c.id) === String(form.customer_id));
    const validLines = lineDetails.filter((l) => l.product_id && l.quantity > 0);

    // Shape sent to the server matches StoreSaleRequest exactly:
    // { branch_id, customer_id, staff_id, payment_method, items }
    // The fields below (branch_name, staff_name, etc.) are added only for
    // the in-memory sample-state preview used before Phase 7's real
    // Inertia props are wired into this page; the server response would
    // supply these display fields itself.
    onSubmit({
      branch_id: Number(form.branch_id),
      branch_name: branch?.name?.replace('Mabi Sip and Bites ', '') || '',
      customer_id: form.customer_id ? Number(form.customer_id) : null,
      customer_name: customer?.name || 'Walk-in',
      staff_id: Number(form.staff_id),
      staff_name: staff?.name || '',
      payment_method: form.payment_method,
      items: validLines.map((l) => ({ product_id: Number(l.product_id), quantity: l.quantity })),
      total_amount: total,
      sale_date: new Date().toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Branch"
          value={form.branch_id}
          onChange={(v) => setForm((f) => ({ ...f, branch_id: v, staff_id: '', customer_id: '', items: [emptyLineItem()] }))}
          error={errors.branch_id}
          required
        >
          <option value="">Select branch</option>
          {sampleBranches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>

        <Select
          label="Staff"
          value={form.staff_id}
          onChange={(v) => setForm((f) => ({ ...f, staff_id: v }))}
          error={errors.staff_id}
          required
        >
          <option value="">Select staff</option>
          {branchStaff.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </div>

      <Select
        label="Customer"
        value={form.customer_id}
        onChange={(v) => setForm((f) => ({ ...f, customer_id: v }))}
        helpText="Leave blank for walk-in customer"
      >
        <option value="">Walk-in</option>
        {branchCustomers.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Select>

      <Select
        label="Payment method"
        value={form.payment_method}
        onChange={(v) => setForm((f) => ({ ...f, payment_method: v }))}
        required
      >
        <option value="cash">Cash</option>
        <option value="gcash">GCash</option>
        <option value="other">Other</option>
      </Select>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-text-primary">
            Items <span className="text-danger">*</span>
          </label>
          <button
            type="button"
            onClick={addLine}
            className="text-sm font-medium text-brand-ink hover:underline"
          >
            + Add item
          </button>
        </div>

        <div className="space-y-2.5">
          {lineDetails.map((line) => (
            <div key={line.lineId} className="flex items-start gap-2">
              <Select
                value={line.product_id}
                onChange={(v) => updateLine(line.lineId, { product_id: v })}
                className="flex-1"
              >
                <option value="">Select product</option>
                {branchProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₱{Number(p.selling_price).toFixed(2)} ({p.stock} in stock)
                  </option>
                ))}
              </Select>

              <Input
                inputModeType="numeric"
                value={String(line.quantity)}
                onChange={(v) => updateLine(line.lineId, { quantity: v === '' ? '' : Number(v) })}
                className="w-20 text-center"
                placeholder="Qty"
              />

              <button
                type="button"
                onClick={() => removeLine(line.lineId)}
                disabled={form.items.length === 1}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input text-text-secondary hover:bg-muted hover:text-danger disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Remove item"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>

        {lineDetails.some((l) => l.exceedsStock) && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="size-3.5" />
            One or more items exceed available stock.
          </p>
        )}

        {errors.items && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="size-3.5" />
            {errors.items}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-dropdown border border-border bg-muted px-4 py-3">
        <span className="text-sm font-medium text-text-secondary">Total</span>
        <span className="text-lg font-semibold text-text-primary font-display">
          ₱{total.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}

function SalesPageContent() {
  const {
    records, isSubmitting,
    creating, viewing, archiving,
    openCreate, closeCreate, createRecord,
    openView, closeView,
    openArchive, closeArchive, confirmArchive,
  } = useArchivableRecords(sampleSales, { entityLabel: 'Sale' });

  const columns = [
    { key: 'transaction_number', header: 'Transaction' },
    { key: 'branch_name', header: 'Branch' },
    { key: 'staff_name', header: 'Staff' },
    { key: 'payment_method', header: 'Payment', render: (row) => <Badge variant="neutral">{paymentLabel[row.payment_method]}</Badge> },
    { key: 'total_amount', header: 'Amount', render: (row) => `₱${Number(row.total_amount).toFixed(2)}` },
  ];

  const viewFields = [
    { key: 'transaction_number', label: 'Transaction number' },
    { key: 'branch_name', label: 'Branch' },
    { key: 'staff_name', label: 'Staff' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'payment_method', label: 'Payment method', render: (r) => paymentLabel[r.payment_method] },
    { key: 'total_amount', label: 'Total amount', render: (r) => `₱${Number(r.total_amount).toFixed(2)}` },
    { key: 'sale_date', label: 'Date', render: (r) => new Date(r.sale_date).toLocaleString() },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" leftIcon={<Plus className="size-4" />} onClick={openCreate}>
          Record sale
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={records}
        actions={(row) => (
          <ActionDropdown
            items={[
              { key: 'view', label: 'View', onClick: () => openView(row) },
              { key: 'archive', label: 'Archive', onClick: () => openArchive(row) },
            ]}
          />
        )}
        emptyIcon={Receipt}
        emptyTitle="No sales recorded yet"
        emptyDescription="Sales you record will appear here."
        emptyActionLabel="Record sale"
        onEmptyAction={openCreate}
      />

      <Modal isOpen={creating} onClose={closeCreate} title="Record sale" maxWidth="lg">
        <SaleForm onSubmit={createRecord} onCancel={closeCreate} submitLabel="Save sale" loading={isSubmitting} />
      </Modal>

      <RecordDetailModal isOpen={!!viewing} onClose={closeView} title="Sale details" record={viewing} fields={viewFields} />

      <ConfirmModal
        isOpen={!!archiving}
        onClose={closeArchive}
        onConfirm={confirmArchive}
        intent="archive"
        title="Archive this sale?"
        description="You can restore it later from Archived Records."
        loading={isSubmitting}
      />
    </>
  );
}

export default function SalesIndex() {
  return (
    <AppLayout title="Sales" subtitle="Transactions across both branches">
      <Head title="Sales" />
      <SalesPageContent />
    </AppLayout>
  );
}
