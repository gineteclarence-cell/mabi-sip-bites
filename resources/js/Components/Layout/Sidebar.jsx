import { usePage } from '@inertiajs/react';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Package,
  Users,
  CalendarCheck,
  ListTodo,
  Building2,
  BarChart3,
  Archive,
  LogOut,
  X,
} from 'lucide-react';
import NavItem from './NavItem';
import { cn } from '@/lib/utils';

/**
 * `roles` mirrors routes/web.php's middleware('role:...') groups exactly:
 *   - Branches: owner only
 *   - Staff: owner + manager
 *   - everything else: all three roles (branch-scoped server-side)
 *
 * This list hides links a role has no route access to, so the sidebar
 * never shows something that would just 403 if clicked. It is NOT the
 * security boundary itself — that's routes/web.php and the controllers.
 * A Manager typing /branches directly still gets blocked server-side
 * regardless of what this array says.
 */
const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, routeName: 'dashboard', roles: ['owner', 'manager', 'staff'] },
  { key: 'sales', label: 'Sales', icon: Receipt, routeName: 'sales.index', roles: ['owner', 'manager', 'staff'] },
  { key: 'pos', label: 'Order', icon: ShoppingCart, routeName: 'pos.index', roles: ['owner', 'manager', 'staff'] },
  { key: 'inventory', label: 'Inventory', icon: Package, routeName: 'inventory.index', roles: ['owner', 'manager', 'staff'] },
  { key: 'staff', label: 'Staff', icon: Users, routeName: 'staff.index', roles: ['owner', 'manager'] },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck, routeName: 'attendance.index', roles: ['owner', 'manager', 'staff'] },
  { key: 'tasks', label: 'Tasks', icon: ListTodo, routeName: 'tasks.index', roles: ['owner', 'manager', 'staff'] },
  { key: 'branches', label: 'Branches', icon: Building2, routeName: 'branches.index', roles: ['owner'] },
  { key: 'reports', label: 'Reports', icon: BarChart3, routeName: 'reports.index', roles: ['owner', 'manager', 'staff'] },
  { key: 'archived', label: 'Archived Records', icon: Archive, routeName: 'archive.index', roles: ['owner', 'manager', 'staff'] },
];

/**
 * Sidebar
 *
 * Desktop: fixed, always visible, pure black (#0A0A0A).
 * Mobile: slides in as an overlay drawer, controlled by isOpen/onClose.
 *
 * Active state is determined by matching the current Inertia URL against
 * each item's resolved route() URL — falls back to a simple path-prefix
 * check if the named route doesn't exist yet (earlier phases before that
 * controller/route is wired up).
 *
 * Usage (inside AppLayout):
 *   <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} onLogoutClick={openLogoutModal} />
 */
export default function Sidebar({ isOpen, onClose, onLogoutClick }) {
  const { url, props } = usePage();
  const userRole = props.auth?.user?.role;

  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole));

  function isActive(routeName) {
    try {
      if (typeof route === 'function' && route().current) {
        return route().current(routeName) || route().current(`${routeName}.*`);
      }
    } catch {
      // route() helper not available yet or route not registered — fall through.
    }
    const segment = routeName.split('.')[0];
    return segment !== 'dashboard' ? url.startsWith(`/${segment}`) : url === '/dashboard';
  }

  function resolveHref(routeName) {
    try {
      if (typeof route === 'function') return route(routeName);
    } catch {
      // not registered yet
    }
    const segment = routeName.split('.')[0];
    return segment === 'dashboard' ? '/dashboard' : `/${segment}`;
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-dropdown bg-sidebar-active">
            <span className="font-display text-sm font-bold text-brand-ink">MB</span>
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-white">Mabi Sip &amp; Bites</p>
            <p className="text-[11px] text-white/50">Store Management</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-dropdown p-1.5 text-white/60 hover:bg-sidebar-hover hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {visibleNavItems.map((item) => (
          <NavItem
            key={item.key}
            href={resolveHref(item.routeName)}
            icon={item.icon}
            label={item.label}
            active={isActive(item.routeName)}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <NavItem icon={LogOut} label="Logout" onClick={onLogoutClick} />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile: overlay drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden transition-opacity',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden={!isOpen}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-64 transition-transform duration-200',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
