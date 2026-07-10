import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Input = ({
  label,
  error,
  hint,
  leadingIcon,
  trailingIcon,
  className = "",
  id,
  disabled,
  ...props
}: InputProps) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-text-secondary"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leadingIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {leadingIcon}
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          className={`w-full bg-surface-primary border rounded-sm px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? "border-negative/50 focus:border-negative focus:ring-negative/20"
              : "border-border-secondary"
          } ${leadingIcon ? "pl-9" : ""} ${trailingIcon ? "pr-9" : ""} ${className}`}
          {...props}
        />

        {trailingIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {trailingIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-negative font-medium">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-text-tertiary">{hint}</p>
      )}
    </div>
  );
};