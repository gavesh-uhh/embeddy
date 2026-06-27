import { NextRequest, NextResponse } from "next/server";
import { ProjectOverviewAgent } from "@/lib/agents/ProjectOverviewAgent";
import { PinDiagramAgent } from "@/lib/agents/PinDiagramAgent";
import { CircuitSchematicAgent } from "@/lib/agents/CircuitSchematicAgent";
import { FatalIssuesAgent } from "@/lib/agents/FatalIssuesAgent";
import { CompatibilityCheckAgent } from "@/lib/agents/CompatibilityCheckAgent";
import { PowerBudgetAgent } from "@/lib/agents/PowerBudgetAgent";
import { BOMAgent } from "@/lib/agents/BOMAgent";
import { CodeSkeletonAgent } from "@/lib/agents/CodeSkeletonAgent";

type AgentName =
  | "overview"
  | "pinDiagram"
  | "schematic"
  | "fatalIssues"
  | "compatibility"
  | "powerBudget"
  | "bom"
  | "codeSkeleton";

export async function POST(
  req: NextRequest,
  { params }: { params: { agent: string } },
) {
  const agentName = params.agent as AgentName;
  const body = await req.json();
  const { projectContext } = body;

  try {
    let result;
    switch (agentName) {
      case "overview":
        result = await ProjectOverviewAgent(
          projectContext.description,
          projectContext.fileContents || [],
          projectContext.board,
        );
        break;
      case "pinDiagram":
        result = await PinDiagramAgent(
          projectContext.components,
          projectContext.board,
        );
        break;
      case "schematic":
        result = await CircuitSchematicAgent(
          projectContext.components,
          projectContext.pins || [],
          projectContext.board,
        );
        break;
      case "fatalIssues":
        result = await FatalIssuesAgent(
          projectContext.board,
          projectContext.components,
          projectContext.description,
          projectContext.warnings || [],
        );
        break;
      case "compatibility":
        result = await CompatibilityCheckAgent(
          projectContext.board,
          projectContext.components,
        );
        break;
      case "powerBudget":
        result = await PowerBudgetAgent(
          projectContext.components,
          projectContext.board,
        );
        break;
      case "bom":
        result = await BOMAgent(projectContext.components);
        break;
      case "codeSkeleton":
        result = await CodeSkeletonAgent(
          projectContext.board,
          projectContext.components,
          projectContext.pins || [],
        );
        break;
      default:
        return NextResponse.json(
          { error: `Unknown agent: ${agentName}` },
          { status: 400 },
        );
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error(`Agent ${agentName} error:`, e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
