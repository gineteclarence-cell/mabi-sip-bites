import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Plus, Package } from 'lucide-react';
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
import { buildActiveActions } from '@/lib/buildActionItems';
import { sampleProducts, sampleBranches } from '@/lib/sampleRecords';

const emptyForm = {
  name: '', category: '', branch_id: sampleBranches[0]?.id ?? '',
  stock: '', low_stock_threshold: '10', cost_price: '', selling_price: '',
};

function ProductForm({ initial, onSubmit, onCancel, submitLabel, loading }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [errors, setErrors] = useState({});

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Product name is required.';
    if (!form.category.trim()) next.category = 'Category is required.';
    if (!form.branch_id) next.branch_id = 'Branch is required.';
    if (form.stock === '' || Number(form.stock) < 0) next.stock = 'Stock must be 0 or more.';
    if (form.low_stock_threshold === '' || Number(form.low_stock_threshold) < 0) next.low_stock_threshold = 'Required, 0 or more.';
    if (form.selling_price === '' || Number(form.selling_price) < 0) next.selling_price = 'Selling price is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    const branch = sampleBranches.find((b) => String(b.id) === String(form.branch_id));
    onSubmit({
      ...form,
      branch_id: Number(form.branch_id),
      branch_name: branch?.name?.replace('Mabi Sip and Bites ', '') || '',
      stock: Number(form.stock || 0),
      low_stock_threshold: Number(form.low_stock_threshold || 10),
      cost_price: Number(form.cost_price || 0),
      selling_price: Number(form.selling_price || 0),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Product name"
        value={form.name}
        onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        error={errors.name}
        placeholder="Classic Milk Tea"
        required
      />
      <Input
        label="Category"
        inputModeType="alpha"
        value={form.category}
        onChange={(v) => setForm((f) => ({ ...f, category: v }))}
        error={errors.category}
        placeholder="Milk Tea"
        required
      />
      <Select
        label="Branch"
        value={form.branch_id}
        onChange={(v) => setForm((f) => ({ ...f, branch_id: v }))}
        error={errors.branch_id}
        required
      >
        <option value="">Select branch</option>
        {sampleBranches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Stock"
          inputModeType="numeric"
          value={form.stock}
          onChange={(v) => setForm((f) => ({ ...f, stock: v }))}
          error={errors.stock}
          placeholder="0"
          required
        />
        <Input
          label="Low stock threshold"
          inputModeType="numeric"
          value={form.low_stock_threshold}
          onChange={(v) => setForm((f) => ({ ...f, low_stock_threshold: v }))}
          error={errors.low_stock_threshold}
          placeholder="10"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Cost price"
          inputModeType="money"
          value={form.cost_price}
          onChange={(v) => setForm((f) => ({ ...f, cost_price: v }))}
          placeholder="0.00"
        />
        <Input
          label="Selling price"
          inputModeType="money"
          value={form.selling_price}
          onChange={(v) => setForm((f) => ({ ...f, selling_price: v }))}
          error={errors.selling_price}
          placeholder="0.00"
          required
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}

function InventoryPageContent() {
  const {
    records, isSubmitting,
    creating, viewing, editing, archiving,
    openCreate, closeCreate, createRecord,
    openView, closeView,
    openEdit, closeEdit, updateRecord,
    openArchive, closeArchive, confirmArchive,
  } = useArchivableRecords(sampleProducts, { entityLabel: 'Product' });

  const columns = [
    { key: 'name', header: 'Product' },
    { key: 'category', header: 'Category' },
    { key: 'branch_name', header: 'Branch' },
    {
      key: 'stock',
      header: 'Stock',
      render: (row) =>
        row.stock <= row.low_stock_threshold ? (
          <Badge variant="warning">{row.stock} low</Badge>
        ) : (
          <span>{row.stock}</span>
        ),
    },
    { key: 'selling_price', header: 'Price', render: (row) => `₱${Number(row.selling_price).toFixed(2)}` },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={row.status === 'active' ? 'success' : 'neutral'}>{row.status}</Badge>,
    },
  ];

  const viewFields = [
    { key: 'name', label: 'Product name' },
    { key: 'category', label: 'Category' },
    { key: 'branch_name', label: 'Branch' },
    { key: 'sku', label: 'SKU' },
    { key: 'stock', label: 'Stock', render: (r) => `${r.stock} ${r.unit}` },
    { key: 'low_stock_threshold', label: 'Low stock threshold' },
    { key: 'cost_price', label: 'Cost price', render: (r) => `₱${Number(r.cost_price).toFixed(2)}` },
    { key: 'selling_price', label: 'Selling price', render: (r) => `₱${Number(r.selling_price).toFixed(2)}` },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge> },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" leftIcon={<Plus className="size-4" />} onClick={openCreate}>
          Add product
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={records}
        actions={(row) => (
          <ActionDropdown
            items={buildActiveActions({
              onView: () => openView(row),
              onEdit: () => openEdit(row),
              onArchive: () => openArchive(row),
            })}
          />
        )}
        emptyIcon={Package}
        emptyTitle="No products yet"
        emptyDescription="Products you add will appear here."
        emptyActionLabel="Add product"
        onEmptyAction={openCreate}
      />

      <Modal isOpen={creating} onClose={closeCreate} title="Add product" maxWidth="md">
        <ProductForm onSubmit={createRecord} onCancel={closeCreate} submitLabel="Create product" loading={isSubmitting} />
      </Modal>

      <Modal isOpen={!!editing} onClose={closeEdit} title="Edit product" maxWidth="md">
        {editing && (
          <ProductForm
            initial={editing}
            onSubmit={(data) => updateRecord(editing.id, data)}
            onCancel={closeEdit}
            submitLabel="Save changes"
            loading={isSubmitting}
          />
        )}
      </Modal>

      <RecordDetailModal isOpen={!!viewing} onClose={closeView} title="Product details" record={viewing} fields={viewFields} />

      <ConfirmModal
        isOpen={!!archiving}
        onClose={closeArchive}
        onConfirm={confirmArchive}
        intent="archive"
        title="Archive this product?"
        description="You can restore it later from Archived Records."
        loading={isSubmitting}
      />
    </>
  );
}

export default function InventoryIndex() {
  return (
    <AppLayout title="Inventory" subtitle="Track stock levels across both branches">
      <Head title="Inventory" />
      <InventoryPageContent />
    </AppLayout>
  );
}
