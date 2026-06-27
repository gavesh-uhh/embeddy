"use client";

import { CompatibilityChecks } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";
import { CheckCircle2, Zap, Wrench, RotateCcw, XCircle } from "lucide-react";

interface Props {
  compatibility?: CompatibilityChecks;
  error?: string;
  onRetry?: () => void;
}

export default function CompatibilityPanel({ compatibility, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <Wrench size={13} style={{ color: "var(--text-muted)" }} />
          <span className="panel-header">Compatibility</span>
        </div>
        <div className="p-4">
          <div className="rounded-lg p-3 text-xs flex items-start gap-2"
            style={{ background: "var(--accent-red-glow)", color: "var(--accent-red)", border: "1px solid #ff3b3b30" }}>
            <XCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
          </div>
          {onRetry && (
            <button onClick={onRetry}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              <RotateCcw size={11} /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!compatibility) return (
    <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <Wrench size={13} style={{ color: "var(--text-muted)" }} />
        <span className="panel-header">Compatibility</span>
      </div>
      <SkeletonLoader lines={4} />
    </div>
  );

  const issueCount = compatibility.checks.filter((c) => c.issue).length;
  const conflictCount = compatibility.checks.filter((c) => c.voltageConflict).length;

  return (
    <div className="rounded-lg border overflow-hidden card-hover" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <Wrench size={13} style={{ color: "var(--accent)" }} />
        <span className="panel-header">Compatibility</span>
        <div className="ml-auto flex gap-2">
          {conflictCount > 0 && (
            <span className="text-xs flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ background: "#ff3b3b18", color: "var(--accent-red)", border: "1px solid #ff3b3b30" }}>
              <Zap size={10} /> {conflictCount} voltage conflict{conflictCount !== 1 ? "s" : ""}
            </span>
          )}
          {issueCount === 0 && (
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--accent)" }}>
              <CheckCircle2 size={12} /> All compatible
            </span>
          )}
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {compatibility.checks.map((check, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{check.component}</span>
              <div className="flex gap-1.5 items-center">
                {check.voltageConflict && (
                  <span className="text-xs flex items-center gap-1 px-1.5 py-0.5 rounded"
                    style={{ background: "#ff3b3b18", color: "var(--accent-red)", border: "1px solid #ff3b3b30" }}>
                    <Zap size={10} /> Voltage
                  </span>
                )}
                {!check.issue && (
                  <CheckCircle2 size={13} style={{ color: "var(--accent)" }} />
                )}
              </div>
            </div>
            {check.issue && (
              <p className="text-xs mb-1" style={{ color: "#f5c518" }}>{check.issue}</p>
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
