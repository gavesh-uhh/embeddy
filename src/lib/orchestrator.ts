import { PIPELINE_STAGE_LABELS } from "@/lib/pipelineStages";
import {
  ProjectOverviewAgent,
} from "@/lib/agents/ProjectOverviewAgent";
import { PinDiagramAgent } from "@/lib/agents/PinDiagramAgent";
import { CircuitSchematicAgent } from "@/lib/agents/CircuitSchematicAgent";
import { FatalIssuesAgent } from "@/lib/agents/FatalIssuesAgent";
import { CompatibilityCheckAgent } from "@/lib/agents/CompatibilityCheckAgent";
import { PowerBudgetAgent } from "@/lib/agents/PowerBudgetAgent";
import { BOMAgent } from "@/lib/agents/BOMAgent";
import { CodeSkeletonAgent } from "@/lib/agents/CodeSkeletonAgent";

import {
  OverviewSchema,
  PinDiagramSchema,
  CircuitSchematicSchema,
  FatalIssuesSchema,
  CompatibilityChecksSchema,
  PowerBudgetSchema,
  BOMSchema,
  CodeSkeletonSchema,
} from "@/lib/schemas";
import type {
  BoardType,
  BOM,
  CircuitSchematic,
  CodeSkeleton,
  CompatibilityChecks,
  FatalIssues,
  Pin,
  PinDiagram,
  PowerBudget,
  ProjectOverview,
} from "@/lib/types";

export const SECTION_KEYS = [
  "overview",
  "pinDiagram",
  "schematic",
  "fatalIssues",
  "compatibility",
  "powerBudget",
  "bom",
  "codeSkeleton",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export function isSectionKey(value: string): value is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(value);
}

export interface OrchestratorContext {
  description: string;
  board?: BoardType;
  components?: string[];
  pins?: Pin[];
  warnings?: string[];
  language?: "C++" | "MicroPython";
  framework?: "Arduino" | "ESP-IDF" | "STM32 HAL";
  fileContents?: string[];
}

interface SectionDef<T> {
  run: (ctx: OrchestratorContext) => Promise<T>;
  validate: (value: unknown) => T;
}

function validated<Output>(
  run: (ctx: OrchestratorContext) => Promise<unknown>,
  schema: { parse: (value: unknown) => Output },
): SectionDef<Output> {
  return {
    run: async (ctx) => schema.parse(await run(ctx)),
    validate: (value) => schema.parse(value),
  };
}

// ZodError.message is a JSON blob of every issue, which is meaningless in the
// UI. Log the detail server-side and surface a short human sentence.
function describeAgentError(e: unknown, section: string): string {
  const issues = (e as { issues?: { path: (string | number)[]; message: string }[] })?.issues;
  if (Array.isArray(issues)) {
    console.error(`[orchestrator] ${section} schema violation:`, e);
    const first = issues[0];
    const where = first?.path?.length ? ` at "${first.path.join(".")}"` : "";
    return `The model returned an unusable ${section} result${where}. Please retry.`;
  }
  return e instanceof Error ? e.message : String(e);
}

const SECTIONS: Record<SectionKey, SectionDef<unknown>> = {
  overview: {
    run: async (ctx) => {
      const result = await ProjectOverviewAgent(
        ctx.description,
        ctx.fileContents ?? [],
        ctx.board,
      );
      const parsed = OverviewSchema.parse(result);
      if (!parsed.components || parsed.components.length === 0) {
        throw new Error(
          "Overview analysis returned no components — try rephrasing your project description",
        );
      }
      return parsed;
    },
    validate: (v) => OverviewSchema.parse(v),
  },
  pinDiagram: validated(
    (ctx) =>
      PinDiagramAgent(ctx.components ?? [], ctx.board ?? "Arduino Uno"),
    PinDiagramSchema,
  ),
  schematic: validated(
    (ctx) =>
      CircuitSchematicAgent(
        ctx.components ?? [],
        ctx.pins ?? [],
        ctx.board ?? "Arduino Uno",
      ),
    CircuitSchematicSchema,
  ),
  fatalIssues: validated(
    (ctx) =>
      FatalIssuesAgent(
        ctx.board ?? "Arduino Uno",
        ctx.components ?? [],
        ctx.description,
        ctx.warnings ?? [],
      ),
    FatalIssuesSchema,
  ),
  compatibility: validated(
    (ctx) =>
      CompatibilityCheckAgent(ctx.board ?? "Arduino Uno", ctx.components ?? []),
    CompatibilityChecksSchema,
  ),
  powerBudget: validated(
    (ctx) =>
      PowerBudgetAgent(ctx.components ?? [], ctx.board ?? "Arduino Uno"),
    PowerBudgetSchema,
  ),
  bom: validated((ctx) => BOMAgent(ctx.components ?? []), BOMSchema),
  codeSkeleton: validated(
    (ctx) =>
      CodeSkeletonAgent(
        ctx.board ?? "Arduino Uno",
        ctx.components ?? [],
        ctx.pins ?? [],
        ctx.language,
        ctx.framework,
      ),
    CodeSkeletonSchema,
  ),
};

