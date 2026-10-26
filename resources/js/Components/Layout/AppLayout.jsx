import { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";

import { useToast } from "@/Components/UI/ToastProvider";
import ConfirmModal from "@/Components/UI/ConfirmModal";

import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({ title, subtitle, children }) {
    const { props, url } = usePage();

    const { auth, flash, branches = [] } = props;

    const { showToast } = useToast();

    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    const [loggingOut, setLoggingOut] = useState(false);

    const params = new URLSearchParams(window.location.search);

    const branchFromUrl = params.get("branch_id");
    const rememberedBranch = auth?.user?.role === "owner"
        ? sessionStorage.getItem(`mabi-branch-${auth.user.id}`) : null;
    const initialBranch = branchFromUrl || rememberedBranch;

    useEffect(() => {
        if (auth?.user?.role !== "owner" || branchFromUrl || !rememberedBranch) return;
        const target = new URL(window.location.href);
        target.searchParams.set("branch_id", rememberedBranch);
        router.get(target.pathname + target.search, {}, { replace: true, preserveScroll: true });
    }, []);

    const [selectedBranchId, setSelectedBranchId] = useState(
        auth?.user?.role === "owner"
            ? initialBranch || null
            : auth?.user?.branch_id || null,
    );

    useEffect(() => {
        if (flash?.success) {
            showToast({
                type: "success",
                title: flash.success,
            });
        }

        if (flash?.error) {
            showToast({
                type: "error",
                title: flash.error,
            });
        }
    }, [flash]);

    useEffect(() => {
        const currentParams = new URLSearchParams(window.location.search);

        const currentBranch = currentParams.get("branch_id");

        if (auth?.user?.role === "owner") {
            setSelectedBranchId(currentBranch || rememberedBranch || null);
        } else {
            setSelectedBranchId(auth?.user?.branch_id || null);
        }
    }, [url, auth?.user?.branch_id, auth?.user?.role]);

    function handleBranchChange(branchId) {
        if (auth?.user?.role !== "owner") {
            return;
        }

        const value = branchId && branchId !== "all" ? branchId : null;

        setSelectedBranchId(value);
        if (value) sessionStorage.setItem(`mabi-branch-${auth.user.id}`, value);
        else sessionStorage.removeItem(`mabi-branch-${auth.user.id}`);

        const currentUrl = window.location.pathname;

        const currentParams = new URLSearchParams(window.location.search);

        if (value) {
            currentParams.set("branch_id", value);
        } else {
            currentParams.set("branch_id", "all");
        }

        const query = Object.fromEntries(currentParams.entries());

        router.get(currentUrl, query, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

    function handleLogoutConfirm() {
        setLoggingOut(true);

        router.post(
            route("logout"),
            {},
            {
                onSuccess: () =>
                    showToast({
                        type: "success",
                        title: "Logged out successfully.",
                    }),

                onFinish: () => {
                    setLoggingOut(false);
                    setLogoutModalOpen(false);
                },
            },
        );
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
                    onBranchChange={handleBranchChange}
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
