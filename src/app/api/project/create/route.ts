import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, ApiError } from "@/lib/server/auth";
import { rateLimit, rateLimitHeaders, clientRateKey } from "@/lib/server/rateLimit";
import { CreateProjectSchema } from "@/lib/schemas";
import { runCreationPipeline } from "@/lib/orchestrator";
import { PIPELINE_STAGES } from "@/lib/pipelineStages";
import { ProjectData } from "@/lib/types";

export async function POST(req: NextRequest) {
  let uid: string;
  try {
    ({ uid } = await requireAuth(req));
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 401;
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Unauthorized",
        code: e instanceof ApiError ? e.code : "unauthorized",
      },
      { status },
    );
  }

  const limit = await rateLimit(`create:${clientRateKey(req, uid)}`, 10, 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Project creation limit reached. Try again in ${Math.ceil(limit.resetSec / 60)} minutes.`,
        resetIn: limit.resetSec,
      },
      { status: 429, headers: rateLimitHeaders(limit, 10) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const { title, board, description, fileContents } = parsed.data;

  const encoder = new TextEncoder();

  try {
    const stream = new ReadableStream({
      async start(controller) {
        const send = (payload: unknown) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        };

        send({ type: "plan", stages: PIPELINE_STAGES });

        try {
          const result = await runCreationPipeline(
            { board, description, fileContents },
            (event) => {
              if (event.stage === "stage") send({ type: "stage", ...event.data });
            },
          );

          const project: ProjectData = {
            id: uuidv4(),
            title,
            board: board ?? result.overview.board,
            description,
            createdAt: new Date().toISOString(),
            overview: result.overview,
            pinDiagram: result.pinDiagram,
            schematic: result.sections.schematic,
            fatalIssues: result.sections.fatalIssues,
            compatibility: result.sections.compatibility,
            powerBudget: result.sections.powerBudget,
            bom: result.sections.bom,
            codeSkeleton: result.sections.codeSkeleton,
            errors:
              Object.keys(result.errors).length > 0 ? result.errors : undefined,
          };

          send({ type: "result", project });
        } catch (e) {
          console.error("Project creation error:", e);
          send({
            type: "error",
            error:
              e instanceof Error
                ? `Failed to analyze project: ${e.message}`
                : "Internal server error",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("Project creation error:", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? `Failed to analyze project: ${e.message}`
            : "Internal server error",
      },
      { status: 500 },
    );
  }
}
