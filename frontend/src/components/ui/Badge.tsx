import type { ReactNode, HTMLAttributes } from "react";

type BadgeTone = "positive" | "negative" | "neutral" | "warning";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

const toneClasses: Record<BadgeTone, string> = {
  positive:
    "text-positive bg-positive-subtle border-positive/20",
  negative:
    "text-negative bg-negative-subtle border-negative/20",
  neutral:
    "text-text-secondary bg-surface-tertiary border-border-primary",
  warning:
    "text-warning bg-warning-subtle border-warning/20",
};

export const Badge = ({
  tone = "neutral",
  children,
  className = "",
  ...props
}: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium font-mono border ${toneClasses[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};