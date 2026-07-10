import type { ReactNode, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";

/* ── Root ─────────────────────────────────────────────────── */

export interface TableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Table = ({ children, className = "", ...props }: TableProps) => (
  <div
    className={`overflow-hidden rounded-md bg-surface-secondary border border-border-primary shadow-[var(--shadow-raised)] ${className}`}
    {...props}
  >
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full">{children}</table>
    </div>
  </div>
);

/* ── Header ──────────────────────────────────────────────── */

export interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableHead = ({
  children,
  className = "",
  ...props
}: TableHeadProps) => (
  <thead
    className={`border-b border-border-primary bg-surface-tertiary/50 ${className}`}
    {...props}
  >
    {children}
  </thead>
);

/* ── Body ────────────────────────────────────────────────── */

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableBody = ({
  children,
  className = "",
  ...props
}: TableBodyProps) => (
  <tbody className={`divide-y divide-border-primary ${className}`} {...props}>
    {children}
  </tbody>
);

/* ── Row ─────────────────────────────────────────────────── */

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export const TableRow = ({
  children,
  className = "",
  ...props
}: TableRowProps) => (
  <tr
    className={`transition-colors duration-150 hover:bg-surface-tertiary ${className}`}
    {...props}
  >
    {children}
  </tr>
);

/* ── Header Cell ─────────────────────────────────────────── */

export interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  align?: "left" | "right" | "center";
}

const alignClasses = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export const TableHeaderCell = ({
  children,
  align = "left",
  className = "",
  ...props
}: TableHeaderCellProps) => (
  <th
    scope="col"
    className={`px-4 py-3 text-xs font-medium text-text-secondary ${alignClasses[align]} ${className}`}
    {...props}
  >
    {children}
  </th>
);

/* ── Data Cell ───────────────────────────────────────────── */

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  align?: "left" | "right" | "center";
  mono?: boolean;
}

export const TableCell = ({
  children,
  align = "left",
  mono = false,
  className = "",
  ...props
}: TableCellProps) => (
  <td
    className={`px-4 py-3 text-sm ${mono ? "font-mono tabular-nums" : ""} ${
      alignClasses[align]
    } ${className}`}
    {...props}
  >
    {children}
  </td>
);

/* ── Empty State ─────────────────────────────────────────── */

export interface TableEmptyProps {
  colSpan: number;
  message?: string;
  description?: string;
}

export const TableEmpty = ({
  colSpan,
  message = "No data yet",
  description,
}: TableEmptyProps) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-16 text-center">
      <p className="text-base font-medium text-text-secondary">{message}</p>
      {description && (
        <p className="text-sm text-text-tertiary mt-2">{description}</p>
      )}
    </td>
  </tr>
);