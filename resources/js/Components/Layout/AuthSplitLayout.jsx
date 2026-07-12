import { Link } from "@inertiajs/react";

/**
 * Shared authentication layout for Login and Register.
 *
 * The left panel contains the brand and platform context.
 * The right panel renders the form passed through children.
 */
export default function AuthSplitLayout({ formTitle, formSubtitle, children }) {
    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            {/* Left panel */}
            <div className="relative hidden flex-col overflow-hidden bg-sidebar px-10 py-9 lg:flex">
                {/* Subtle background grid */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />

                {/* Soft ambient light */}
                <div
                    className="pointer-events-none absolute -left-48 top-1/3 size-[480px] rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(255,222,89,0.07), transparent 68%)",
                    }}
                />

                {/* Brand */}
                <Link
                    href="/"
                    className="relative z-10 flex w-fit items-center gap-3"
                >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-sidebar-active">
                        <span className="font-display text-sm font-bold text-brand-ink">
                            MB
                        </span>
                    </div>

                    <div>
                        <p className="font-display text-sm font-bold text-white">
                            Mabi Sip &amp; Bites
                        </p>

                        <p className="mt-0.5 text-[11px] text-white/35">
                            Store management
                        </p>
                    </div>
                </Link>

                {/* Main content */}
                <div className="relative z-10 my-auto max-w-lg">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                        Internal workspace
                    </p>

                    <h2 className="mt-4 max-w-md font-display text-4xl font-bold leading-[1.12] tracking-[-0.035em] text-white">
                        One place to manage the day-to-day.
                    </h2>

                    <p className="mt-5 max-w-lg text-[15px] leading-7 text-white/55">
                        Keep sales, products, attendance, staff
                        responsibilities, and branch activity organized without
                        moving between separate tools.
                    </p>

                    <div className="mt-10 max-w-md border-l border-brand/40 pl-5">
                        <p className="text-sm font-medium text-white">
                            Built for daily store operations
                        </p>

                        <p className="mt-2 text-sm leading-6 text-white/40">
                            Owners and managers can review performance while
                            staff focus on the work assigned to their role.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 flex items-center justify-between border-t border-white/[0.06] pt-5">
                    <p className="text-xs text-white/30">
                        © {new Date().getFullYear()} Mabi Sip &amp; Bites
                    </p>

                    <p className="text-xs text-white/25">Internal use only</p>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex items-center justify-center bg-app-bg px-4 py-12">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="mb-6 flex justify-center lg:hidden">
                        <div className="flex size-11 items-center justify-center rounded-card bg-sidebar">
                            <span className="font-display text-base font-bold text-brand">
                                MB
                            </span>
                        </div>
                    </div>

                    <h1 className="font-display text-2xl font-bold text-text-primary">
                        {formTitle}
                    </h1>

                    {formSubtitle && (
                        <p className="mt-1.5 text-sm text-text-secondary">
                            {formSubtitle}
                        </p>
                    )}

                    <div className="mt-7">{children}</div>
                </div>
            </div>
        </div>
    );
}
