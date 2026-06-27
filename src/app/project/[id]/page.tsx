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

type DashboardSection = "overview" | "hardware" | "procurement" | "software";

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

  const hasFatal = project?.fatalIssues?.issues?.some(
    (i) => i.severity === "fatal",
  );

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
      // Map agentKey to project field
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

      // Save and update state
      const { saveProject } = await import("@/lib/projectStore");
      saveProject(updated);
      setProject(updated);
    } catch {
      // Keep existing error
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
        <div className="text-4xl">🔌</div>
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Project not found
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This project ID doesn&apos;t exist in your browser storage.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded text-sm font-medium"
          style={{ background: "var(--accent-orange)", color: "white" }}
        >
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
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </div>
      </div>
    );
  }

  const errors = project.errors || {};

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Header ── */}
      <header
        className="flex-shrink-0 border-b px-6 py-3 flex items-center gap-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--accent-orange)", color: "white" }}
          >
            E
          </div>
          <span
            className="font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Embeddy
          </span>
        </button>

        <span style={{ color: "var(--border)" }}>/</span>

        <h1
          className="font-semibold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
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

        <span
          className="ml-auto text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {new Date(project.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT SIDEBAR NAVIGATION ── */}
        <aside
          className="flex-shrink-0 border-r overflow-y-auto p-4 flex flex-col gap-2"
          style={{
            width: "240px",
            borderColor: "var(--border)",
            background: "var(--surface)",
          }}
        >
          <div
            className="text-xs font-semibold mb-2"
            style={{
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Dashboard
          </div>

          {(["overview", "hardware", "procurement", "software"] as const).map(
            (section) => (
              <button
                key={section}
                onClick={() => setActiveTab(section as any)} // Overloading activeTab state for now, will rename later if needed
                className="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors w-full text-left"
                style={{
                  background:
                    activeTab === section
                      ? "var(--surface-raised)"
                      : "transparent",
                  color:
                    activeTab === section
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  border:
                    activeTab === section
                      ? "1px solid var(--border)"
                      : "1px solid transparent",
                }}
              >
                {section === "overview" && "Overview & Health"}
                {section === "hardware" && "Schematic & Wiring"}
                {section === "procurement" && "Bill of Materials"}
                {section === "software" && "Code Skeleton"}
              </button>
            ),
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: "var(--bg)" }}
        >
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-4">
                  <ProjectOverviewCard
                    overview={project.overview}
                    error={errors.overview}
                  />
                  <PowerBudgetPanel
                    powerBudget={project.powerBudget}
                    error={
                      retrying.powerBudget ? "Retrying…" : errors.powerBudget
                    }
                    onRetry={
                      errors.powerBudget
                        ? () => handleRetry("powerBudget", "powerBudget")
                        : undefined
                    }
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <FatalIssuesPanel
                    fatalIssues={project.fatalIssues}
                    error={
                      retrying.fatalIssues ? "Retrying…" : errors.fatalIssues
                    }
                    onRetry={
                      errors.fatalIssues
                        ? () => handleRetry("fatalIssues", "fatalIssues")
                        : undefined
                    }
                  />
                  <CompatibilityPanel
                    compatibility={project.compatibility}
                    error={
                      retrying.compatibility
                        ? "Retrying…"
                        : errors.compatibility
                    }
                    onRetry={
                      errors.compatibility
                        ? () => handleRetry("compatibility", "compatibility")
                        : undefined
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "hardware" && (
              <div className="flex flex-col gap-6">
                <div
                  style={{
                    height: "500px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  <CircuitRenderer
                    schematic={project.schematic}
                    error={retrying.schematic ? "Retrying…" : errors.schematic}
                    onRetry={
                      errors.schematic
                        ? () => handleRetry("schematic", "schematic")
                        : undefined
                    }
                  />
                </div>
                <PinDiagramPanel
                  pinDiagram={project.pinDiagram}
                  error={errors.pinDiagram}
                />
              </div>
            )}

            {activeTab === "procurement" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <BOMPanel
                    bom={project.bom}
                    error={retrying.bom ? "Retrying…" : errors.bom}
                    onRetry={
                      errors.bom ? () => handleRetry("bom", "bom") : undefined
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "software" && (
              <div
                className="flex flex-col gap-4 h-full"
                style={{ minHeight: "600px" }}
              >
                <CodeSkeletonPanel
                  codeSkeleton={project.codeSkeleton}
                  error={
                    retrying.codeSkeleton ? "Retrying…" : errors.codeSkeleton
                  }
                  onRetry={
                    errors.codeSkeleton
                      ? () => handleRetry("codeSkeleton", "codeSkeleton")
                      : undefined
                  }
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
