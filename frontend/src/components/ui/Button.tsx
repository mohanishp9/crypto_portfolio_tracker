import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white border border-transparent hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(66,99,235,0.25)] active:translate-y-0 active:shadow-none",
  secondary:
    "bg-transparent text-accent border border-accent/25 hover:bg-accent-subtle hover:border-accent/40",
  ghost:
    "bg-transparent text-text-secondary border border-transparent hover:text-text-primary hover:bg-surface-tertiary",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-sm gap-1.5",
  md: "px-4 py-2 text-sm rounded-sm gap-2",
};

export const Button = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:-translate-y-0 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};