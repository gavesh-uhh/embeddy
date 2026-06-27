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
  const hasError = conflictCount > 0;
  const leftBorderColor = hasError ? "var(--accent-red)" : issueCount > 0 ? "var(--accent-yellow)" : "var(--accent)";

  return (
    <div className="rounded-lg border overflow-hidden card-hover transition-all duration-300 relative" 
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {/* Decorative left accent border line */}
      <div className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: `linear-gradient(180deg, ${leftBorderColor} 0%, transparent 100%)` }} />
      
      <div className="px-4 py-2.5 border-b flex items-center gap-2 pl-5" style={{ borderColor: "var(--border)" }}>
        <Wrench size={13} style={{ color: leftBorderColor }} />
        <span className="panel-header">Pin &amp; Voltage Compatibility</span>
        <div className="ml-auto flex gap-2">
          {conflictCount > 0 && (
            <span className="text-[10px] font-mono font-bold flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ background: "rgba(255, 59, 59, 0.08)", color: "var(--accent-red)", border: "1px solid rgba(255, 59, 59, 0.25)" }}>
              <Zap size={10} /> {conflictCount} CONFLICT{conflictCount !== 1 ? "S" : ""}
            </span>
          )}
          {issueCount === 0 && (
            <span className="text-[10px] font-mono font-bold flex items-center gap-1 px-1.5 py-0.5 rounded" 
              style={{ background: "rgba(0, 255, 102, 0.08)", color: "var(--accent)", border: "1px solid rgba(0, 255, 102, 0.25)" }}>
              <CheckCircle2 size={10} /> ALL COMPATIBLE
            </span>
          )}
        </div>
      </div>
      <div className="divide-y pl-1" style={{ borderColor: "var(--border)" }}>
        {compatibility.checks.map((check, i) => {
          const isConflict = check.voltageConflict;
          const isWarning = check.issue && !check.voltageConflict;
          
          let statusLabel = "PASS";
          let statusColor = "var(--accent)";
          let statusBg = "rgba(0, 255, 102, 0.05)";
          let statusBorder = "rgba(0, 255, 102, 0.2)";
          
          if (isConflict) {
            statusLabel = "CRITICAL";
            statusColor = "var(--accent-red)";
            statusBg = "rgba(255, 59, 59, 0.05)";
            statusBorder = "rgba(255, 59, 59, 0.2)";
          } else if (isWarning) {
            statusLabel = "WARNING";
            statusColor = "var(--accent-yellow)";
            statusBg = "rgba(245, 197, 24, 0.05)";
            statusBorder = "rgba(245, 197, 24, 0.2)";
          }

          return (
            <div key={i} className="px-4 py-3 pl-6 group transition-colors duration-200"
              style={{ background: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-white">{check.component}</span>
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest"
                  style={{ background: statusBg, color: statusColor, border: `1px solid ${statusBorder}` }}>
                  [{statusLabel}]
                </span>
              </div>
              
              {check.issue && (
                <p className="text-xs mb-1.5 font-medium" style={{ color: isConflict ? "var(--accent-red)" : "var(--accent-yellow)" }}>
                  {check.issue}
                </p>
              )}
              {check.resolution && (
                <div className="flex items-start gap-1.5 p-2 mt-1 rounded bg-black/30 border border-white/5">
                  <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-white/5" style={{ color: "var(--text-primary)" }}>→ RESOLUTION</span>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{check.resolution}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
