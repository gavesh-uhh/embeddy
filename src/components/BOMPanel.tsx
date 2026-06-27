"use client";

import { BOM } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";

interface Props {
  bom?: BOM;
  error?: string;
  onRetry?: () => void;
}

export default function BOMPanel({ bom, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="panel-header">Bill of Materials</span>
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

  if (!bom) return (
    <div className="rounded border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Bill of Materials</span>
      </div>
      <SkeletonLoader lines={6} />
    </div>
  );

  return (
    <div className="rounded border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Bill of Materials</span>
        <span className="text-sm font-semibold" style={{ color: "var(--accent-orange)" }}>
          Rs. {bom.totalEstimatedLKR.toFixed(2)} est.
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-muted)" }}>Component</th>
              <th className="px-3 py-2.5 text-center font-medium" style={{ color: "var(--text-muted)" }}>Qty</th>
              <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-muted)" }}>Description</th>
              <th className="px-4 py-2.5 text-right font-medium" style={{ color: "var(--text-muted)" }}>Unit (LKR)</th>
              <th className="px-4 py-2.5 text-right font-medium" style={{ color: "var(--text-muted)" }}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {bom.items.map((item, i) => (
              <tr key={i} className="hover:bg-[var(--surface-raised)] transition-colors">
                <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>
                  {item.name}
                </td>
                <td className="px-3 py-2.5 text-center" style={{ color: "var(--text-muted)" }}>
                  {item.quantity}
                </td>
                <td className="px-4 py-2.5" style={{ color: "var(--text-muted)", maxWidth: "300px" }}>
                  {item.description}
                </td>
                <td className="px-4 py-2.5 text-right" style={{ color: "var(--text-primary)" }}>
                  Rs. {item.estimatedLKR.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 text-right font-medium" style={{ color: "var(--accent-orange)" }}>
                  Rs. {(item.quantity * item.estimatedLKR).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid var(--border)" }}>
              <td colSpan={4} className="px-4 py-3 text-right font-medium" style={{ color: "var(--text-muted)" }}>
                Total Estimated Cost
              </td>
              <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--accent-orange)" }}>
                Rs. {bom.totalEstimatedLKR.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
