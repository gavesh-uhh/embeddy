"use client";

import { FatalIssues, Severity } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, RotateCcw, XCircle } from "lucide-react";

interface Props {
  fatalIssues?: FatalIssues;
  error?: string;
  onRetry?: () => void;
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const config = {
    fatal:   { bg: "rgba(255, 59, 59, 0.08)", color: "#ff3b3b", border: "rgba(255, 59, 59, 0.25)", label: "FATAL",   Icon: ShieldAlert },
    warning: { bg: "rgba(245, 197, 24, 0.08)", color: "#f5c518", border: "rgba(245, 197, 24, 0.25)", label: "WARNING", Icon: AlertTriangle },
    info:    { bg: "rgba(0, 180, 255, 0.08)", color: "#00b4ff", border: "rgba(0, 180, 255, 0.25)", label: "INFO",    Icon: Info },
  }[severity];
  const Icon = config.Icon;

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wider"
      style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}>
      <Icon size={9} strokeWidth={3} />
      {config.label}
    </span>
  );
}

export default function FatalIssuesPanel({ fatalIssues, error, onRetry }: Props) {
  const hasFatal = fatalIssues?.issues?.some((i) => i.severity === "fatal");
  const count = fatalIssues?.issues?.length || 0;
  const leftBorderColor = hasFatal ? "var(--accent-red)" : count > 0 ? "var(--accent-yellow)" : "var(--accent)";

  if (error) {
    return (
      <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <ShieldAlert size={13} style={{ color: "var(--text-muted)" }} />
          <span className="panel-header">Issues &amp; Warnings</span>
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

  if (!fatalIssues) return (
    <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <ShieldAlert size={13} style={{ color: "var(--text-muted)" }} />
        <span className="panel-header">Issues &amp; Warnings</span>
      </div>
      <SkeletonLoader lines={4} />
    </div>
  );

  return (
    <div className="rounded-lg border overflow-hidden card-hover transition-all duration-300 relative" 
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: `linear-gradient(180deg, ${leftBorderColor} 0%, transparent 100%)` }} />
      
      <div className="px-4 py-2.5 border-b flex items-center gap-2 pl-5" style={{ borderColor: "var(--border)" }}>
        {hasFatal ? (
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full" style={{ background: "var(--accent-red)" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--accent-red)" }} />
          </span>
        ) : (
          <ShieldAlert size={13} style={{ color: count > 0 ? "var(--accent-yellow)" : "var(--accent)" }} />
        )}
        <span className="panel-header">Diagnostic Logs</span>
        <span className="ml-auto text-xs font-mono font-semibold" style={{ color: "var(--text-muted)" }}>
          {count} check{count !== 1 ? "s" : ""} logged
        </span>
      </div>

      {fatalIssues.issues.length === 0 ? (
        <div className="p-6 pl-7 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0, 255, 102, 0.08)", border: "1px solid #00ff6625" }}>
            <CheckCircle2 size={20} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold tracking-wider uppercase" style={{ color: "var(--text-primary)" }}>[SECURITY_STATUS: CLEARED]</h4>
            <p className="text-xs mt-1 max-w-sm" style={{ color: "var(--text-muted)" }}>
              No critical design faults or warnings compiled in this circuit board configuration.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y pl-1" style={{ borderColor: "var(--border)" }}>
          {fatalIssues.issues.map((issue, i) => (
            <div key={i} className="p-4 pl-6 group transition-colors duration-200" 
              style={{ background: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={issue.severity} />
                  <span className="text-xs font-mono font-semibold" style={{ color: "var(--text-muted)" }}>
                    [LOG_0x0{i}]
                  </span>
                  <span className="text-sm font-semibold text-white">{issue.title}</span>
                </div>
              </div>
              
              <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>{issue.description}</p>
              
              {issue.affectedComponents.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[9px] font-mono tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>AFFECTED_NODES:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {issue.affectedComponents.map((c, j) => (
                      <span key={j} className="px-2 py-0.5 rounded text-[10px] font-mono transition-colors"
                        style={{ background: "var(--surface-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