export async function runSection(
  key: SectionKey,
  ctx: OrchestratorContext,
): Promise<unknown> {
  return SECTIONS[key].run(ctx);
}

export interface CreationResult {
  overview: ProjectOverview;
  pinDiagram: PinDiagram;
  sections: {
    schematic?: CircuitSchematic;
    fatalIssues?: FatalIssues;
    compatibility?: CompatibilityChecks;
    powerBudget?: PowerBudget;
    bom?: BOM;
    codeSkeleton?: CodeSkeleton;
  };
  errors: Record<string, string>;
}

export interface PipelineStageEvent {
  key: SectionKey;
  label: string;
  status: "running" | "done" | "failed";
}

export interface PipelineProgressEvent {
  stage: "stage" | "done" | "error";
  data: PipelineStageEvent | CreationResult | { message: string };
}

export type PipelineReporter = (event: PipelineProgressEvent) => void;

export async function runCreationPipeline(
  ctx: OrchestratorContext,
  report?: PipelineReporter,
): Promise<CreationResult> {
  const errors: Record<string, string> = {};

  const emit = (key: SectionKey, status: "running" | "done" | "failed") =>
    report?.({
      stage: "stage",
      data: { key, label: PIPELINE_STAGE_LABELS[key], status },
    });

  emit("overview", "running");
  let overview: ProjectOverview;
  try {
    overview = (await runSection("overview", ctx)) as ProjectOverview;
    emit("overview", "done");
  } catch (e) {
    emit("overview", "failed");
    throw e;
  }
  const board = ctx.board ?? overview.board;
  const fullCtx: OrchestratorContext = {
    ...ctx,
    board,
    components: overview.components,
  };

  emit("pinDiagram", "running");
  let pinDiagram: PinDiagram;
  try {
    pinDiagram = (await runSection("pinDiagram", fullCtx)) as PinDiagram;
    emit("pinDiagram", "done");
  } catch (e) {
    errors.pinDiagram = describeAgentError(e, "pin diagram");
    emit("pinDiagram", "failed");
    pinDiagram = { pins: [] };
  }

  const pipelineCtx: OrchestratorContext = { ...fullCtx, pins: pinDiagram.pins };

  const keys: SectionKey[] = [
    "schematic",
    "fatalIssues",
    "compatibility",
    "powerBudget",
    "bom",
    "codeSkeleton",
  ];

  keys.forEach((key) => emit(key, "running"));

  const settled = await Promise.allSettled(
    keys.map((key) => runSection(key, pipelineCtx)),
  );

  keys.forEach((key, i) =>
    emit(key, settled[i].status === "fulfilled" ? "done" : "failed"),
  );

  const fulfilled = new Map<string, unknown>();
  keys.forEach((key, i) => {
    const outcome = settled[i];
    if (outcome.status === "fulfilled") {
      fulfilled.set(key, outcome.value);
    } else {
      const reason: unknown = outcome.reason;
      errors[key] = describeAgentError(reason ?? "failed", key);
    }
  });

  return {
    overview,
    pinDiagram,
    sections: {
      schematic: fulfilled.get("schematic") as CircuitSchematic | undefined,
      fatalIssues: fulfilled.get("fatalIssues") as FatalIssues | undefined,
      compatibility: fulfilled.get("compatibility") as
        | CompatibilityChecks
        | undefined,
      powerBudget: fulfilled.get("powerBudget") as PowerBudget | undefined,
      bom: fulfilled.get("bom") as BOM | undefined,
      codeSkeleton: fulfilled.get("codeSkeleton") as CodeSkeleton | undefined,
    },
    errors,
  };
}
