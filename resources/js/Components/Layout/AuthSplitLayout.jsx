import { Link } from '@inertiajs/react';

const stats = [
  { value: '2', label: 'Branches' },
  { value: '7', label: 'Products' },
  { value: '3', label: 'Staff roles' },
];

/**
 * AuthSplitLayout
 *
 * Shared shell for Login and Register. Left panel is the pure-black
 * brand showcase (logo, headline, stats) — stays identical on both
 * pages. Right panel is light/white and receives the actual form via
 * children, so Login and Register only differ in their form content.
 *
 * Usage:
 *   <AuthSplitLayout
 *     formTitle="Welcome back"
 *     formSubtitle="Sign in to manage your branches."
 *   >
 *     ...form...
 *   </AuthSplitLayout>
 */
export default function AuthSplitLayout({ formTitle, formSubtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel — brand showcase, hidden on small screens */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-dropdown bg-sidebar-active">
            <span className="font-display text-sm font-bold text-brand-ink">MB</span>
          </div>
          <span className="font-display text-sm font-bold text-white">
            Mabi Sip &amp; Bites
          </span>
        </Link>

        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            <span className="size-1.5 rounded-full bg-brand" />
            Internal platform
          </span>

          <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-white">
            Run both branches.
            <br />
            <span className="text-brand">In one place.</span>
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Track sales, inventory, attendance, and staff performance across
            every Mabi Sip &amp; Bites location from a single dashboard.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-dropdown border border-white/10 bg-white/[0.03] px-3 py-3"
              >
                <p className="font-display text-xl font-bold text-brand">{stat.value}</p>
                <p className="mt-0.5 text-xs text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} Mabi Sip &amp; Bites. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center bg-app-bg px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-card bg-sidebar">
              <span className="font-display text-base font-bold text-brand">MB</span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-text-primary">{formTitle}</h1>
          {formSubtitle && <p className="mt-1.5 text-sm text-text-secondary">{formSubtitle}</p>}

          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
