import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton = ({ className = "", style }: SkeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-surface-tertiary rounded-sm ${className}`}
      style={{
        minHeight: "1em",
        ...style,
      }}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-surface-secondary p-6 border border-border-primary flex flex-col justify-between h-36 rounded-sm">
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-4 h-px bg-surface-tertiary" />
        <Skeleton className="w-24 h-3 bg-surface-tertiary" />
      </div>
      <Skeleton className="w-32 h-8 mb-2" />
    </div>
    <Skeleton className="w-20 h-3 bg-surface-tertiary" />
  </div>
);

export const InsightCardSkeleton = () => (
  <div className="p-5 bg-surface-secondary border border-border-primary flex flex-col justify-between h-32 rounded-sm">
    <div>
      <Skeleton className="w-24 h-3 mb-3 bg-surface-tertiary" />
      <Skeleton className="w-32 h-6 mb-2" />
      <Skeleton className="w-12 h-3 bg-surface-tertiary" />
    </div>
    <Skeleton className="w-40 h-3 mt-4 bg-surface-tertiary" />
  </div>
);

export const TableRowSkeleton = ({ columnsCount = 8 }: { columnsCount?: number }) => (
  <tr className="border-b border-border-primary/50">
    {Array.from({ length: columnsCount }).map((_, idx) => (
      <td key={idx} className="px-6 py-5 whitespace-nowrap">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4" style={{ width: idx === 0 ? "80px" : "60px" }} />
          {idx === 0 || idx === 3 ? (
            <Skeleton className="h-2.5 w-10 bg-surface-tertiary" />
          ) : null}
        </div>
      </td>
    ))}
  </tr>
);

export const TopCoinSkeleton = () => (
  <div className="w-full px-5 py-3 border-b border-border-primary/50 flex items-center gap-3">
    <Skeleton className="w-3 h-3 bg-surface-tertiary" />
    <Skeleton className="w-5 h-5 rounded-full" />
    <div className="flex-1">
      <Skeleton className="w-20 h-3.5 mb-1.5" />
      <Skeleton className="w-10 h-2.5 bg-surface-tertiary" />
    </div>
    <div className="text-right flex flex-col items-end">
      <Skeleton className="w-16 h-3.5 mb-1.5" />
      <Skeleton className="w-10 h-2.5 bg-surface-tertiary" />
    </div>
  </div>
);

export const WatchlistSkeleton = () => (
  <div className="flex items-center justify-between gap-4 p-3 animate-pulse bg-surface-secondary border border-border-primary rounded-sm">
    <div className="flex-1">
      <Skeleton className="w-24 h-4 mb-2" />
      <Skeleton className="w-12 h-3 bg-surface-tertiary" />
    </div>
    <div className="text-right flex flex-col items-end">
      <Skeleton className="w-16 h-3.5 mb-1.5" />
      <Skeleton className="w-10 h-2.5 bg-surface-tertiary" />
    </div>
    <div className="flex flex-col gap-2">
      <Skeleton className="w-14 h-7 bg-surface-tertiary rounded-sm" />
      <Skeleton className="w-14 h-7 bg-surface-tertiary rounded-sm" />
    </div>
  </div>
);

export const AlertSkeleton = () => (
  <div className="flex items-center justify-between gap-4 p-3 animate-pulse bg-surface-secondary border border-border-primary rounded-sm">
    <div className="flex-1">
      <Skeleton className="w-20 h-4 mb-2" />
      <Skeleton className="w-40 h-3 bg-surface-tertiary" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="w-14 h-7 bg-surface-tertiary rounded-sm" />
      <Skeleton className="w-14 h-7 bg-surface-tertiary rounded-sm" />
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="p-6 bg-surface-secondary border border-border-primary rounded-sm">
    <Skeleton className="w-16 h-3 mb-3 bg-surface-tertiary" />
    <Skeleton className="w-28 h-6 mb-8" />
    <div className="flex items-end gap-3 h-52 mt-4 px-2">
      {Array.from({ length: 12 }).map((_, idx) => {
        const heights = ["20%", "45%", "30%", "60%", "75%", "50%", "40%", "85%", "65%", "90%", "55%", "70%"];
        return (
          <Skeleton
            key={idx}
            className="flex-1 rounded-t-sm bg-surface-tertiary"
            style={{ height: heights[idx % heights.length] }}
          />
        );
      })}
    </div>
    <div className="flex justify-between mt-4 px-2">
      <Skeleton className="w-12 h-3 bg-surface-tertiary" />
      <Skeleton className="w-12 h-3 bg-surface-tertiary" />
      <Skeleton className="w-12 h-3 bg-surface-tertiary" />
    </div>
  </div>
);
