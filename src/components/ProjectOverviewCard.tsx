"use client";

import { ProjectOverview } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";

interface Props {
  overview?: ProjectOverview;
  error?: string;
  onRetry?: () => void;
}

export default function ProjectOverviewCard({ overview, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <p className="panel-header mb-3">Overview</p>
        <div className="rounded p-3 text-sm" style={{ background: "#f8514920", borderColor: "#f85149", border: "1px solid #f8514940", color: "#f85149" }}>
          {error}
        </div>
        {onRetry && (
          <button onClick={onRetry} className="mt-3 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
            ↺ Retry
          </button>
        )}
      </div>
    );
  }

  if (!overview) return (
    <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Overview</span>
      </div>
      <SkeletonLoader lines={6} />
    </div>
  );

  return (
    <div className="rounded border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Overview</span>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{overview.summary}</p>

        {overview.goals.length > 0 && (
          <div>
            <p className="panel-header mb-2">Goals</p>
            <ul className="space-y-1">
              {overview.goals.map((goal, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--accent-green)", marginTop: 2 }}>✓</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {overview.components.length > 0 && (
          <div>
            <p className="panel-header mb-2">Components ({overview.components.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {overview.components.map((comp, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-xs" style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                  {comp}
                </span>
              ))}
            </div>
          </div>
        )}

        {overview.warnings.length > 0 && (
          <div>
            <p className="panel-header mb-2">Warnings</p>
            <ul className="space-y-1">
              {overview.warnings.map((w, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--accent-orange)" }}>
                  <span>⚠</span><span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
