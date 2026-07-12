import { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Minus, Trash2, ShoppingCart, ImageOff, Search } from 'lucide-react';
import AppLayout from '@/Components/Layout/AppLayout';
import Button from '@/Components/UI/Button';
import Select from '@/Components/UI/Select';
import Input from '@/Components/UI/Input';
import Badge from '@/Components/UI/Badge';
import { cn } from '@/lib/utils';

/**
 * POS (Point of Sale ordering screen)
 *
 * A separate, optional way to record a sale — /sales (the table-based
 * page) still exists exactly as before for anyone who prefers typing
 * values into a form. This page is the "on the spot" tap-to-order flow:
 * tap a product card, it lands in the cart on the right, adjust
 * quantity with steppers, pick a payment method, complete the sale.
 *
 * Both pages submit to the exact same route (sales.store) and therefore
 * the exact same SaleController::store() — server-side stock locking,
 * transaction-number generation, and total recalculation all apply
 * identically here. This page is just a different UI for building the
 * same { branch_id, staff_id, customer_id, payment_method, items }
 * payload.
 *
 * Branch/staff auto-fill: a Staff or Manager logged in here IS the
 * person ringing up the sale, so branch_id and staff_id are taken
 * directly from the authenticated user with no picker shown. Owner
 * doesn't ring up sales personally in the normal flow, so Owner gets an
 * explicit branch + staff picker before the product grid appears.
 */

