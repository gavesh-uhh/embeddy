"use client";

import { PowerBudget } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";

interface Props {
  powerBudget?: PowerBudget;
  error?: string;
  onRetry?: () => void;
}

export default function PowerBudgetPanel({ powerBudget, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="panel-header">Power Budget</span>
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

  if (!powerBudget) return (
    <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Power Budget</span>
      </div>
      <SkeletonLoader lines={5} />
    </div>
  );

  const maxCurrent = Math.max(...powerBudget.components.map((c) => c.currentMa), 1);

  return (
    <div className="rounded border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Power Budget</span>
        <span
          className="text-sm font-semibold"
          style={{ color: powerBudget.overBudget ? "var(--accent-red)" : "var(--accent-green)" }}
        >
          {powerBudget.totalCurrentMa} mA total
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary bar */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            <span>Current draw</span>
            <span>{powerBudget.totalCurrentMa} / 500 mA (USB)</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-raised)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (powerBudget.totalCurrentMa / 500) * 100)}%`,
                background: powerBudget.overBudget ? "var(--accent-red)" : "var(--accent-orange)",
              }}
            />
          </div>
        </div>

        {/* Component breakdown */}
        <div className="space-y-2">
          {powerBudget.components.map((comp, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span style={{ color: "var(--text-primary)" }}>{comp.name}</span>
                <span style={{ color: "var(--text-muted)" }}>{comp.currentMa} mA @ {comp.voltage}V</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-raised)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(comp.currentMa / maxCurrent) * 100}%`,
                    background: "var(--accent-blue)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation */}
        <div className="rounded p-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
          <p className="panel-header mb-1">Recommendation</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{powerBudget.supplyRecommendation}</p>
        </div>

        {powerBudget.overBudget && (
          <div className="rounded p-3" style={{ background: "#f8514920", border: "1px solid #f8514940" }}>
            <p className="text-xs font-medium" style={{ color: "#f85149" }}>
              ⚠ Over USB budget — use dedicated power supply
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
