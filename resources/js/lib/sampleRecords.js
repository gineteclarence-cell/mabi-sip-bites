/**
 * Sample records for Phase 6 table pages. Shaped to mirror the real
 * database columns from 02_DATABASE_DESIGN.md so swapping to real
 * Inertia props in Phase 7 requires no field renaming.
 */

export const sampleBranches = [
  { id: 1, name: 'Mabi Sip and Bites Branch 1', location: 'Calaca, Batangas', contact_number: '09171234567', status: 'active' },
  { id: 2, name: 'Mabi Sip and Bites Branch 2', location: 'Lemery, Batangas', contact_number: '09181234567', status: 'active' },
];

export const sampleProducts = [
  { id: 1, branch_id: 1, branch_name: 'Branch 1', name: 'Classic Milk Tea', category: 'Milk Tea', sku: 'SKU-1-001', unit: 'pcs', stock: 8, low_stock_threshold: 10, cost_price: 35, selling_price: 79, status: 'active' },
  { id: 2, branch_id: 1, branch_name: 'Branch 1', name: 'Wintermelon Milk Tea', category: 'Milk Tea', sku: 'SKU-1-002', unit: 'pcs', stock: 42, low_stock_threshold: 10, cost_price: 38, selling_price: 85, status: 'active' },
  { id: 3, branch_id: 1, branch_name: 'Branch 1', name: 'Okinawa Milk Tea', category: 'Milk Tea', sku: 'SKU-1-003', unit: 'pcs', stock: 30, low_stock_threshold: 10, cost_price: 40, selling_price: 89, status: 'active' },
  { id: 4, branch_id: 1, branch_name: 'Branch 1', name: 'Burger', category: 'Meals', sku: 'SKU-1-004', unit: 'pcs', stock: 25, low_stock_threshold: 10, cost_price: 45, selling_price: 99, status: 'active' },
  { id: 5, branch_id: 1, branch_name: 'Branch 1', name: 'Fries', category: 'Snacks', sku: 'SKU-1-005', unit: 'pcs', stock: 60, low_stock_threshold: 10, cost_price: 20, selling_price: 55, status: 'active' },
  { id: 6, branch_id: 1, branch_name: 'Branch 1', name: 'Nachos', category: 'Snacks', sku: 'SKU-1-006', unit: 'pcs', stock: 18, low_stock_threshold: 10, cost_price: 30, selling_price: 75, status: 'active' },
  { id: 7, branch_id: 1, branch_name: 'Branch 1', name: 'Siomai', category: 'Snacks', sku: 'SKU-1-007', unit: 'pcs', stock: 6, low_stock_threshold: 10, cost_price: 18, selling_price: 50, status: 'active' },
  { id: 8, branch_id: 2, branch_name: 'Branch 2', name: 'Classic Milk Tea', category: 'Milk Tea', sku: 'SKU-2-001', unit: 'pcs', stock: 55, low_stock_threshold: 10, cost_price: 35, selling_price: 79, status: 'active' },
  { id: 9, branch_id: 2, branch_name: 'Branch 2', name: 'Wintermelon Milk Tea', category: 'Milk Tea', sku: 'SKU-2-002', unit: 'pcs', stock: 9, low_stock_threshold: 10, cost_price: 38, selling_price: 85, status: 'active' },
  { id: 10, branch_id: 2, branch_name: 'Branch 2', name: 'Okinawa Milk Tea', category: 'Milk Tea', sku: 'SKU-2-003', unit: 'pcs', stock: 40, low_stock_threshold: 10, cost_price: 40, selling_price: 89, status: 'active' },
  { id: 11, branch_id: 2, branch_name: 'Branch 2', name: 'Burger', category: 'Meals', sku: 'SKU-2-004', unit: 'pcs', stock: 33, low_stock_threshold: 10, cost_price: 45, selling_price: 99, status: 'active' },
  { id: 12, branch_id: 2, branch_name: 'Branch 2', name: 'Fries', category: 'Snacks', sku: 'SKU-2-005', unit: 'pcs', stock: 48, low_stock_threshold: 10, cost_price: 20, selling_price: 55, status: 'active' },
  { id: 13, branch_id: 2, branch_name: 'Branch 2', name: 'Nachos', category: 'Snacks', sku: 'SKU-2-006', unit: 'pcs', stock: 22, low_stock_threshold: 10, cost_price: 30, selling_price: 75, status: 'active' },
  { id: 14, branch_id: 2, branch_name: 'Branch 2', name: 'Siomai', category: 'Snacks', sku: 'SKU-2-007', unit: 'pcs', stock: 27, low_stock_threshold: 10, cost_price: 18, selling_price: 50, status: 'active' },
];

export const sampleStaff = [
  { id: 1, branch_id: null, branch_name: '—', name: 'Mabel Reyes', email: 'owner@mabisipbites.test', contact_number: '09171112222', role: 'owner', status: 'active' },
  { id: 2, branch_id: 1, branch_name: 'Branch 1', name: 'Carlo Santos', email: 'manager.branch1@mabisipbites.test', contact_number: '09172223333', role: 'manager', status: 'active' },
  { id: 3, branch_id: 2, branch_name: 'Branch 2', name: 'Diana Cruz', email: 'manager.branch2@mabisipbites.test', contact_number: '09183334444', role: 'manager', status: 'active' },
  { id: 4, branch_id: 1, branch_name: 'Branch 1', name: 'Jasmine Lopez', email: 'staff.branch1@mabisipbites.test', contact_number: '09174445555', role: 'staff', status: 'active' },
  { id: 5, branch_id: 2, branch_name: 'Branch 2', name: 'Miguel Torres', email: 'staff.branch2@mabisipbites.test', contact_number: '09185556666', role: 'staff', status: 'active' },
];