function CartLine({ line, onIncrement, onDecrement, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{line.product.name}</p>
        <p className="text-xs text-text-secondary">₱{Number(line.product.selling_price).toFixed(2)} each</p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onDecrement}
          className="flex size-8 items-center justify-center rounded-dropdown border border-border text-text-secondary hover:bg-muted"
          aria-label="Decrease quantity"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-medium text-text-primary">{line.quantity}</span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={line.quantity >= line.product.stock}
          className="flex size-8 items-center justify-center rounded-dropdown border border-border text-text-secondary hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Increase quantity"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <p className="w-20 shrink-0 text-right text-sm font-semibold text-text-primary">
        ₱{(line.product.selling_price * line.quantity).toFixed(2)}
      </p>

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-text-muted hover:text-danger"
        aria-label="Remove from cart"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const isOutOfStock = product.stock <= 0;

  return (
    <button
      type="button"
      onClick={() => !isOutOfStock && onAdd(product)}
      disabled={isOutOfStock}
      className={cn(
        'group flex flex-col overflow-hidden rounded-card border border-border bg-white text-left transition-all',
        isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand hover:shadow-md active:scale-[0.98]'
      )}
    >
      <div className="flex aspect-square items-center justify-center bg-muted">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
        ) : (
          <ImageOff className="size-8 text-text-muted" />
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-text-primary">{product.name}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-brand-ink">₱{Number(product.selling_price).toFixed(2)}</span>
          {isOutOfStock ? (
            <Badge variant="danger">Out of stock</Badge>
          ) : product.stock <= 10 ? (
            <span className="text-xs text-warning">{product.stock} left</span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function POSPageContent({ branches, staffOptions, customerOptions, productOptions }) {
  const { props } = usePage();
  const authUser = props.auth?.user;
  const isOwner = authUser?.role === 'owner';

  const [selectedBranchId, setSelectedBranchId] = useState(isOwner ? '' : authUser?.branch_id);
  const [selectedStaffId, setSelectedStaffId] = useState(isOwner ? '' : authUser?.id);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]); // [{ product, quantity }]
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const branchProducts = productOptions.filter((p) => String(p.branch_id) === String(selectedBranchId));
  const branchStaff = staffOptions.filter((s) => String(s.branch_id) === String(selectedBranchId));
  const branchCustomers = customerOptions.filter((c) => String(c.branch_id) === String(selectedBranchId));

  const categories = useMemo(
    () => ['all', ...new Set(branchProducts.map((p) => p.category).filter(Boolean))],
    [branchProducts]
  );

  const filteredProducts = branchProducts.filter((p) => {
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return current;
        return current.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function incrementLine(productId) {
    setCart((current) =>
      current.map((l) =>
        l.product.id === productId && l.quantity < l.product.stock ? { ...l, quantity: l.quantity + 1 } : l
      )
    );
  }

  function decrementLine(productId) {
    setCart((current) =>
      current
        .map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId) {
    setCart((current) => current.filter((l) => l.product.id !== productId));
  }

  const total = cart.reduce((sum, l) => sum + l.product.selling_price * l.quantity, 0);

  function handleCompleteSale() {
    if (cart.length === 0 || !selectedBranchId || !selectedStaffId) return;

    setIsSubmitting(true);
    setErrors({});

    router.post(
      route('sales.store'),
      {
        branch_id: selectedBranchId,
        staff_id: selectedStaffId,
        customer_id: customerId || null,
        payment_method: paymentMethod,
        items: cart.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
      },
      {
        onSuccess: () => {
          setCart([]);
          setCustomerId('');
          setPaymentMethod('cash');
        },
        onError: setErrors,
        onFinish: () => setIsSubmitting(false),
      }
    );
  }

  // Owner must pick a branch + staff member before the grid is useful —
  // showing every branch's products mixed together would be confusing
  // and the stock numbers wouldn't mean anything without a branch
  // context anyway.
  if (isOwner && !selectedStaffId) {
    return (
      <div className="mx-auto max-w-md rounded-card border border-border bg-white p-6">
        <h2 className="text-base font-semibold text-text-primary">Start an order</h2>
        <p className="mt-1 text-sm text-text-secondary">Select the branch and staff member ringing up this sale.</p>

        <div className="mt-5 space-y-4">
          <Select label="Branch" value={selectedBranchId} onChange={(v) => { setSelectedBranchId(v); setSelectedStaffId(''); }} required>
            <option value="">Select branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name.replace('Mabi Sip and Bites ', '')}</option>
            ))}
          </Select>

          {selectedBranchId && (
            <Select label="Staff" value={selectedStaffId} onChange={setSelectedStaffId} required>
              <option value="">Select staff</option>
              {staffOptions.filter((s) => String(s.branch_id) === String(selectedBranchId)).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
      {/* Product grid */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            leftIcon={<Search className="size-4" />}
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search products..."
            className="sm:max-w-xs"
          />
          <div className="flex gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'shrink-0 rounded-dropdown px-3.5 py-2 text-sm font-medium transition-colors',
                  categoryFilter === cat ? 'bg-brand text-brand-ink' : 'bg-muted text-text-secondary hover:bg-border'
                )}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addToCart} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <p className="py-12 text-center text-sm text-text-secondary">No products match your search.</p>
        )}
      </div>

      {/* Cart panel */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-card border border-border bg-white p-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShoppingCart className="size-4 text-text-secondary" />
            <h3 className="text-sm font-semibold text-text-primary">Current order</h3>
            {cart.length > 0 && <Badge variant="brand">{cart.length}</Badge>}
          </div>

          {errors.items && (
            <p className="mt-3 rounded-dropdown bg-danger-bg px-3 py-2 text-xs text-danger">{errors.items}</p>
          )}

          <div className="max-h-[40vh] divide-y divide-border overflow-y-auto">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-secondary">Tap a product to add it here.</p>
            ) : (
              cart.map((line) => (
                <CartLine
                  key={line.product.id}
                  line={line}
                  onIncrement={() => incrementLine(line.product.id)}
                  onDecrement={() => decrementLine(line.product.id)}
                  onRemove={() => removeLine(line.product.id)}
                />
              ))
            )}
          </div>

          <div className="mt-3 space-y-3 border-t border-border pt-3">
            <Select label="Customer" value={customerId} onChange={setCustomerId} helpText="Leave blank for walk-in">
              <option value="">Walk-in</option>
              {branchCustomers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>

            <Select label="Payment method" value={paymentMethod} onChange={setPaymentMethod} required>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="other">Other</option>
            </Select>

            <div className="flex items-center justify-between rounded-dropdown bg-muted px-3.5 py-3">
              <span className="text-sm font-medium text-text-secondary">Total</span>
              <span className="text-xl font-bold text-text-primary font-display">₱{total.toFixed(2)}</span>
            </div>

            <Button
              variant="primary"
              className="w-full"
              loading={isSubmitting}
              disabled={cart.length === 0}
              onClick={handleCompleteSale}
            >
              Complete sale
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function POSIndex({ staffOptions = [], customerOptions = [], productOptions = [] }) {
  const { props } = usePage();
  const branches = props.branches || [];

  return (
    <AppLayout title="Order" subtitle="Tap to build an order, then complete the sale">
      <Head title="Order" />
      <POSPageContent
        branches={branches}
        staffOptions={staffOptions}
        customerOptions={customerOptions}
        productOptions={productOptions}
      />
    </AppLayout>
  );
}
