import { z } from "zod";

export const BOARD_VALUES = [
  "Arduino Uno",
  "Arduino Mega",
  "ESP32",
  "ESP32-S3",
  "STM32F103",
  "STM32F4",
] as const;
export const BoardSchema = z.enum(BOARD_VALUES);

export const LanguageSchema = z.enum(["C++", "MicroPython"]);
export const FrameworkSchema = z.enum(["Arduino", "ESP-IDF", "STM32 HAL"]);

const cappedString = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ""))
    .pipe(z.string().min(1).max(max));

export const PinSchema = z.object({
  // Per-field catch so one malformed pin degrades to blanks instead of
  // discarding every pin in the array (z.array(...).catch([]) would drop all).
  component: z.string().max(150).catch(""),
  pin: z.string().max(100).catch(""),
  boardPin: z.string().max(100).catch(""),
  signalType: z
    .enum(["power", "ground", "digital", "analog", "i2c", "spi", "uart"])
    .catch("digital"),
  voltage: z.string().max(50).catch(""),
});

export const ProjectContextSchema = z.object({
  title: z.string().max(200).optional(),
  description: cappedString(6000),
  board: BoardSchema.optional(),
  components: z.array(z.string().max(200)).max(60).optional(),
  pins: z.array(PinSchema).max(120).optional(),
  warnings: z.array(z.string().max(500)).max(30).optional(),
  bomItems: z
    .array(
      z.object({
        name: z.string().max(200),
        quantity: z.number(),
        description: z.string().max(500),
        estimatedLKR: z.number(),
      }),
    )
    .max(100)
    .optional(),
  language: LanguageSchema.optional(),
  framework: FrameworkSchema.optional(),
});

export const CreateProjectSchema = z.object({
  title: cappedString(200),
  board: BoardSchema.optional(),
  description: cappedString(5000),
  fileContents: z.array(z.string().max(20_000)).max(5).default([]),
});

export const AgentRequestSchema = z.object({
  projectContext: ProjectContextSchema,
});

export const NaturalLanguageRequestSchema = z.object({
  projectContext: ProjectContextSchema,
  userCommand: cappedString(500),
  commandHistory: z.array(z.string().max(500)).max(20).default([]),
});

// ---- LLM output schemas (lenient where models are sloppy) ----

// Models frequently return the bare array where an object was requested, or
// JSON wrapped as a string. Both are recoverable, so normalise them instead of
// failing the whole section. Genuinely unusable input still throws.
function llmObject<T extends z.ZodRawShape>(shape: T, arrayKey: keyof T & string) {
  return z.preprocess((v) => {
    if (Array.isArray(v)) return { [arrayKey]: v };
    if (typeof v === "string") {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return v;
  }, z.object(shape));
}

export const OverviewSchema = z.object({
  summary: z.string().min(1).catch(""),
  board: BoardSchema.catch("Arduino Uno"),
  components: z.array(z.string().min(1).max(200)).min(1).catch([]),
  goals: z.array(z.string()).catch([]),
  warnings: z.array(z.string()).catch([]),
});

export const PinDiagramSchema = llmObject(
  { pins: z.array(PinSchema).catch([]) },
  "pins",
);

export const SchematicConnectionSchema = z.object({
  from: z.string(),
  to: z.string(),
  fromPin: z.string().optional(),
  toPin: z.string().optional(),
  signalType: z.enum(["power", "ground", "data", "analog"]).catch("data"),
});

export const SchematicComponentSchema = z.object({
  id: z.string().min(1),
  type: z.string().catch("module"),
  variant: z.string().catch(""),
  x: z.coerce.number(),
  y: z.coerce.number(),
});

export const CircuitSchematicSchema = z.object({
  components: z.array(SchematicComponentSchema).catch([]),
  connections: z.array(SchematicConnectionSchema).catch([]),
});

export const FatalIssueSchema = z.object({
  severity: z.enum(["fatal", "warning", "info"]).catch("warning"),
  title: z.string(),
  description: z.string().catch(""),
  affectedComponents: z.array(z.string()).catch([]),
});

export const FatalIssuesSchema = llmObject(
  { issues: z.array(FatalIssueSchema).catch([]) },
  "issues",
);

export const CompatibilityCheckSchema = z.object({
  component: z.string(),
  issue: z.string().catch(""),
  resolution: z.string().catch(""),
  voltageConflict: z.coerce.boolean().catch(false),
});

export const CompatibilityChecksSchema = llmObject(
  { checks: z.array(CompatibilityCheckSchema).catch([]) },
  "checks",
);

export const PowerBudgetSchema = z.object({
  totalCurrentMa: z.coerce.number().min(0),
  components: z
    .array(
      z.object({
        name: z.string(),
        currentMa: z.coerce.number().min(0),
        voltage: z.coerce.number().min(0),
      }),
    )
    .catch([]),
  supplyRecommendation: z.string().catch(""),
  overBudget: z.coerce.boolean().catch(false),
});

export const BOMItemSchema = z.object({
  name: z.string(),
  quantity: z.coerce.number().int().min(1),
  description: z.string().catch(""),
  estimatedLKR: z.coerce.number().min(0),
});

export const BOMSchema = llmObject(
  {
    items: z.array(BOMItemSchema).catch([]),
    totalEstimatedLKR: z.coerce.number().min(0).catch(0),
  },
  "items",
);

export const CodeSkeletonSchema = z.object({
  language: LanguageSchema.catch("C++"),
  framework: FrameworkSchema.catch("Arduino"),
  code: z.string().min(1),
});
