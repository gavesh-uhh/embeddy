import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { ProjectOverviewAgent } from "@/lib/agents/ProjectOverviewAgent";
import { PinDiagramAgent } from "@/lib/agents/PinDiagramAgent";
import { CircuitSchematicAgent } from "@/lib/agents/CircuitSchematicAgent";
import { FatalIssuesAgent } from "@/lib/agents/FatalIssuesAgent";
import { CompatibilityCheckAgent } from "@/lib/agents/CompatibilityCheckAgent";
import { PowerBudgetAgent } from "@/lib/agents/PowerBudgetAgent";
import { BOMAgent } from "@/lib/agents/BOMAgent";
import { CodeSkeletonAgent } from "@/lib/agents/CodeSkeletonAgent";
import { PCBLayoutAgent } from "@/lib/agents/PCBLayoutAgent";
import { ProjectData, BoardType } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, board, description, fileContents, generatePCB } = body as {
      title: string;
      board: BoardType;
      description: string;
      fileContents: string[];
      generatePCB?: boolean;
    };

    if (!title || !description) {
      return NextResponse.json(
        { error: "title and description are required" },
        { status: 400 },
      );
    }

    const id = uuidv4();
    const errors: Record<string, string> = {};

    // Step 1: Run overview agent first to get component list
    let overview;
    try {
      overview = await ProjectOverviewAgent(
        description,
        fileContents || [],
        board,
      );
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to analyze project: " + (e as Error).message },
        { status: 500 },
      );
    }

    const components = overview.components;
    const resolvedBoard = board || overview.board;

    // Step 2: Run pin diagram to get pin assignments for dependent agents
    let pinDiagram;
    try {
      pinDiagram = await PinDiagramAgent(components, resolvedBoard);
    } catch (e) {
      errors.pinDiagram = (e as Error).message;
      pinDiagram = { pins: [] };
    }

    const pins = pinDiagram.pins;

    // Step 3: Run remaining agents in parallel
    const [
      schematicResult,
      fatalIssuesResult,
      compatibilityResult,
      powerBudgetResult,
      bomResult,
      codeSkeletonResult,
    ] = await Promise.allSettled([
      CircuitSchematicAgent(components, pins, resolvedBoard),
      FatalIssuesAgent(
        resolvedBoard,
        components,
        description,
        overview.warnings,
      ),
      CompatibilityCheckAgent(resolvedBoard, components),
      PowerBudgetAgent(components, resolvedBoard),
      BOMAgent(components),
      CodeSkeletonAgent(resolvedBoard, components, pins),
    ]);

    const schematic =
      schematicResult.status === "fulfilled"
        ? schematicResult.value
        : undefined;
    if (schematicResult.status === "rejected")
      errors.schematic = schematicResult.reason?.message;

    const fatalIssues =
      fatalIssuesResult.status === "fulfilled"
        ? fatalIssuesResult.value
        : undefined;
    if (fatalIssuesResult.status === "rejected")
      errors.fatalIssues = fatalIssuesResult.reason?.message;

    const compatibility =
      compatibilityResult.status === "fulfilled"
        ? compatibilityResult.value
        : undefined;
    if (compatibilityResult.status === "rejected")
      errors.compatibility = compatibilityResult.reason?.message;

    const powerBudget =
      powerBudgetResult.status === "fulfilled"
        ? powerBudgetResult.value
        : undefined;
    if (powerBudgetResult.status === "rejected")
      errors.powerBudget = powerBudgetResult.reason?.message;

    const bom = bomResult.status === "fulfilled" ? bomResult.value : undefined;
    if (bomResult.status === "rejected") errors.bom = bomResult.reason?.message;

    const codeSkeleton =
      codeSkeletonResult.status === "fulfilled"
        ? codeSkeletonResult.value
        : undefined;
    if (codeSkeletonResult.status === "rejected")
      errors.codeSkeleton = codeSkeletonResult.reason?.message;

    // Step 4: Generate PCB layout if schematic succeeded and generation requested
    let pcbLayout;
    if (schematic && generatePCB) {
      try {
        pcbLayout = await PCBLayoutAgent(
          components,
          pins,
          schematic,
          resolvedBoard,
        );
      } catch (e) {
        errors.pcbLayout = (e as Error).message;
      }
    }

    const project: ProjectData = {
      id,
      title,
      board: resolvedBoard,
      description,
      createdAt: new Date().toISOString(),
      overview,
      pinDiagram,
      schematic,
      fatalIssues,
      compatibility,
      powerBudget,
      bom,
      codeSkeleton,
      pcbLayout,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };

    return NextResponse.json(project);
  } catch (e) {
    console.error("Project creation error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
