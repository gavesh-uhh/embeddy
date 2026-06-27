"use client";

import { CompatibilityChecks } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";

interface Props {
  compatibility?: CompatibilityChecks;
  error?: string;
  onRetry?: () => void;
}

export default function CompatibilityPanel({ compatibility, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="panel-header">Compatibility</span>
        </div>
        <div className="p-4">
          <div className="rounded p-3 text-sm" style={{ background: "#f8514920", color: "#f85149", border: "1px solid #f8514940" }}>
            {error}
          </div>
          {onRetry && (
            <button onClick={onRetry} className="mt-3 px-3 py-1.5 rounded text-xs"
              style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              ↺ Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!compatibility) return (
    <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Compatibility</span>
      </div>
      <SkeletonLoader lines={4} />
    </div>
  );

  const issueCount = compatibility.checks.filter((c) => c.issue).length;
  const conflictCount = compatibility.checks.filter((c) => c.voltageConflict).length;

  return (
    <div className="rounded border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Compatibility</span>
        <div className="flex gap-2">
          {conflictCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#f8514920", color: "#f85149", border: "1px solid #f8514940" }}>
              {conflictCount} voltage conflict{conflictCount !== 1 ? "s" : ""}
            </span>
          )}
          {issueCount === 0 && (
            <span className="text-xs" style={{ color: "var(--accent-green)" }}>✓ All compatible</span>
          )}
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {compatibility.checks.map((check, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {check.component}
              </span>
              <div className="flex gap-1.5">
                {check.voltageConflict && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#f8514920", color: "#f85149", border: "1px solid #f8514940" }}>
                    ⚡ Voltage
                  </span>
                )}
                {!check.issue && (
                  <span className="text-xs" style={{ color: "var(--accent-green)" }}>✓</span>
                )}
              </div>
            </div>
            {check.issue && (
              <p className="text-xs mb-1" style={{ color: "#f97316" }}>{check.issue}</p>
            )}
            {check.resolution && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>→ {check.resolution}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
