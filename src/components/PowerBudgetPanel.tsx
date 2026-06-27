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
  const totalSegments = 20;
  const activeSegments = Math.min(totalSegments, Math.round((powerBudget.totalCurrentMa / 500) * totalSegments));
  const accentColor = powerBudget.overBudget ? "var(--accent-red)" : "var(--accent)";

  return (
    <div className="rounded-lg border overflow-hidden card-hover transition-all duration-300 relative" 
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: `linear-gradient(180deg, ${accentColor} 0%, transparent 100%)` }} />
      
      <div className="px-4 py-2.5 border-b flex items-center gap-2 pl-5" style={{ borderColor: "var(--border)" }}>
        <Zap size={13} style={{ color: accentColor }} />
        <span className="panel-header">Power Load Diagnostics</span>
        <span className="ml-auto text-xs font-mono font-semibold px-2 py-0.5 rounded"
          style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${powerBudget.overBudget ? "#ff3b3b30" : "#00ff6630"}` }}>
          {powerBudget.totalCurrentMa} mA
        </span>
      </div>

      <div className="p-4 pl-5 space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="font-mono text-[10px] tracking-wider uppercase">[POWER_LEVELS]</span>
            <span className="font-mono">{powerBudget.totalCurrentMa} mA / 500 mA (USB Limit)</span>
          </div>
          
          <div className="flex gap-1 p-1 rounded bg-black/40 border border-white/5" style={{ borderColor: "var(--border)" }}>
            {Array.from({ length: totalSegments }).map((_, idx) => {
              const isActive = idx < activeSegments;
              let bg = "rgba(255, 255, 255, 0.03)";
              let shadow = "none";
              if (isActive) {
                if (powerBudget.overBudget) {
                  bg = "var(--accent-red)";
                  shadow = "0 0 6px rgba(255, 59, 59, 0.6)";
                } else if (idx > 15) {
                  bg = "var(--accent-yellow)";
                  shadow = "0 0 6px rgba(245, 197, 24, 0.6)";
                } else {
                  bg = "var(--accent)";
                  shadow = "0 0 6px rgba(0, 255, 102, 0.6)";
                }
              }
              return (
                <div
                  key={idx}
                  className="flex-1 h-3.5 rounded-sm transition-all duration-300"
                  style={{ background: bg, boxShadow: shadow }}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>[LOAD_DISTRIBUTION]</div>
          <div className="space-y-2.5">
            {powerBudget.components.map((comp, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: "var(--text-primary)" }} className="font-medium group-hover:text-white transition-colors">{comp.name}</span>
                  <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                    <span className="text-white font-medium">{comp.currentMa} mA</span> @ <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>{comp.voltage}V</span>
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden bg-black/40">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(comp.currentMa / maxCurrent) * 100}%`,
                      background: powerBudget.overBudget ? "rgba(255, 59, 59, 0.3)" : "rgba(0, 255, 102, 0.35)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-3 border transition-all duration-200" 
          style={{ background: "var(--surface-raised)", borderColor: "var(--border)" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-bright)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <BatteryFull size={11} style={{ color: "var(--text-muted)" }} />
            <p className="panel-header" style={{ color: "var(--text-primary)" }}>Power Supply Recommendation</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{powerBudget.supplyRecommendation}</p>
        </div>

        {powerBudget.overBudget && (
          <div className="rounded-lg p-3 flex items-start gap-2 border"
            style={{ background: "var(--accent-red-glow)", borderColor: "rgba(255, 59, 59, 0.2)" }}>
            <AlertTriangle size={13} style={{ color: "var(--accent-red)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-xs font-bold" style={{ color: "var(--accent-red)" }}>
                CRITICAL: BUDGET EXCEEDED
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                The total current draw exceeds USB limits. You must utilize a dedicated external power supply.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
