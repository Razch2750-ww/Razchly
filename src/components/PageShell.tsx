/**
 * PageShell — shared layout wrapper per Impeccable Product Register.
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
    <div className={`flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text ${className}`}>
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
    <header className="flex items-start justify-between mb-6 md:mb-8 gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl md:text-[1.75rem] font-bold text-app-text-bright tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-app-text/60 text-sm mt-1">{subtitle}</p>}
      </div>

      {mobileActions && (
        <div className="flex items-center gap-2 md:hidden shrink-0 mt-0.5">
          {mobileActions}
        </div>
      )}

      {actions && (
        <div className="hidden md:flex items-center gap-2 shrink-0 mt-0.5">
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
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-app-accent1 flex items-center">{icon}</span>}
        <h2 className="text-base font-semibold text-app-text-bright">{children}</h2>
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
  primary:   "bg-app-accent1 text-white hover:opacity-90",
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
    <button
      {...rest}
      className={[
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-medium text-sm transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent1/50",
        hasLabel ? "h-9 px-4" : "h-9 w-9",
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
    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border border-dashed border-app-border text-center">
      <div className="w-12 h-12 rounded-2xl bg-app-card border border-app-border flex items-center justify-center text-app-text/40 mb-4">
        {icon}
      </div>
      <p className="font-semibold text-app-text-bright mb-1">{title}</p>
      {description && <p className="text-app-text/60 text-sm max-w-xs mt-1">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

const kpiTint: Record<string, string> = {
  accent:  "from-app-accent1/8",
  success: "from-app-success/8",
  danger:  "from-app-danger/6",
  neutral: "from-app-card",
};

const kpiIconTint: Record<string, string> = {
  accent:  "bg-app-accent1/12 text-app-accent1",
  success: "bg-app-success/12 text-app-success",
  danger:  "bg-app-danger/10 text-app-danger",
  neutral: "bg-app-hover text-app-text",
};

export function KpiCard({ label, value, sub, icon, onClick, color = "accent" }: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  color?: "accent" | "success" | "danger" | "neutral";
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={[
        "relative bg-app-card rounded-2xl p-5 border border-app-border overflow-hidden",
        onClick ? "cursor-pointer hover:border-app-accent1/30 transition-colors" : "",
      ].join(" ")}
    >
      
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-app-text/60 text-xs font-medium mb-2">{label}</p>
          <p className="text-xl font-bold text-app-text-bright leading-none">{value}</p>
          {sub && <div className="mt-1.5 text-xs">{sub}</div>}
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${kpiIconTint[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
