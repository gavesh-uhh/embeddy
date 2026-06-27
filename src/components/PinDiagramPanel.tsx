"use client";

import { PinDiagram, SignalType } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";

interface Props {
  pinDiagram?: PinDiagram;
  error?: string;
  onRetry?: () => void;
}

const SIGNAL_COLORS: Record<SignalType, string> = {
  power: "#f97316",
  ground: "#6b7280",
  digital: "#3b82f6",
  analog: "#a855f7",
  i2c: "#06b6d4",
  spi: "#f59e0b",
  uart: "#10b981",
};

const SIGNAL_LABELS: Record<SignalType, string> = {
  power: "Power",
  ground: "Ground",
  digital: "Digital",
  analog: "Analog",
  i2c: "I²C",
  spi: "SPI",
  uart: "UART",
};

const SIGNAL_ORDER: SignalType[] = ["power", "ground", "i2c", "spi", "uart", "digital", "analog"];

export default function PinDiagramPanel({ pinDiagram, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="panel-header">Pin Diagram</span>
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

  if (!pinDiagram) return (
    <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Pin Diagram</span>
      </div>
      <SkeletonLoader lines={8} />
    </div>
  );

  // Group pins by signalType
  const grouped: Partial<Record<SignalType, typeof pinDiagram.pins>> = {};
  for (const pin of pinDiagram.pins) {
    if (!grouped[pin.signalType]) grouped[pin.signalType] = [];
    grouped[pin.signalType]!.push(pin);
  }

  return (
    <div className="rounded border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Pin Diagram</span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {pinDiagram.pins.length} pin{pinDiagram.pins.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b flex flex-wrap gap-3" style={{ borderColor: "var(--border)", background: "var(--surface-raised)" }}>
        {SIGNAL_ORDER.filter((s) => grouped[s]).map((sig) => (
          <div key={sig} className="flex items-center gap-1.5 text-xs">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: SIGNAL_COLORS[sig] }} />
            <span style={{ color: "var(--text-muted)" }}>{SIGNAL_LABELS[sig]}</span>
          </div>
        ))}
      </div>

      <div className="overflow-auto">
        {SIGNAL_ORDER.filter((sig) => grouped[sig]).map((sig) => (
          <div key={sig}>
            {/* Section header */}
            <div
              className="px-4 py-1.5 flex items-center gap-2"
              style={{ background: `${SIGNAL_COLORS[sig]}10`, borderBottom: `1px solid ${SIGNAL_COLORS[sig]}30` }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: SIGNAL_COLORS[sig] }}
              />
              <span className="panel-header" style={{ color: SIGNAL_COLORS[sig] }}>
                {SIGNAL_LABELS[sig]}
              </span>
            </div>

            {/* Pin rows */}
            {grouped[sig]!.map((pin, i) => (
              <div
                key={i}
                className="grid items-center px-4 py-2.5 border-b hover:bg-[var(--surface-raised)] transition-colors"
                style={{
                  borderColor: "var(--border)",
                  gridTemplateColumns: "1fr auto 1fr",
                  gap: "12px",
                }}
              >
                {/* Left: Component + pin */}
                <div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {pin.component}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {pin.pin}
                    {pin.voltage && (
                      <span className="ml-1.5 px-1 rounded" style={{ background: "var(--surface-raised)", color: "var(--text-muted)", fontSize: "10px" }}>
                        {pin.voltage}
                      </span>
                    )}
                  </div>
                </div>

                {/* Center: Wire line */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <div className="w-8 h-px" style={{ background: SIGNAL_COLORS[sig] }} />
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: SIGNAL_COLORS[sig] }}
                  />
                  <div className="w-8 h-px" style={{ background: SIGNAL_COLORS[sig] }} />
                </div>

                {/* Right: Board pin */}
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
