"use client";

import { FatalIssues, Severity } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";

interface Props {
  fatalIssues?: FatalIssues;
  error?: string;
  onRetry?: () => void;
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const config = {
    fatal: { bg: "#f8514920", color: "#f85149", border: "#f8514940", label: "FATAL" },
    warning: { bg: "#f9731620", color: "#f97316", border: "#f9731640", label: "WARNING" },
    info: { bg: "#2f81f420", color: "#2f81f4", border: "#2f81f440", label: "INFO" },
  }[severity];

  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
      style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
    >
      {config.label}
    </span>
  );
}

export default function FatalIssuesPanel({ fatalIssues, error, onRetry }: Props) {
  const hasFatal = fatalIssues?.issues?.some((i) => i.severity === "fatal");

  if (error) {
    return (
      <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <span className="panel-header">Issues &amp; Warnings</span>
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

  if (!fatalIssues) return (
    <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Issues &amp; Warnings</span>
      </div>
      <SkeletonLoader lines={4} />
    </div>
  );

  return (
    <div className="rounded border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        {hasFatal && (
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full" style={{ background: "var(--accent-red)" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--accent-red)" }} />
          </span>
        )}
        <span className="panel-header">Issues &amp; Warnings</span>
        <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
          {fatalIssues.issues.length} issue{fatalIssues.issues.length !== 1 ? "s" : ""}
        </span>
      </div>

      {fatalIssues.issues.length === 0 ? (
        <div className="p-4 text-sm" style={{ color: "var(--accent-green)" }}>
          ✓ No issues detected
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {fatalIssues.issues.map((issue, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start gap-2 mb-1.5">
                <SeverityBadge severity={issue.severity} />
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {issue.title}
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-muted)" }}>
                {issue.description}
              </p>
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
