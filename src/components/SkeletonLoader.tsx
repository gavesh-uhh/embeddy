"use client";

interface SkeletonLoaderProps {
  lines?: number;
  height?: string;
}

export default function SkeletonLoader({ lines = 4, height = "h-4" }: SkeletonLoaderProps) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${height} rounded`}
          style={{ width: i === lines - 1 ? "60%" : `${85 + Math.random() * 15}%` }}
        />
      ))}
    </div>
  );
}

