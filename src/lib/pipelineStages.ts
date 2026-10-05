/**
 * Shared description of the creation pipeline stages.
 *
 * Kept free of server-only imports so both the orchestrator and the client
 * overlay can rely on a single source of truth.
 */

export const PIPELINE_STAGES = [
  { key: "overview", label: "Understanding your brief", weight: 3 },
  { key: "pinDiagram", label: "Mapping pin assignments", weight: 1 },
  { key: "schematic", label: "Routing the circuit schematic", weight: 3 },
  { key: "fatalIssues", label: "Scanning for design faults", weight: 2 },
  { key: "compatibility", label: "Checking compatibility", weight: 1 },
  { key: "powerBudget", label: "Computing power budget", weight: 1 },
  { key: "bom", label: "Pricing the bill of materials", weight: 1 },
  { key: "codeSkeleton", label: "Writing the firmware skeleton", weight: 2 },
] as const;

export type PipelineStageKey = (typeof PIPELINE_STAGES)[number]["key"];

export type PipelineStageStatus = "pending" | "running" | "done" | "failed";

export interface PipelineStageState {
  key: PipelineStageKey;
  status: PipelineStageStatus;
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStageKey, string> =
  Object.fromEntries(
    PIPELINE_STAGES.map((s) => [s.key, s.label]),
  ) as Record<PipelineStageKey, string>;

export const PIPELINE_STAGE_WEIGHTS: Record<PipelineStageKey, number> =
  Object.fromEntries(
    PIPELINE_STAGES.map((s) => [s.key, s.weight]),
  ) as Record<PipelineStageKey, number>;

/**
 * Weighted completion ratio (0–1) for a set of stage states. Running stages
 * contribute a partial amount so the bar keeps creeping instead of jumping.
 */
export function pipelineCompletion(
  states: Record<string, PipelineStageStatus>,
): number {
  const total = PIPELINE_STAGES.reduce((sum, s) => sum + s.weight, 0);
  let earned = 0;
  for (const stage of PIPELINE_STAGES) {
    const status = states[stage.key];
    if (status === "done") earned += stage.weight;
    else if (status === "running") earned += stage.weight * 0.45;
  }
  return Math.min(1, earned / total);
}