export const sampleCustomers = [
  { id: 1, name: 'Liza Fernandez', contact_number: '09190001111', branch_id: 1 },
  { id: 2, name: 'Ramon Aquino', contact_number: '09190002222', branch_id: 1 },
  { id: 3, name: 'Bea Villanueva', contact_number: '09190003333', branch_id: 2 },
  { id: 4, name: 'Noel Garcia', contact_number: '09190004444', branch_id: 2 },
];

export const sampleSales = [
  { id: 1, branch_id: 1, branch_name: 'Branch 1', customer_id: 1, customer_name: 'Liza Fernandez', staff_id: 4, staff_name: 'Jasmine Lopez', transaction_number: 'TXN-20260628-0031', total_amount: 245, payment_method: 'cash', sale_date: '2026-06-28T14:32:00', status: 'active' },
  { id: 2, branch_id: 2, branch_name: 'Branch 2', customer_id: 3, customer_name: 'Bea Villanueva', staff_id: 5, staff_name: 'Miguel Torres', transaction_number: 'TXN-20260628-0030', total_amount: 410, payment_method: 'gcash', sale_date: '2026-06-28T13:58:00', status: 'active' },
  { id: 3, branch_id: 1, branch_name: 'Branch 1', customer_id: null, customer_name: 'Walk-in', staff_id: 4, staff_name: 'Jasmine Lopez', transaction_number: 'TXN-20260628-0029', total_amount: 89, payment_method: 'cash', sale_date: '2026-06-28T13:10:00', status: 'active' },
  { id: 4, branch_id: 2, branch_name: 'Branch 2', customer_id: 4, customer_name: 'Noel Garcia', staff_id: 5, staff_name: 'Miguel Torres', transaction_number: 'TXN-20260628-0028', total_amount: 312, payment_method: 'cash', sale_date: '2026-06-28T12:45:00', status: 'active' },
  { id: 5, branch_id: 1, branch_name: 'Branch 1', customer_id: 2, customer_name: 'Ramon Aquino', staff_id: 4, staff_name: 'Jasmine Lopez', transaction_number: 'TXN-20260628-0027', total_amount: 178, payment_method: 'gcash', sale_date: '2026-06-28T11:20:00', status: 'active' },
];

export const sampleAttendance = [
  { id: 1, user_id: 4, staff_name: 'Jasmine Lopez', branch_id: 1, branch_name: 'Branch 1', work_date: '2026-06-28', time_in: '2026-06-28T08:05:00', time_out: null, status: 'present', remarks: null },
  { id: 2, user_id: 5, staff_name: 'Miguel Torres', branch_id: 2, branch_name: 'Branch 2', work_date: '2026-06-28', time_in: '2026-06-28T08:12:00', time_out: null, status: 'present', remarks: null },
  { id: 3, user_id: 2, staff_name: 'Carlo Santos', branch_id: 1, branch_name: 'Branch 1', work_date: '2026-06-28', time_in: '2026-06-28T07:58:00', time_out: null, status: 'present', remarks: null },
  { id: 4, user_id: 3, staff_name: 'Diana Cruz', branch_id: 2, branch_name: 'Branch 2', work_date: '2026-06-28', time_in: '2026-06-28T08:20:00', time_out: null, status: 'late', remarks: 'Traffic delay' },
];

export const sampleTasks = [
  { id: 1, branch_id: 1, branch_name: 'Branch 1', assigned_to: 4, assigned_to_name: 'Jasmine Lopez', assigned_by: 2, assigned_by_name: 'Carlo Santos', title: 'Restock milk tea supplies', description: 'Check syrup and powder levels before weekend rush.', priority: 'high', status: 'pending', due_date: '2026-06-30' },
  { id: 2, branch_id: 1, branch_name: 'Branch 1', assigned_to: 4, assigned_to_name: 'Jasmine Lopez', assigned_by: 2, assigned_by_name: 'Carlo Santos', title: 'Clean espresso machine', description: 'Weekly deep clean of the espresso machine.', priority: 'medium', status: 'in_progress', due_date: '2026-06-29' },
  { id: 3, branch_id: 2, branch_name: 'Branch 2', assigned_to: 5, assigned_to_name: 'Miguel Torres', assigned_by: 3, assigned_by_name: 'Diana Cruz', title: 'Update price board', description: 'Reflect new pricing for seasonal drinks.', priority: 'low', status: 'pending', due_date: '2026-07-03' },
  { id: 4, branch_id: 2, branch_name: 'Branch 2', assigned_to: 5, assigned_to_name: 'Miguel Torres', assigned_by: 3, assigned_by_name: 'Diana Cruz', title: 'Count daily cash drawer', description: 'Reconcile cash drawer against POS total.', priority: 'high', status: 'completed', due_date: '2026-06-27' },
];
