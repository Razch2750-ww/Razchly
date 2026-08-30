/**
 * PageShell - shared layout wrapper per Impeccable Product Register.
 *
 * Eliminates:
 * - Copy-paste header anti-pattern across 8 pages
 * - `flex items-center gap-4 hidden md:flex` class bug
 * - Uppercase eyebrow h2/label patterns everywhere
 * - Inconsistent button vocabulary
 */
import React from "react";

// ─── PageShell ────────────────────────────────────────────────────────────────

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  mobileActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ title, subtitle, actions, mobileActions, children, className = "" }: PageShellProps) {
  return (
    <div className={`route-workbench page-register app-page-shell flex h-full w-full flex-1 flex-col overflow-y-auto p-4 pb-32 text-app-text md:p-7 md:pb-8 ${className}`}>
      <PageHeader title={title} subtitle={subtitle} actions={actions} mobileActions={mobileActions} />
      {children}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  mobileActions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, mobileActions }: PageHeaderProps) {
  return (
    <header className="page-shell-header mb-6 flex items-start justify-between gap-4 md:mb-8">
      <div className="page-heading-copy min-w-0 flex-1">
        <p className="page-kicker" aria-hidden="true">
          <span>RZ</span>
          <span className="page-kicker-copy">Private register</span>
        </p>
        <h1 className="page-display-title text-2xl font-normal leading-tight text-app-text-bright md:text-[2.35rem]">
          {title}
        </h1>
        {subtitle && <p className="page-deck mt-2 max-w-[62ch] text-sm leading-relaxed text-app-text/65">{subtitle}</p>}
      </div>

      {mobileActions && (
        <div className="page-header-actions flex shrink-0 items-center gap-2 md:hidden">
          {mobileActions}
        </div>
      )}

      {actions && (
        <div className="page-header-actions hidden shrink-0 items-center gap-2 md:flex">
          {actions}
        </div>
      )}
    </header>
  );
}

// ─── SectionHeading ───────────────────────────────────────────────────────────

export function SectionHeading({ icon, children, action }: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-ledger-heading mb-4 flex items-end justify-between gap-4 border-b border-app-border pb-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-app-accent1 flex items-center">{icon}</span>}
        <h2 className="font-ledger text-xl leading-none text-app-text-bright">{children}</h2>
      </div>
      {action && <div className="text-sm">{action}</div>}
    </div>
  );
}

// ─── FieldLabel ───────────────────────────────────────────────────────────────

export function FieldLabel({ htmlFor, children, required }: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-app-text/70 mb-1.5">
      {children}
      {required && <span className="text-app-danger ml-1">*</span>}
    </label>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────

export type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

const variantCls: Record<BtnVariant, string> = {
  primary:   "bg-app-accent1 text-app-bg hover:opacity-90",
  secondary: "bg-app-card border border-app-border text-app-text-bright hover:bg-app-hover",
  ghost:     "text-app-text/70 hover:text-app-text-bright hover:bg-app-hover",
  danger:    "bg-app-danger/10 text-app-danger hover:bg-app-danger/20 border border-app-danger/20",
  success:   "bg-app-success/10 text-app-success hover:bg-app-success/20 border border-app-success/20",
};

export function ActionBtn({
  variant = "secondary",
  icon,
  children,
  className = "",
  ...rest
}: {
  variant?: BtnVariant;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const hasLabel = !!children;
  return (
    <button type="button"
      {...rest}
      className={[
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium text-sm transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent1/50",
        hasLabel ? "h-11 px-4" : "h-11 w-11",
        variantCls[variant],
        className,
      ].join(" ")}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      {children}
    </button>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state-ledger flex flex-col items-center justify-center border-y border-app-border px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center text-app-text/45">
        {icon}
      </div>
      <p className="font-semibold text-app-text-bright text-sm mb-1">{title}</p>
      {description && <p className="text-app-text/60 text-xs max-w-xs mt-0.5">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

const kpiIconTint: Record<string, string> = {
  accent:  "text-app-accent1",
  success: "text-app-success",
  danger:  "text-app-danger",
  neutral: "text-app-text/55",
};

export function KpiCard({ label, value, sub, icon, onClick, color = "accent" }: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  color?: "accent" | "success" | "danger" | "neutral";
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.09em] text-app-text/55">{label}</p>
          <div className="font-ledger text-[1.65rem] leading-none text-app-text-bright md:text-[2rem]">{value}</div>
          {sub && <div className="mt-1.5 text-xs text-app-text/70">{sub}</div>}
        </div>
        {icon && (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center ${kpiIconTint[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </>
  );

  const className = [
    "kpi-ledger w-full border border-app-border bg-app-card p-4 text-left transition-colors md:p-5",
    onClick ? "cursor-pointer hover:border-app-accent1/40 hover:bg-app-hover/50" : "",
  ].join(" ");

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>{content}</button>
  ) : (
    <article className={className}>{content}</article>
  );
}

// ─── SegmentedTabs ────────────────────────────────────────────────────────────

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { id: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}) {
  return (
    <div className={`register-tabs inline-flex items-center gap-0 border-y border-app-border bg-transparent ${className}`}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={active}
            className={`flex min-h-11 items-center gap-1.5 border-b-2 border-transparent px-3 text-xs font-medium transition-colors ${
              active
                ? "border-app-accent1 text-app-text-bright font-semibold"
                : "text-app-text/70 hover:text-app-text-bright hover:bg-app-hover"
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
