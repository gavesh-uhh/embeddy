import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ApiError } from "@/lib/server/auth";
import { rateLimit, rateLimitHeaders } from "@/lib/server/rateLimit";
import { NaturalLanguageRequestSchema } from "@/lib/schemas";
import { NaturalLanguageEditAgent } from "@/lib/agents/NaturalLanguageEditAgent";
import { ProjectContext } from "@/lib/types";

const RATE_LIMIT = 10;
const WINDOW_SEC = 60;

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

  const limit = await rateLimit(`nl:${uid}`, RATE_LIMIT, WINDOW_SEC);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Too many requests. Please try again in ${limit.resetSec} seconds.`,
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

  const parsed = NaturalLanguageRequestSchema.safeParse(body);
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

  const { projectContext, userCommand, commandHistory } = parsed.data;

  try {
    const result = await NaturalLanguageEditAgent(
      projectContext as ProjectContext,
      userCommand,
      commandHistory,
    );

    const res = NextResponse.json(result);
    Object.entries(rateLimitHeaders(limit, RATE_LIMIT)).forEach(([k, v]) =>
      res.headers.set(k, v),
    );
    return res;
  } catch (e) {
    console.error("Natural language edit error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 },
    );
  }
}
