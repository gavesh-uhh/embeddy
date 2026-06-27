"use client";

import { ProjectOverview } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";
import { CheckCircle2, AlertTriangle, Package, Target, RotateCcw, XCircle, Check, Cpu } from "lucide-react";

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
          <span className="panel-header">System Overview</span>
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
        <span className="panel-header">System Overview</span>
      </div>
      <SkeletonLoader lines={6} />
    </div>
  );

  return (
    <div className="rounded-lg border overflow-hidden card-hover transition-all duration-300 relative" 
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {/* Decorative left accent border line */}
      <div className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: "linear-gradient(180deg, var(--accent) 0%, transparent 100%)" }} />
      
      <div className="px-4 py-2.5 border-b flex items-center gap-2 pl-5" style={{ borderColor: "var(--border)" }}>
        <Target size={13} style={{ color: "var(--accent)" }} />
        <span className="panel-header">System Overview</span>
      </div>
      
      <div className="p-4 pl-5 space-y-5">
        {/* System Summary Block */}
        <div className="space-y-1.5">
          <div className="text-[9px] font-mono tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>[SYS_SUMMARY]</div>
          <p className="text-sm leading-relaxed font-sans" style={{ color: "var(--text-primary)" }}>
            {overview.summary}
          </p>
        </div>

        {/* Goals Checklist */}
        {overview.goals.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={11} style={{ color: "var(--accent)" }} />
              <p className="panel-header">Project Objectives</p>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {overview.goals.map((goal, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2 rounded border transition-colors duration-200"
                  style={{ background: "var(--bg)", borderColor: "var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-bright)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <span className="flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center mt-0.5"
                    style={{ background: "rgba(0, 255, 102, 0.08)", border: "1px solid #00ff6630" }}>
                    <Check size={8} style={{ color: "var(--accent)" }} strokeWidth={3} />
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-primary)" }}>{goal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Components Grid */}
        {overview.components.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Package size={11} style={{ color: "var(--text-muted)" }} />
              <p className="panel-header">Identified Hardware ({overview.components.length})</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {overview.components.map((comp, i) => (
                <span key={i} className="px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all duration-200"
                  style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)", cursor: "default" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 8px rgba(0, 255, 102, 0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Cpu size={10} style={{ color: "var(--accent)" }} />
                  {comp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* System Warnings Block */}
        {overview.warnings.length > 0 && (
          <div className="rounded-lg p-3 border space-y-2"
            style={{ background: "rgba(245, 197, 24, 0.03)", borderColor: "rgba(245, 197, 24, 0.15)" }}>
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={11} style={{ color: "var(--accent-yellow)" }} />
              <p className="panel-header" style={{ color: "var(--accent-yellow)" }}>System Warnings</p>
            </div>
            <ul className="space-y-2">
              {overview.warnings.map((w, i) => (
                <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--text-primary)" }}>
                  <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" style={{ color: "var(--accent-yellow)" }} />
                  <span style={{ color: "rgba(255, 255, 255, 0.85)" }}>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
