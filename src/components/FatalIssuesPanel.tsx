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
    fatal:   { bg: "#ff3b3b18", color: "#ff3b3b", border: "#ff3b3b30", label: "FATAL",   Icon: ShieldAlert },
    warning: { bg: "#f5c51818", color: "#f5c518", border: "#f5c51830", label: "WARNING", Icon: AlertTriangle },
    info:    { bg: "#00b4ff18", color: "#00b4ff", border: "#00b4ff30", label: "INFO",    Icon: Info },
  }[severity];
  const Icon = config.Icon;

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
      style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}>
      <Icon size={10} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}

export default function FatalIssuesPanel({ fatalIssues, error, onRetry }: Props) {
  const hasFatal = fatalIssues?.issues?.some((i) => i.severity === "fatal");

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
    <div className="rounded-lg border overflow-hidden card-hover" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        {hasFatal ? (
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full" style={{ background: "var(--accent-red)" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--accent-red)" }} />
          </span>
        ) : (
          <ShieldAlert size={13} style={{ color: "var(--accent)" }} />
        )}
        <span className="panel-header">Issues &amp; Warnings</span>
        <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
          {fatalIssues.issues.length} issue{fatalIssues.issues.length !== 1 ? "s" : ""}
        </span>
      </div>

      {fatalIssues.issues.length === 0 ? (
        <div className="p-4 flex items-center gap-2 text-sm" style={{ color: "var(--accent)" }}>
          <CheckCircle2 size={14} /> No issues detected
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {fatalIssues.issues.map((issue, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start gap-2 mb-1.5">
                <SeverityBadge severity={issue.severity} />
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{issue.title}</span>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-muted)" }}>{issue.description}</p>
              {issue.affectedComponents.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {issue.affectedComponents.map((c, j) => (
                    <span key={j} className="px-1.5 py-0.5 rounded text-xs"
                      style={{ background: "var(--surface-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
