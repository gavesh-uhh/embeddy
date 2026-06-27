"use client";

import { ProjectOverview } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";
import { CheckCircle2, AlertTriangle, Package, Target, RotateCcw, XCircle } from "lucide-react";

interface Props {
  overview?: ProjectOverview;
  error?: string;
  onRetry?: () => void;
}

export default function ProjectOverviewCard({ overview, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <Target size={13} style={{ color: "var(--text-muted)" }} />
          <span className="panel-header">Overview</span>
        </div>
        <div className="p-4">
          <div className="rounded-lg p-3 text-xs flex items-start gap-2"
            style={{ background: "var(--accent-red-glow)", color: "var(--accent-red)", border: "1px solid #ff3b3b30" }}>
            <XCircle size={13} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
          {onRetry && (
            <button onClick={onRetry}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              <RotateCcw size={11} /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!overview) return (
    <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <Target size={13} style={{ color: "var(--text-muted)" }} />
        <span className="panel-header">Overview</span>
      </div>
      <SkeletonLoader lines={6} />
    </div>
  );

  return (
    <div className="rounded-lg border overflow-hidden card-hover" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <Target size={13} style={{ color: "var(--accent)" }} />
        <span className="panel-header">Overview</span>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{overview.summary}</p>

        {overview.goals.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 size={11} style={{ color: "var(--accent)" }} />
              <p className="panel-header">Goals</p>
            </div>
            <ul className="space-y-1.5">
              {overview.goals.map((goal, i) => (
                <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--accent)", marginTop: 1, flexShrink: 0 }}>▸</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {overview.components.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Package size={11} style={{ color: "var(--text-muted)" }} />
              <p className="panel-header">Components ({overview.components.length})</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {overview.components.map((comp, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-xs"
                  style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                  {comp}
                </span>
              ))}
            </div>
          </div>
        )}

        {overview.warnings.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={11} style={{ color: "var(--accent-yellow)" }} />
              <p className="panel-header">Warnings</p>
            </div>
            <ul className="space-y-1.5">
              {overview.warnings.map((w, i) => (
                <li key={i} className="text-xs flex items-start gap-2" style={{ color: "#f5c518" }}>
                  <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
