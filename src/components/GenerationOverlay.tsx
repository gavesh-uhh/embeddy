"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  Code2,
  Cpu,
  Loader2,
  PinIcon,
  ShieldAlert,
  ShoppingCart,
  Wrench,
  Zap,
  X,
} from "lucide-react";
import {
  PIPELINE_STAGES,
  PipelineStageKey,
  PipelineStageStatus,
  pipelineCompletion,
} from "@/lib/pipelineStages";

const STAGE_ICONS: Record<PipelineStageKey, typeof Bot> = {
  overview: Bot,
  pinDiagram: PinIcon,
  schematic: Zap,
  fatalIssues: ShieldAlert,
  compatibility: Wrench,
  powerBudget: Zap,
  bom: ShoppingCart,
  codeSkeleton: Code2,
};

export interface GenerationOverlayProps {
  title: string;
  board: string;
  stages: Record<string, PipelineStageStatus>;
  /** Set when the pipeline errored out; keeps the overlay visible for a beat. */
  failed?: boolean;
}

/** Groups stages into readable phases so the list isn't one long flat column. */
const PHASES: Array<{ label: string; keys: PipelineStageKey[] }> = [
  { label: "Understanding", keys: ["overview", "pinDiagram"] },
  {
    label: "Designing",
    keys: ["schematic", "compatibility", "powerBudget"],
  },
  {
    label: "Verifying",
    keys: ["fatalIssues", "bom", "codeSkeleton"],
  },
];

export default function GenerationOverlay({
  title,
  board,
  stages,
  failed = false,
}: GenerationOverlayProps) {
  const [display, setDisplay] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const raf = useRef<number | null>(null);

  const target = useMemo(
    () => (failed ? 1 : pipelineCompletion(stages)),
    [stages, failed],
  );

  // Ease the bar toward the real completion ratio so it never snaps.
  useEffect(() => {
    let current = display;
    const step = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.001) {
        current = target;
        setDisplay(target);
        raf.current = null;
        return;
      }
      current += diff * 0.12;
      setDisplay(current);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const percent = Math.min(100, Math.round(display * 100));
  const activeStage = PIPELINE_STAGES.find((s) => stages[s.key] === "running");

  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10"
      style={{ background: "rgba(3,3,3,0.8)", backdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Generating project"
    >
      <div
        className="w-full max-w-lg rounded-2xl border min-w-0"
        style={{
          borderColor: "#00ff6626",
          background: "var(--surface)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
{/* header */}
        <div className="px-8 pt-7 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={13} style={{ color: "var(--accent)" }} />
            <span
              className="text-[10px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: "var(--accent)" }}
            >
              Generating
            </span>
          </div>
          <h2
            className="text-xl font-semibold tracking-tight truncate"
            style={{ color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}
          >
            {title}
          </h2>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
            {activeStage
              ? activeStage.label
              : failed
                ? "Pipeline stopped"
                : "Preparing agents"}
            <span className="mx-2 opacity-40">/</span>
            <span className="opacity-70">{board}</span>
          </p>
        </div>

        {/* progress */}
        <div className="px-8 pb-7">
          <div className="flex items-end justify-between mb-3.5">
            <span
              className="text-4xl font-semibold tabular-nums leading-none"
              style={{ color: "var(--accent)", fontFamily: "Outfit, sans-serif" }}
            >
              {percent}
              <span className="text-lg ml-1 opacity-60">%</span>
            </span>
            <span
              className="text-xs font-mono tabular-nums mb-1"
              style={{ color: "var(--text-dim)" }}
            >
              {mins}:{secs}
            </span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: "var(--surface-raised)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${percent}%`,
                background: failed
                  ? "var(--accent-red)"
                  : "var(--accent)",
                boxShadow: failed ? "none" : "0 0 10px var(--accent-glow-strong)",
                transition: "width 120ms linear",
              }}
            />
          </div>
        </div>

        {/* stage phases */}
        <div
          className="px-8 pb-8 space-y-6 max-h-[42vh] overflow-y-auto overflow-x-hidden"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "1.75rem" }}
        >
          {PHASES.map((phase) => {
            const phaseStages = phase.keys
              .map((key) => PIPELINE_STAGES.find((s) => s.key === key)!)
              .filter(Boolean);
            const settled = phaseStages.filter(
              (s) => stages[s.key] === "done" || stages[s.key] === "failed",
            ).length;
            const phaseActive = phaseStages.some(
              (s) => stages[s.key] === "running",
            );
            const phaseDone = settled === phaseStages.length;

            return (
              <div key={phase.label}>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span
                    className="text-[10px] font-semibold tracking-[0.14em] uppercase"
                    style={{
                      color: phaseActive
                        ? "var(--accent)"
                        : phaseDone
                          ? "var(--text-muted)"
                          : "var(--text-dim)",
                    }}
                  >
                    {phase.label}
                  </span>
                  <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {settled}/{phaseStages.length}
                  </span>
                </div>

                <div className="space-y-1">
                  {phaseStages.map((stage) => {
                    const status = stages[stage.key] ?? "pending";
                    const Icon = STAGE_ICONS[stage.key];

                    return (
                      <div
                        key={stage.key}
                        className="flex items-center gap-3 py-1.5"
                      >
                        <span
                          className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                          style={{
                            color:
                              status === "done"
                                ? "var(--accent)"
                                : status === "failed"
                                  ? "var(--accent-red)"
                                  : status === "running"
                                    ? "var(--accent)"
                                    : "var(--text-dim)",
                          }}
                        >
                          {status === "done" ? (
                            <Check size={13} strokeWidth={2.5} />
                          ) : status === "failed" ? (
                            <X size={13} strokeWidth={2.5} />
                          ) : status === "running" ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Icon size={12} />
                          )}
                        </span>

                        <span
                          className="text-[13px] flex-1"
                          style={{
                            color:
                              status === "pending"
                                ? "var(--text-dim)"
                                : "var(--text-primary)",
                          }}
                        >
                          {stage.label}
                        </span>

                        {status === "running" && (
                          <span
                            className="text-[10px] tracking-wide uppercase"
                            style={{ color: "var(--accent)" }}
                          >
                            working
                          </span>
                        )}
                        {status === "failed" && (
                          <span
                            className="text-[10px]"
                            style={{ color: "var(--accent-red)" }}
                          >
                            skipped
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
