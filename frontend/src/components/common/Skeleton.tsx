import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton = ({ className = "", style }: SkeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-[#3d4a3e]/30 rounded-xs ${className}`}
      style={{
        minHeight: "1em",
        ...style,
      }}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-[#2e3330] p-6 border border-[rgba(61,74,62,0.1)] flex flex-col justify-between h-36">
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-4 h-px" />
        <Skeleton className="w-24 h-3" />
      </div>
      <Skeleton className="w-32 h-8 mb-2" />
    </div>
    <Skeleton className="w-20 h-3" />
  </div>
);

export const InsightCardSkeleton = () => (
  <div className="p-5 bg-[#2e3330] border border-[rgba(61,74,62,0.25)] flex flex-col justify-between h-32">
    <div>
      <Skeleton className="w-24 h-3 mb-3" />
      <Skeleton className="w-32 h-6 mb-2" />
      <Skeleton className="w-12 h-3" />
    </div>
    <Skeleton className="w-40 h-3 mt-4" />
  </div>
);

export const TableRowSkeleton = ({ columnsCount = 8 }: { columnsCount?: number }) => (
  <tr style={{ borderBottom: "1px solid rgba(61,74,62,0.15)" }}>
    {Array.from({ length: columnsCount }).map((_, idx) => (
      <td key={idx} className="px-6 py-5 whitespace-nowrap">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4" style={{ width: idx === 0 ? "80px" : "60px" }} />
          {idx === 0 || idx === 3 ? (
            <Skeleton className="h-2.5 w-10" />
          ) : null}
        </div>
      </td>
    ))}
  </tr>
);

export const TopCoinSkeleton = () => (
  <div
    style={{
      width: "100%",
      padding: "11px 20px",
      borderBottom: "1px solid rgba(61,74,62,0.12)",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    }}
  >
    <Skeleton className="w-3 h-3" />
    <Skeleton className="w-5 h-5 rounded-full" />
    <div style={{ flex: 1 }}>
      <Skeleton className="w-20 h-3.5 mb-1.5" />
      <Skeleton className="w-10 h-2.5" />
    </div>
    <div style={{ textAlign: "right" }}>
      <Skeleton className="w-16 h-3.5 mb-1.5 ml-auto" />
      <Skeleton className="w-10 h-2.5 ml-auto" />
    </div>
  </div>
);

export const WatchlistSkeleton = () => (
  <div
    className="flex items-center justify-between gap-4 p-3 animate-pulse"
    style={{ background: "#1f2320", border: "1px solid rgba(61,74,62,0.25)" }}
  >
    <div className="flex-1">
      <Skeleton className="w-24 h-4 mb-2" />
      <Skeleton className="w-12 h-3" />
    </div>
    <div style={{ textAlign: "right" }}>
      <Skeleton className="w-16 h-3.5 mb-1.5 ml-auto" />
      <Skeleton className="w-10 h-2.5 ml-auto" />
    </div>
    <div className="flex flex-col gap-2">
      <Skeleton className="w-14 h-7" />
      <Skeleton className="w-14 h-7" />
    </div>
  </div>
);

export const AlertSkeleton = () => (
  <div
    className="flex items-center justify-between gap-4 p-3 animate-pulse"
    style={{ background: "#1f2320", border: "1px solid rgba(61,74,62,0.25)" }}
  >
    <div className="flex-1">
      <Skeleton className="w-20 h-4 mb-2" />
      <Skeleton className="w-40 h-3" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="w-14 h-7" />
      <Skeleton className="w-14 h-7" />
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="p-6 bg-[#2e3330] border border-[rgba(61,74,62,0.3)]">
    <Skeleton className="w-16 h-3 mb-3" />
    <Skeleton className="w-28 h-6 mb-8" />
    <div className="flex items-end gap-3 h-52 mt-4 px-2">
      {Array.from({ length: 12 }).map((_, idx) => {
        const heights = ["20%", "45%", "30%", "60%", "75%", "50%", "40%", "85%", "65%", "90%", "55%", "70%"];
        return (
          <Skeleton
            key={idx}
            className="flex-1 rounded-t-xs"
            style={{ height: heights[idx % heights.length] }}
          />
        );
      })}
    </div>
    <div className="flex justify-between mt-4 px-2">
      <Skeleton className="w-12 h-3" />
      <Skeleton className="w-12 h-3" />
      <Skeleton className="w-12 h-3" />
    </div>
  </div>
);
