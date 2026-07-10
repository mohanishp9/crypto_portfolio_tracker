import type { ReactNode, HTMLAttributes } from "react";

type CardElevation = "raised" | "elevated";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: CardElevation;
  children: ReactNode;
}

const elevationClasses: Record<CardElevation, string> = {
  raised:
    "bg-surface-secondary border border-border-primary rounded-md shadow-[var(--shadow-raised)]",
  elevated:
    "bg-surface-secondary border border-border-primary rounded-md shadow-[var(--shadow-elevated)]",
};

export const Card = ({
  elevation = "raised",
  children,
  className = "",
  ...props
}: CardProps) => {
  return (
    <div className={`${elevationClasses[elevation]} ${className}`} {...props}>
      {children}
    </div>
  );
};

/* Sub-components for common card patterns */

export const CardHeader = ({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`px-4 py-4 border-b border-border-primary ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardBody = ({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
);