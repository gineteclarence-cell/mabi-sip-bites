/**
 * Sample data for the Dashboard page.
 *
 * Shape mirrors the props DashboardController will eventually pass via
 * Inertia::render('Dashboard', [...]) in Phase 7. When that controller
 * is wired up, Dashboard.jsx's `dashboardData` prop will receive the
 * same keys from the server — at that point, simply remove the
 * `?? dashboardSampleData` fallback in Dashboard.jsx. No component
 * changes needed beyond that.
 */
export const dashboardSampleData = {
  branches: [
    { id: 1, name: 'Branch 1' },
    { id: 2, name: 'Branch 2' },
  ],

  kpis: {
    totalRevenue: {
      value: 184250,
      format: 'currency',
      change: { direction: 'up', label: '+12.4% vs last week' },
      breakdown: [
        { branchId: 1, branchName: 'Branch 1', value: 98700 },
        { branchId: 2, branchName: 'Branch 2', value: 85550 },
      ],
    },
    todaysSales: {
      value: 7420,
      format: 'currency',
      change: { direction: 'up', label: '+8.1% vs yesterday' },
      breakdown: [
        { branchId: 1, branchName: 'Branch 1', value: 4100 },
        { branchId: 2, branchName: 'Branch 2', value: 3320 },
      ],
    },
    totalTransactions: {
      value: 312,
      format: 'number',
      change: { direction: 'up', label: '+5.2% vs last week' },
      breakdown: [
        { branchId: 1, branchName: 'Branch 1', value: 168 },
        { branchId: 2, branchName: 'Branch 2', value: 144 },
      ],
    },
    lowStockItems: {
      value: 3,
      format: 'number',
      change: { direction: 'down', label: '-2 vs last week' },
      breakdown: [
        { branchId: 1, branchName: 'Branch 1', value: 2 },
        { branchId: 2, branchName: 'Branch 2', value: 1 },
      ],
    },
    activeStaff: {
      value: 4,
      format: 'number',
      change: { direction: 'up', label: 'No change' },
      breakdown: [
        { branchId: 1, branchName: 'Branch 1', value: 2 },
        { branchId: 2, branchName: 'Branch 2', value: 2 },
      ],
    },
    attendanceToday: {
      value: '4/4',
      format: 'text',
      change: { direction: 'up', label: 'All staff present' },
      breakdown: [
        { branchId: 1, branchName: 'Branch 1', value: '2/2' },
        { branchId: 2, branchName: 'Branch 2', value: '2/2' },
      ],
    },
    pendingTasks: {
      value: 5,
      format: 'number',
      change: { direction: 'down', label: '-1 vs yesterday' },
      breakdown: [
        { branchId: 1, branchName: 'Branch 1', value: 3 },
        { branchId: 2, branchName: 'Branch 2', value: 2 },
      ],
    },
    branchGrowth: {
      value: '+9.7%',
      format: 'text',
      change: { direction: 'up', label: 'Combined, vs last month' },
      breakdown: [
        { branchId: 1, branchName: 'Branch 1', value: '+11.2%' },
        { branchId: 2, branchName: 'Branch 2', value: '+8.0%' },
      ],
    },
  },

  branchComparison: [
    { branchId: 1, branchName: 'Branch 1', revenue: 98700, transactions: 168, staff: 2 },
    { branchId: 2, branchName: 'Branch 2', revenue: 85550, transactions: 144, staff: 2 },
  ],

  recentSales: [
    { id: 1, transactionNumber: 'TXN-20260628-0031', branchName: 'Branch 1', staffName: 'Jasmine Lopez', amount: 245, paymentMethod: 'cash', saleDate: '2026-06-28 14:32' },
    { id: 2, transactionNumber: 'TXN-20260628-0030', branchName: 'Branch 2', staffName: 'Miguel Torres', amount: 410, paymentMethod: 'gcash', saleDate: '2026-06-28 13:58' },
    { id: 3, transactionNumber: 'TXN-20260628-0029', branchName: 'Branch 1', staffName: 'Jasmine Lopez', amount: 89, paymentMethod: 'cash', saleDate: '2026-06-28 13:10' },
    { id: 4, transactionNumber: 'TXN-20260628-0028', branchName: 'Branch 2', staffName: 'Miguel Torres', amount: 312, paymentMethod: 'cash', saleDate: '2026-06-28 12:45' },
    { id: 5, transactionNumber: 'TXN-20260628-0027', branchName: 'Branch 1', staffName: 'Jasmine Lopez', amount: 178, paymentMethod: 'gcash', saleDate: '2026-06-28 11:20' },
  ],

  lowStockProducts: [
    { id: 1, name: 'Classic Milk Tea', branchName: 'Branch 1', stock: 8, lowStockThreshold: 10 },
    { id: 2, name: 'Siomai', branchName: 'Branch 1', stock: 6, lowStockThreshold: 10 },
    { id: 3, name: 'Wintermelon Milk Tea', branchName: 'Branch 2', stock: 9, lowStockThreshold: 10 },
  ],

  attendanceSummary: [
    { id: 1, staffName: 'Jasmine Lopez', branchName: 'Branch 1', timeIn: '08:05 AM', timeOut: null, status: 'present' },
    { id: 2, staffName: 'Miguel Torres', branchName: 'Branch 2', timeIn: '08:12 AM', timeOut: null, status: 'present' },
    { id: 3, staffName: 'Carlo Santos', branchName: 'Branch 1', timeIn: '07:58 AM', timeOut: null, status: 'present' },
    { id: 4, staffName: 'Diana Cruz', branchName: 'Branch 2', timeIn: '08:20 AM', timeOut: null, status: 'late' },
  ],

  pendingTasksList: [
    { id: 1, title: 'Restock milk tea supplies', branchName: 'Branch 1', assignedTo: 'Jasmine Lopez', priority: 'high', dueDate: '2026-06-30' },
    { id: 2, title: 'Clean espresso machine', branchName: 'Branch 1', assignedTo: 'Jasmine Lopez', priority: 'medium', dueDate: '2026-06-29' },
    { id: 3, title: 'Update price board', branchName: 'Branch 2', assignedTo: 'Miguel Torres', priority: 'low', dueDate: '2026-07-03' },
    { id: 4, title: 'Train new staff on POS', branchName: 'Branch 2', assignedTo: 'Miguel Torres', priority: 'medium', dueDate: '2026-07-01' },
    { id: 5, title: 'Organize storage area', branchName: 'Branch 1', assignedTo: 'Jasmine Lopez', priority: 'low', dueDate: '2026-07-05' },
  ],
};
