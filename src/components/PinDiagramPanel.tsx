"use client";

import { PinDiagram, SignalType } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";
import { GitBranch, XCircle, RotateCcw } from "lucide-react";

interface Props {
  pinDiagram?: PinDiagram;
  error?: string;
  onRetry?: () => void;
}

const SIGNAL_COLORS: Record<SignalType, string> = {
  power:   "#ff3b3b",
  ground:  "#333333",
  digital: "#00ff66",
  analog:  "#00b4ff",
  i2c:     "#00cc52",
  spi:     "#00b4ff",
  uart:    "#a3e635",
};

const SIGNAL_LABELS: Record<SignalType, string> = {
  power:   "Power",
  ground:  "Ground",
  digital: "Digital",
  analog:  "Analog",
  i2c:     "I²C",
  spi:     "SPI",
  uart:    "UART",
};

const SIGNAL_ORDER: SignalType[] = ["power", "ground", "i2c", "spi", "uart", "digital", "analog"];

export default function PinDiagramPanel({ pinDiagram, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <GitBranch size={13} style={{ color: "var(--text-muted)" }} />
          <span className="panel-header">Pin Diagram</span>
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

  if (!pinDiagram) return (
    <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <GitBranch size={13} style={{ color: "var(--text-muted)" }} />
        <span className="panel-header">Pin Diagram</span>
      </div>
      <SkeletonLoader lines={8} />
    </div>
  );

  const grouped: Partial<Record<SignalType, typeof pinDiagram.pins>> = {};
  for (const pin of pinDiagram.pins) {
    if (!grouped[pin.signalType]) grouped[pin.signalType] = [];
    grouped[pin.signalType]!.push(pin);
  }

  return (
    <div className="rounded-lg border overflow-hidden card-hover" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <GitBranch size={13} style={{ color: "var(--accent)" }} />
          <span className="panel-header">Pin Diagram</span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {pinDiagram.pins.length} pin{pinDiagram.pins.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="px-4 py-2 border-b flex flex-wrap gap-3" style={{ borderColor: "var(--border)", background: "var(--surface-raised)" }}>
        {SIGNAL_ORDER.filter((s) => grouped[s]).map((sig) => (
          <div key={sig} className="flex items-center gap-1.5 text-xs">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: SIGNAL_COLORS[sig] }} />
            <span style={{ color: "var(--text-muted)" }}>{SIGNAL_LABELS[sig]}</span>
          </div>
        ))}
      </div>

      <div className="overflow-hidden w-full">
        {SIGNAL_ORDER.filter((sig) => grouped[sig]).map((sig) => (
          <div key={sig}>
            <div
              className="px-4 py-1.5 flex items-center gap-2"
              style={{ background: `${SIGNAL_COLORS[sig]}10`, borderBottom: `1px solid ${SIGNAL_COLORS[sig]}25` }}
            >
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: SIGNAL_COLORS[sig] }} />
              <span className="panel-header" style={{ color: SIGNAL_COLORS[sig] }}>
                {SIGNAL_LABELS[sig]}
              </span>
            </div>

            {grouped[sig]!.map((pin, i) => (
              <div
                key={i}
                className="grid items-center px-4 py-2.5 border-b transition-colors"
                style={{
                  borderColor: "var(--border)",
                  gridTemplateColumns: "1fr auto 1fr",
                  gap: "12px",
                  background: "transparent",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-raised)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{pin.component}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {pin.pin}
                    {pin.voltage && (
                      <span className="ml-1.5 px-1 rounded" style={{ background: "var(--surface-raised)", color: "var(--text-muted)", fontSize: "10px" }}>
                        {pin.voltage}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <div className="w-8 h-px" style={{ background: SIGNAL_COLORS[sig] }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: SIGNAL_COLORS[sig], boxShadow: `0 0 4px ${SIGNAL_COLORS[sig]}` }} />
                  <div className="w-8 h-px" style={{ background: SIGNAL_COLORS[sig] }} />
                </div>

                <div className="text-right">
                  <div
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium"
                    style={{
                      background: `${SIGNAL_COLORS[sig]}15`,
                      color: SIGNAL_COLORS[sig],
                      border: `1px solid ${SIGNAL_COLORS[sig]}30`,
                    }}
                  >
                    {pin.boardPin}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
