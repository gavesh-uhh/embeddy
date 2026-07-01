"use client";

import { PCBLayout } from "@/lib/types";
import { Layers, RotateCcw, XCircle, Download, Sparkles } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";

const PCBRenderer = dynamic(() => import("./PCBRenderer"), { ssr: false });

interface Props {
  pcbLayout?: PCBLayout;
  error?: string;
  onRetry?: () => void;
  onGenerate?: () => void;
}

export default function PCBLayoutPanel({
  pcbLayout,
  error,
  onRetry,
  onGenerate,
}: Props) {
  const [activeLayer, setActiveLayer] = useState<"top" | "bottom" | "both">(
    "top",
  );

  if (error) {
    return (
      <div
        className="rounded-lg border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="px-4 py-2.5 border-b flex items-center gap-2"
          style={{ borderColor: "var(--border)" }}
        >
          <Layers size={13} style={{ color: "var(--text-muted)" }} />
          <span className="panel-header">PCB Layout</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
            style={{
              background: "var(--accent-blue-glow)",
              color: "var(--accent-blue)",
              border: "1px solid var(--accent-blue)40",
            }}
          >
            BETA
          </span>
        </div>
        <div className="p-4">
          <div
            className="rounded-lg p-3 text-xs flex items-start gap-2"
            style={{
              background: "var(--accent-red-glow)",
              color: "var(--accent-red)",
              border: "1px solid #ff3b3b30",
            }}
          >
            <XCircle size={13} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: "var(--surface-raised)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
            >
              <RotateCcw size={11} /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!pcbLayout) {
    return (
      <div
        className="rounded-lg border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="px-4 py-2.5 border-b flex items-center gap-2"
          style={{ borderColor: "var(--border)" }}
        >
          <Layers size={13} style={{ color: "var(--text-muted)" }} />
          <span className="panel-header">PCB Layout</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
            style={{
              background: "var(--accent-blue-glow)",
              color: "var(--accent-blue)",
              border: "1px solid var(--accent-blue)40",
            }}
          >
            BETA
          </span>
        </div>
        <div
          className="p-8 flex flex-col items-center justify-center text-center"
          style={{ minHeight: "300px" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: "var(--accent-green-glow)" }}
          >
            <Layers size={24} style={{ color: "var(--accent-green)" }} />
          </div>
          <h3
            className="text-sm font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            PCB Layout Not Generated
          </h3>
          <p
            className="text-xs mb-4 max-w-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Auto-generate a basic PCB layout from your schematic. This creates
            component placements, traces, and pads ready for PCB manufacturing.
            <br />
            <br />
            <span style={{ color: "var(--accent-amber)" }}>
              Note: This is a beta feature. Results are auto-generated and
              should be verified before sending to manufacturing. Complex
              designs may require manual refinement.
            </span>
          </p>
          {onGenerate && (
            <button
              onClick={onGenerate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium"
              style={{
                background: "var(--accent-green-glow)",
                color: "var(--accent-green)",
                border: "1px solid var(--accent-green)40",
              }}
            >
              <Sparkles size={14} /> Generate PCB Layout
            </button>
          )}
        </div>
      </div>
    );
  }

  const traceCount = pcbLayout.traces.length;
  const componentCount = pcbLayout.placements.length;
  const padCount = pcbLayout.pads.length;

  return (
    <div
      className="rounded-lg border overflow-hidden card-hover"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div
        className="px-4 py-2.5 border-b flex items-center justify-between"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Layers size={13} style={{ color: "var(--accent)" }} />
          <span className="panel-header">PCB Layout</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
            style={{
              background: "var(--accent-blue-glow)",
              color: "var(--accent-blue)",
              border: "1px solid var(--accent-blue)40",
            }}
          >
            BETA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs" style={{ color: "var(--text-muted)" }}>
            {componentCount} comps · {traceCount} traces · {padCount} pads
          </span>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{
              background: "var(--surface-raised)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
            onClick={() => {
              const data = JSON.stringify(pcbLayout, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "pcb-layout.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={12} /> Export JSON
          </button>
        </div>
      </div>

      
      <div
        className="px-4 py-2 border-b flex items-center justify-between"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface-raised)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            View Layer:
          </span>
          {(["top", "bottom", "both"] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className="px-2 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background:
                  activeLayer === layer ? "var(--accent)" : "var(--surface)",
                color: activeLayer === layer ? "#000" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {layer.charAt(0).toUpperCase() + layer.slice(1)}
            </button>
          ))}
        </div>
        <div
          className="flex items-center gap-3 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <div className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded"
              style={{ background: "#1a472a" }}
            />
            <span>Board</span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded"
              style={{ background: "#ff6600" }}
            />
            <span>Copper</span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: "#ffd700" }}
            />
            <span>Pads</span>
          </div>
        </div>
      </div>

      
      <div className="relative overflow-x-auto overflow-y-hidden lg:overflow-auto max-w-full w-full flex lg:justify-center p-4">
        <div className="flex-shrink-0">
          <PCBRenderer pcb={pcbLayout} activeLayer={activeLayer} />
        </div>
      </div>

      
      <div
        className="px-4 py-3 border-t"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface-raised)",
        }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span style={{ color: "var(--text-muted)" }}>Min Trace Width</span>
            <div className="font-mono" style={{ color: "var(--text-primary)" }}>
              {pcbLayout.designRules.minTraceWidth}mm
            </div>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Min Clearance</span>
            <div className="font-mono" style={{ color: "var(--text-primary)" }}>
              {pcbLayout.designRules.minClearance}mm
            </div>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Board Size</span>
            <div className="font-mono" style={{ color: "var(--text-primary)" }}>
              {pcbLayout.boardWidth}mm × {pcbLayout.boardHeight}mm
            </div>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Mounting Holes</span>
            <div className="font-mono" style={{ color: "var(--text-primary)" }}>
              {pcbLayout.mountingHoles.length} × M3
            </div>
          </div>
        </div>

        
        <div
          className="mt-3 pt-3 border-t text-xs"
          style={{ borderColor: "var(--border)", color: "var(--accent-amber)" }}
        >
          <span className="font-medium">🚧 Beta Notice:</span> This PCB layout
          is auto-generated and may require verification. Complex designs,
          high-speed signals, and dense component placement may need manual
          adjustment in a professional PCB tool before manufacturing.
        </div>
      </div>
    </div>
  );
}
