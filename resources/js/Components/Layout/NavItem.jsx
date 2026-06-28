import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

/**
 * NavItem
 *
 * Single sidebar navigation link. Active state renders as a solid
 * brand-yellow pill with black text/icon against the pure-black sidebar —
 * this is the one place the brand asserts itself loudly and consistently.
 *
 * Usage:
 *   <NavItem href={route('dashboard')} icon={LayoutDashboard} label="Dashboard" active={isActive} />
 */
export default function NavItem({ href, icon: Icon, label, active = false, onClick, collapsed = false }) {
  const content = (
    <>
      <Icon className="size-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </>
  );

  const className = cn(
    'flex items-center gap-3 rounded-dropdown px-3 py-2.5 text-sm font-medium transition-colors',
    collapsed && 'justify-center px-2.5',
    active
      ? 'bg-sidebar-active text-brand-ink'
      : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn('w-full text-left', className)}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
