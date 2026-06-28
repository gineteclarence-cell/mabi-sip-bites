import Modal from '@/Components/UI/Modal';

/**
 * RecordDetailModal
 *
 * Generic "View" modal reused by every page. Pass a `fields` array
 * describing what to show; the record's raw values are read by `key`.
 *
 * Usage:
 *   <RecordDetailModal
 *     isOpen={!!viewing}
 *     onClose={closeView}
 *     title="Product details"
 *     record={viewing}
 *     fields={[
 *       { key: 'name', label: 'Product name' },
 *       { key: 'category', label: 'Category' },
 *       { key: 'stock', label: 'Stock', render: (r) => `${r.stock} ${r.unit}` },
 *     ]}
 *   />
 */
export default function RecordDetailModal({ isOpen, onClose, title, record, fields }) {
  if (!record) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="divide-y divide-border rounded-dropdown border border-border">
        {fields.map((field) => (
          <div key={field.key} className="flex items-start justify-between gap-4 px-4 py-3">
            <span className="text-sm text-text-secondary shrink-0">{field.label}</span>
            <span className="text-sm font-medium text-text-primary text-right">
              {field.render ? field.render(record) : (record[field.key] ?? '—')}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
