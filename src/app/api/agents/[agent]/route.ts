import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ApiError } from "@/lib/server/auth";
import { rateLimit, rateLimitHeaders, clientRateKey } from "@/lib/server/rateLimit";
import { AgentRequestSchema } from "@/lib/schemas";
import { isSectionKey, runSection, SECTION_KEYS } from "@/lib/orchestrator";

const RATE_LIMIT = 30;
const WINDOW_SEC = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: { agent: string } },
) {
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

  if (!isSectionKey(params.agent)) {
    return NextResponse.json(
      { error: `Unknown agent: ${params.agent}. Valid agents: ${SECTION_KEYS.join(", ")}` },
      { status: 400 },
    );
  }

  const limit = await rateLimit(
    `agent:${clientRateKey(req, uid)}`,
    RATE_LIMIT,
    WINDOW_SEC,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        resetIn: limit.resetSec,
      },
      { status: 429, headers: rateLimitHeaders(limit, RATE_LIMIT) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AgentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid projectContext",
        details: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await runSection(params.agent, parsed.data.projectContext);
    return NextResponse.json(result);
  } catch (e) {
    console.error(`Agent ${params.agent} error:`, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Agent failed" },
      { status: 500 },
    );
  }
}
