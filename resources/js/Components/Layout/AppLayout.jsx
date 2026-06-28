import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { ToastProvider, useToast } from '@/Components/UI/ToastProvider';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import Sidebar from './Sidebar';
import Header from './Header';

function AppLayoutInner({ title, subtitle, children }) {
  const { props } = usePage();
  const { auth, flash, branches = [] } = props;
  const { showToast } = useToast();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(auth?.user?.branch_id ?? null);

  // Toast Flash Bridge — listens to Inertia flash props after every server action.
  useEffect(() => {
    if (flash?.success) showToast({ type: 'success', title: flash.success });
    if (flash?.error) showToast({ type: 'error', title: flash.error });
  }, [flash]);

  function handleLogoutConfirm() {
    setLoggingOut(true);
    router.post(route('logout'), {}, {
      onFinish: () => {
        setLoggingOut(false);
        setLogoutModalOpen(false);
      },
    });
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <Sidebar
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onLogoutClick={() => setLogoutModalOpen(true)}
      />

      <div className="lg:pl-64">
        <Header
          title={title}
          subtitle={subtitle}
          user={auth?.user}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <main className="p-4 lg:p-6">{children}</main>
      </div>

      <ConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        intent="logout"
        title="Log out of Mabi Sip & Bites?"
        description="You'll need to sign in again to access the dashboard."
        loading={loggingOut}
      />
    </div>
  );
}

/**
 * AppLayout
 *
 * Wrap every authenticated page with this layout. It provides the
 * Sidebar, Header, logout confirmation flow, and the Toast Flash Bridge
 * (reads Inertia `flash.success` / `flash.error` props after every
 * controller redirect and surfaces them as bottom-right toasts).
 *
 * The ToastProvider lives here rather than in the root app file so that
 * unauthenticated pages (Login, Register) can mount their own provider
 * independently — see Pages/Auth/Login.jsx and Register.jsx.
 *
 * Usage (in a page component):
 *   export default function Index({ products }) {
 *     return (
 *       <AppLayout title="Inventory" subtitle="Track stock across both branches">
 *         ...page content...
 *       </AppLayout>
 *     );
 *   }
 */
export default function AppLayout({ title, subtitle, children }) {
  return (
    <ToastProvider>
      <AppLayoutInner title={title} subtitle={subtitle}>
        {children}
      </AppLayoutInner>
    </ToastProvider>
  );
}
