"use client";

import { BOM } from "@/lib/types";
import SkeletonLoader from "./SkeletonLoader";
import { ShoppingCart, RotateCcw, XCircle } from "lucide-react";

interface Props {
  bom?: BOM;
  error?: string;
  onRetry?: () => void;
}

export default function BOMPanel({ bom, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <ShoppingCart size={13} style={{ color: "var(--text-muted)" }} />
          <span className="panel-header">Bill of Materials</span>
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

  if (!bom) return (
    <div className="rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <ShoppingCart size={13} style={{ color: "var(--text-muted)" }} />
        <span className="panel-header">Bill of Materials</span>
      </div>
      <SkeletonLoader lines={6} />
    </div>
  );

  return (
    <div className="rounded-lg border overflow-hidden card-hover" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <ShoppingCart size={13} style={{ color: "var(--accent)" }} />
        <span className="panel-header">Bill of Materials</span>
        <span className="ml-auto text-sm font-semibold" style={{ color: "var(--accent)" }}>
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
              <tr key={i}
                className="transition-colors"
                style={{ background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-raised)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{item.name}</td>
                <td className="px-3 py-2.5 text-center" style={{ color: "var(--text-muted)" }}>{item.quantity}</td>
                <td className="px-4 py-2.5" style={{ color: "var(--text-muted)", maxWidth: "300px" }}>{item.description}</td>
                <td className="px-4 py-2.5 text-right" style={{ color: "var(--text-primary)" }}>
                  Rs. {item.estimatedLKR.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 text-right font-medium" style={{ color: "var(--accent)" }}>
                  Rs. {(item.quantity * item.estimatedLKR).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "1px solid #00ff6630", background: "#00ff6608" }}>
              <td colSpan={4} className="px-4 py-3 text-right font-medium" style={{ color: "var(--text-muted)" }}>
                Total Estimated Cost
              </td>
              <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--accent)" }}>
                Rs. {bom.totalEstimatedLKR.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
