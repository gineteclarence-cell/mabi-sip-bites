import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
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

function emptyForm(defaultBranchId) {
  return {
    name: '', category: '', branch_id: defaultBranchId ?? '',
    stock: '', low_stock_threshold: '10', cost_price: '', selling_price: '',
  };
}

function ProductForm({ initial, onSubmit, onCancel, submitLabel, loading, branches }) {
  const [form, setForm] = useState(initial || emptyForm(branches[0]?.id));
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(
      {
        name: form.name,
        category: form.category,
        branch_id: form.branch_id,
        stock: form.stock,
        low_stock_threshold: form.low_stock_threshold,
        cost_price: form.cost_price,
        selling_price: form.selling_price,
        sku: form.sku,
        unit: form.unit || 'pcs',
        image_url: form.image_url,
      },
      { onError: setErrors }
    );
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
        {branches.map((b) => (
          <option key={b.id} value={b.id}>{b.name.replace('Mabi Sip and Bites ', '')}</option>
        ))}
      </Select>
      <Input
        label="Image URL"
        value={form.image_url || ''}
        onChange={(v) => setForm((f) => ({ ...f, image_url: v }))}
        error={errors.image_url}
        placeholder="https://example.com/milk-tea.jpg"
        helpText="Optional — shown on the POS ordering screen"
      />
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
          error={errors.cost_price}
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

function InventoryPageContent({ products, branches }) {
  const {
    records, isSubmitting,
    creating, viewing, editing, archiving,
    openCreate, closeCreate, createRecord,
    openView, closeView,
    openEdit, closeEdit, updateRecord,
    openArchive, closeArchive, confirmArchive,
  } = useArchivableRecords({
    records: products,
    storeRoute: 'inventory.store',
    updateRouteName: 'inventory.update',
    module: 'inventory',
  });

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
        <ProductForm onSubmit={createRecord} onCancel={closeCreate} submitLabel="Create product" loading={isSubmitting} branches={branches} />
      </Modal>

      <Modal isOpen={!!editing} onClose={closeEdit} title="Edit product" maxWidth="md">
        {editing && (
          <ProductForm
            initial={editing}
            onSubmit={(data, opts) => updateRecord(editing.id, data, opts)}
            onCancel={closeEdit}
            submitLabel="Save changes"
            loading={isSubmitting}
            branches={branches}
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

export default function InventoryIndex({ products }) {
  const { props } = usePage();
  const branches = props.branches || [];

  return (
    <AppLayout title="Inventory" subtitle="Track stock levels across both branches">
      <Head title="Inventory" />
      <InventoryPageContent products={products} branches={branches} />
    </AppLayout>
  );
}
