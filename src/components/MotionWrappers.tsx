import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
}

/**
 * Interactive surface used across the legacy feature pages.
 *
 * Razchly is an operational finance product, so this wrapper deliberately keeps
 * feedback quiet: no cursor tilt, spotlight, parallax, or perpetual animation.
 * Clickable surfaces remain keyboard reachable while the component API stays
 * compatible with the existing pages.
 */
export function HoverCard({ children, className = "", onClick, id }: HoverCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onClick();
  };

  return (
    <div
      id={id}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}

/**
 * Compatibility wrapper for page sections. Route-level motion is handled by
 * Layout; content remains stable while people scan financial data.
 */
export function ScrollReveal({ children, className = "", id }: ScrollRevealProps) {
  return <div id={id} className={className}>{children}</div>;
}

export function StaggerContainer({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return <div id={id} className={className}>{children}</div>;
}

export function StaggerItem({
  children,
  className = "",
  id,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div id={id} className={className} {...props}>
      {children}
    </div>
  );
}

export function TextReveal({
  text,
  className = "",
  id,
}: {
  text: string;
  className?: string;
  id?: string;
}) {
  return <span id={id} className={className}>{text}</span>;
}

/** Empty-state compatibility wrapper; intentionally static in Operate mode. */
export function MicroLoop({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
  type?: "waggle" | "pulse" | "float";
}) {
  return <div className={`inline-block ${className}`}>{children}</div>;
}
