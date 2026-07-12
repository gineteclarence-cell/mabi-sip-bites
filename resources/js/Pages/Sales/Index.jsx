import { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
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

const paymentLabel = { cash: 'Cash', gcash: 'GCash', other: 'Other' };

/**
 * The server (SaleController::store) generates transaction_number,
 * recalculates total_amount from current product prices, and performs
 * the stock deduction inside a locked DB transaction. This form never
 * sends a transaction number or a trusted total — sending the items
 * array and letting the server be the source of truth for both is what
 * was missing before (the old sample-data version of this page just
 * never set transaction_number locally, which is why it showed blank).
 */

function emptyLineItem() {
  return { lineId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, product_id: '', quantity: 1 };
}

function emptyForm(defaultBranchId) {
  return {
    branch_id: defaultBranchId ?? '',
    customer_id: '',
    staff_id: '',
    payment_method: 'cash',
    items: [emptyLineItem()],
  };
}

function SaleForm({ onSubmit, onCancel, submitLabel, loading, branches, staffOptions, customerOptions, productOptions }) {
  const [form, setForm] = useState(emptyForm(branches[0]?.id));
  const [errors, setErrors] = useState({});

  const branchStaff = staffOptions.filter((s) => String(s.branch_id) === String(form.branch_id));
  const branchCustomers = customerOptions.filter((c) => String(c.branch_id) === String(form.branch_id));
  const branchProducts = productOptions.filter((p) => String(p.branch_id) === String(form.branch_id));

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

  function handleSubmit(e) {
    e.preventDefault();

    const validLines = lineDetails.filter((l) => l.product_id && l.quantity > 0);

    onSubmit(
      {
        branch_id: form.branch_id,
        customer_id: form.customer_id || null,
        staff_id: form.staff_id,
        payment_method: form.payment_method,
        items: validLines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
      },
      { onError: setErrors }
    );
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
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name.replace('Mabi Sip and Bites ', '')}</option>
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
          <button type="button" onClick={addLine} className="text-sm font-medium text-brand-ink hover:underline">
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
            One or more items exceed available stock. The server will reject this if not corrected.
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
        <span className="text-sm font-medium text-text-secondary">Estimated total</span>
        <span className="text-lg font-semibold text-text-primary font-display">₱{total.toFixed(2)}</span>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}

function SalesPageContent({ sales, branches, staffOptions, customerOptions, productOptions }) {
  const {
    records, isSubmitting,
    creating, viewing, archiving,
    openCreate, closeCreate, createRecord,
    openView, closeView,
    openArchive, closeArchive, confirmArchive,
  } = useArchivableRecords({
    records: sales,
    storeRoute: 'sales.store',
    updateRouteName: null, // sales have no update route — see note below
    module: 'sales',
  });

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
        <SaleForm
          onSubmit={createRecord}
          onCancel={closeCreate}
          submitLabel="Save sale"
          loading={isSubmitting}
          branches={branches}
          staffOptions={staffOptions}
          customerOptions={customerOptions}
          productOptions={productOptions}
        />
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

export default function SalesIndex({ sales, staffOptions = [], customerOptions = [], productOptions = [] }) {
  const { props } = usePage();
  const branches = props.branches || [];

  return (
    <AppLayout title="Sales" subtitle="Transactions across both branches">
      <Head title="Sales" />
      <SalesPageContent
        sales={sales}
        branches={branches}
        staffOptions={staffOptions}
        customerOptions={customerOptions}
        productOptions={productOptions}
      />
    </AppLayout>
  );
}
