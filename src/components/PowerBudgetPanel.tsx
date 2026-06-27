"use client";

import { PowerBudget } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";
import { Zap, AlertTriangle, RotateCcw, XCircle, BatteryFull } from "lucide-react";

interface Props {
  powerBudget?: PowerBudget;
  error?: string;
  onRetry?: () => void;
}

export default function PowerBudgetPanel({ powerBudget, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <Zap size={13} style={{ color: "var(--text-muted)" }} />
          <span className="panel-header">Power Budget</span>
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

  if (!powerBudget) return (
    <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <Zap size={13} style={{ color: "var(--text-muted)" }} />
        <span className="panel-header">Power Budget</span>
      </div>
      <SkeletonLoader lines={5} />
    </div>
  );

  const maxCurrent = Math.max(...powerBudget.components.map((c) => c.currentMa), 1);

  return (
    <div className="rounded-lg border overflow-hidden card-hover" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <Zap size={13} style={{ color: powerBudget.overBudget ? "var(--accent-red)" : "var(--accent)" }} />
        <span className="panel-header">Power Budget</span>
        <span className="ml-auto text-sm font-semibold"
          style={{ color: powerBudget.overBudget ? "var(--accent-red)" : "var(--accent)" }}>
          {powerBudget.totalCurrentMa} mA total
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            <span>Current draw</span>
            <span>{powerBudget.totalCurrentMa} / 500 mA (USB)</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-raised)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (powerBudget.totalCurrentMa / 500) * 100)}%`,
                background: powerBudget.overBudget
                  ? "var(--accent-red)"
                  : "linear-gradient(90deg, #00cc52, #00ff66)",
                boxShadow: powerBudget.overBudget ? "0 0 8px #ff3b3b60" : "0 0 8px #00ff6640",
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
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-raised)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(comp.currentMa / maxCurrent) * 100}%`,
                    background: "#00ff6640",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation */}
        <div className="rounded-lg p-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <BatteryFull size={11} style={{ color: "var(--text-muted)" }} />
            <p className="panel-header">Recommendation</p>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{powerBudget.supplyRecommendation}</p>
        </div>

        {powerBudget.overBudget && (
          <div className="rounded-lg p-3 flex items-start gap-2"
            style={{ background: "var(--accent-red-glow)", border: "1px solid #ff3b3b30" }}>
            <AlertTriangle size={13} style={{ color: "var(--accent-red)", flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs font-medium" style={{ color: "var(--accent-red)" }}>
              Over USB budget — use a dedicated power supply
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
