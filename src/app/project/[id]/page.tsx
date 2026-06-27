"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadProject } from "@/lib/projectStore";
import { ProjectData } from "@/lib/types";
import BoardBadge from "@/components/BoardBadge";
import ProjectOverviewCard from "@/components/ProjectOverviewCard";
import FatalIssuesPanel from "@/components/FatalIssuesPanel";
import CompatibilityPanel from "@/components/CompatibilityPanel";
import PowerBudgetPanel from "@/components/PowerBudgetPanel";
import BOMPanel from "@/components/BOMPanel";
import CodeSkeletonPanel from "@/components/CodeSkeletonPanel";
import PinDiagramPanel from "@/components/PinDiagramPanel";
import CircuitRenderer from "@/components/CircuitRenderer";
import {
  Cpu,
  LayoutDashboard,
  CircuitBoard,
  ShoppingCart,
  Code2,
  AlertTriangle,
  ChevronLeft,
  RotateCcw,
  Heart,
  Zap,
  Boxes,
} from "lucide-react";

type DashboardSection = "overview" | "hardware" | "procurement" | "software";

const NAV_ITEMS: { key: DashboardSection; label: string; icon: React.ElementType }[] = [
  { key: "overview",     label: "Overview & Health",  icon: LayoutDashboard },
  { key: "hardware",     label: "Schematic & Wiring", icon: CircuitBoard },
  { key: "procurement",  label: "Bill of Materials",  icon: ShoppingCart },
  { key: "software",     label: "Code Skeleton",      icon: Code2 },
];

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardSection>("overview");
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const data = loadProject(id);
    if (!data) {
      setNotFound(true);
    } else {
      setProject(data);
    }
  }, [id]);

  const hasFatal = project?.fatalIssues?.issues?.some((i) => i.severity === "fatal");

  const handleRetry = async (agentKey: string, agentName: string) => {
    if (!project) return;
    setRetrying((prev) => ({ ...prev, [agentKey]: true }));

    try {
      const context = {
        title: project.title,
        board: project.board,
        description: project.description,
        components: project.overview?.components || [],
        pins: project.pinDiagram?.pins || [],
        warnings: project.overview?.warnings || [],
        bomItems: project.bom?.items || [],
        fileContents: [],
      };

      const res = await fetch(`/api/agents/${agentName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectContext: context }),
      });

      if (!res.ok) throw new Error("Agent failed");
      const result = await res.json();

      const updated: ProjectData = { ...project };
      const fieldMap: Record<string, keyof ProjectData> = {
        fatalIssues: "fatalIssues",
        compatibility: "compatibility",
        powerBudget: "powerBudget",
        bom: "bom",
        codeSkeleton: "codeSkeleton",
        schematic: "schematic",
      };
      const field = fieldMap[agentKey];
      if (field) {
        (updated as unknown as Record<string, unknown>)[field] = result;
      }
      if (updated.errors) {
        delete updated.errors[agentKey];
      }

      const { saveProject } = await import("@/lib/projectStore");
      saveProject(updated);
      setProject(updated);
    } catch {
    } finally {
      setRetrying((prev) => ({ ...prev, [agentKey]: false }));
    }
  };

  if (notFound) {
    return (
      <div
        className="min-h-screen flex items-center justify-center flex-col gap-4"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "var(--accent-glow)", border: "1px solid #00ff6625" }}
        >
          <AlertTriangle size={22} style={{ color: "var(--accent)" }} />
        </div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Project not found
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This project ID doesn&apos;t exist in your browser storage.
        </p>
        <button
          onClick={() => router.push("/")}
          className="btn-accent flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ color: "#000" }}
        >
          <ChevronLeft size={14} />
          Back to Home
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <RotateCcw size={14} className="animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  const errors = project.errors || {};

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <header
        className="flex-shrink-0 border-b px-5 py-3 flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            <Cpu size={12} strokeWidth={2.5} />
          </div>
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>Embeddy</span>
        </button>

        <span style={{ color: "var(--text-dim)" }}>/</span>

        <h1 className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)", maxWidth: "280px" }}>
          {project.title}
        </h1>

        <BoardBadge board={project.board} />

        {hasFatal && (
          <span className="relative flex h-2 w-2 ml-1">
            <span
              className="pulse-dot absolute inline-flex h-full w-full rounded-full"
              style={{ background: "var(--accent-red)" }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: "var(--accent-red)" }}
            />
          </span>
        )}

        <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
          {new Date(project.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="flex-shrink-0 border-r overflow-y-auto p-3 flex flex-col gap-1"
          style={{
            width: "220px",
            borderColor: "var(--border)",
            background: "var(--surface)",
          }}
        >
          <div
            className="panel-header px-3 py-2 mb-1"
          >
            Dashboard
          </div>

          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left"
                style={{
                  background: isActive ? "#00ff6610" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  border: `1px solid ${isActive ? "#00ff6630" : "transparent"}`,
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <Icon size={14} strokeWidth={isActive ? 2.5 : 1.75} />
                {label}
              </button>
            );
          })}
        </aside>

        <main
          className="flex-1 overflow-y-auto p-5"
          style={{ background: "var(--bg)" }}
        >
          <div className="max-w-6xl mx-auto flex flex-col gap-5">
            {activeTab === "overview" && (() => {
              const fatalCount = project.fatalIssues?.issues?.filter(i => i.severity === "fatal").length || 0;
              const warningCount = (project.fatalIssues?.issues?.filter(i => i.severity === "warning").length || 0) + (project.overview?.warnings?.length || 0);
              const conflictCount = project.compatibility?.checks?.filter(c => c.voltageConflict).length || 0;
              const healthScore = Math.max(0, 100 - (fatalCount * 30) - (warningCount * 8) - (conflictCount * 12));
              
              let healthLabel = "HEALTHY";
              let healthColor = "var(--accent)";
              let healthBorder = "#00ff6630";
              if (healthScore < 50 || fatalCount > 0) {
                healthLabel = "CRITICAL";
                healthColor = "var(--accent-red)";
                healthBorder = "#ff3b3b30";
              } else if (healthScore < 85 || warningCount > 0 || conflictCount > 0) {
                healthLabel = "WARNING";
                healthColor = "var(--accent-yellow)";
                healthBorder = "#f5c51830";
              }

              const totalCurrent = project.powerBudget?.totalCurrentMa || 0;
              const loadPercent = Math.min(100, (totalCurrent / 500) * 100);
              const overBudget = project.powerBudget?.overBudget || false;

              return (
                <div className="flex flex-col gap-5 fade-up">
                  {/* KPI Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Health Card */}
                    <div className="rounded-lg border p-4 flex flex-col justify-between transition-all duration-300 card-hover relative overflow-hidden"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-xl opacity-20 pointer-events-none"
                        style={{ background: healthColor }} />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: "10px" }}>System Health</span>
                        <Heart size={14} style={{ color: healthColor }} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono tracking-tight flex items-baseline gap-1" style={{ color: "var(--text-primary)" }}>
                          {healthScore}%
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-1"
                            style={{ background: `${healthColor}15`, color: healthColor, border: `1px solid ${healthBorder}` }}>
                            {healthLabel}
                          </span>
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                          {fatalCount > 0 ? `${fatalCount} critical fatal issue(s)` : `${warningCount + conflictCount} warnings / checks`}
                        </p>
                      </div>
                    </div>

                    {/* Power Budget Card */}
                    <div className="rounded-lg border p-4 flex flex-col justify-between transition-all duration-300 card-hover relative overflow-hidden"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-xl opacity-20 pointer-events-none"
                        style={{ background: overBudget ? "var(--accent-red)" : "var(--accent)" }} />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: "10px" }}>Power Load</span>
                        <Zap size={14} style={{ color: overBudget ? "var(--accent-red)" : "var(--accent)" }} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono tracking-tight flex items-baseline gap-1" style={{ color: "var(--text-primary)" }}>
                          {totalCurrent}
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-1"
                            style={{ background: overBudget ? "var(--accent-red)15" : "var(--accent)15", color: overBudget ? "var(--accent-red)" : "var(--accent)", border: `1px solid ${overBudget ? "var(--accent-red)30" : "#00ff6630"}` }}>
                            {overBudget ? "OVERLOAD" : "NORMAL"}
                          </span>
                        </div>
                        <div className="w-full h-1 rounded-full mt-2 overflow-hidden" style={{ background: "var(--surface-raised)" }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${loadPercent}%`,
                              background: overBudget ? "var(--accent-red)" : "var(--accent)",
                            }} />
                        </div>
                        <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                          {overBudget ? "USB budget exceeded!" : `${Math.round(loadPercent)}% of USB max (500mA)`}
                        </p>
                      </div>
                    </div>

                    {/* Cost Card */}
                    <div className="rounded-lg border p-4 flex flex-col justify-between transition-all duration-300 card-hover relative overflow-hidden"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-xl opacity-20 pointer-events-none"
                        style={{ background: "var(--accent)" }} />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: "10px" }}>BOM Estimate</span>
                        <ShoppingCart size={14} style={{ color: "var(--accent)" }} />
                      </div>
                      <div>
                        <div className="text-xl font-bold font-mono tracking-tight truncate animate-pulse" style={{ color: "var(--text-primary)" }}>
                          Rs. {project.bom?.totalEstimatedLKR?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                        <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                          For {project.bom?.items?.length || 0} component lines
                        </p>
                      </div>
                    </div>

                    {/* Modules Card */}
                    <div className="rounded-lg border p-4 flex flex-col justify-between transition-all duration-300 card-hover relative overflow-hidden"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-xl opacity-20 pointer-events-none"
                        style={{ background: "var(--accent-blue)" }} />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", fontSize: "10px" }}>System Modules</span>
                        <Boxes size={14} style={{ color: "var(--accent-blue)" }} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono tracking-tight" style={{ color: "var(--text-primary)" }}>
                          {project.overview?.components?.length || 0}
                        </div>
                        <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                          {project.compatibility?.checks?.length || 0} check points verified
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Panels Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-4">
                      <ProjectOverviewCard overview={project.overview} error={errors.overview} />
                      <PowerBudgetPanel
                        powerBudget={project.powerBudget}
                        error={retrying.powerBudget ? "Retrying…" : errors.powerBudget}
                        onRetry={errors.powerBudget ? () => handleRetry("powerBudget", "powerBudget") : undefined}
                      />
                    </div>
                    <div className="flex flex-col gap-4">
                      <FatalIssuesPanel
                        fatalIssues={project.fatalIssues}
                        error={retrying.fatalIssues ? "Retrying…" : errors.fatalIssues}
                        onRetry={errors.fatalIssues ? () => handleRetry("fatalIssues", "fatalIssues") : undefined}
                      />
                      <CompatibilityPanel
                        compatibility={project.compatibility}
                        error={retrying.compatibility ? "Retrying…" : errors.compatibility}
                        onRetry={errors.compatibility ? () => handleRetry("compatibility", "compatibility") : undefined}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {activeTab === "hardware" && (
              <div className="flex flex-col gap-5 fade-up">
                <div
                  style={{
                    height: "500px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  <CircuitRenderer
                    schematic={project.schematic}
                    error={retrying.schematic ? "Retrying…" : errors.schematic}
                    onRetry={errors.schematic ? () => handleRetry("schematic", "schematic") : undefined}
                  />
                </div>
                <PinDiagramPanel pinDiagram={project.pinDiagram} error={errors.pinDiagram} />
              </div>
            )}

            {activeTab === "procurement" && (
              <div className="w-full fade-up">
                <BOMPanel
                  bom={project.bom}
                  error={retrying.bom ? "Retrying…" : errors.bom}
                  onRetry={errors.bom ? () => handleRetry("bom", "bom") : undefined}
                />
              </div>
            )}

            {activeTab === "software" && (
              <div className="flex flex-col gap-4 fade-up" style={{ minHeight: "600px" }}>
                <CodeSkeletonPanel
                  codeSkeleton={project.codeSkeleton}
                  error={retrying.codeSkeleton ? "Retrying…" : errors.codeSkeleton}
                  onRetry={errors.codeSkeleton ? () => handleRetry("codeSkeleton", "codeSkeleton") : undefined}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
