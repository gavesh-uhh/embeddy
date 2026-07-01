import { NextRequest, NextResponse } from "next/server";
import { NaturalLanguageEditAgent } from "@/lib/agents/NaturalLanguageEditAgent";
import { ProjectContext } from "@/lib/types";



interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; 
const RATE_LIMIT_MAX_REQUESTS = 10; 

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(identifier: string): {
  allowed: boolean;
  resetIn?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(identifier);
  }

  const currentEntry = rateLimitStore.get(identifier);

  if (!currentEntry) {
    
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (currentEntry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      resetIn: Math.ceil((currentEntry.resetTime - now) / 1000),
    };
  }

  currentEntry.count++;
  return { allowed: true };
}


function getClientIdentifier(req: NextRequest): string {
  
  
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  return `${ip}:${userAgent.slice(0, 50)}`;
}

export async function POST(req: NextRequest) {
  
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Too many requests. Please try again in ${rateLimit.resetIn} seconds.`,
        resetIn: rateLimit.resetIn,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(
            Math.ceil(Date.now() / 1000) + (rateLimit.resetIn || 60),
          ),
        },
      },
    );
  }

  const body = await req.json();
  const { projectContext, userCommand, commandHistory } = body;

  if (!userCommand || typeof userCommand !== "string") {
    return NextResponse.json(
      { error: "userCommand is required and must be a string" },
      { status: 400 },
    );
  }

  
  if (userCommand.length > 500) {
    return NextResponse.json(
      { error: "Command too long. Maximum 500 characters allowed." },
      { status: 400 },
    );
  }

  
  if (userCommand.trim().length === 0) {
    return NextResponse.json(
      { error: "Command cannot be empty" },
      { status: 400 },
    );
  }

  try {
    const result = await NaturalLanguageEditAgent(
      projectContext as ProjectContext,
      userCommand,
      commandHistory || [],
    );

    
    const remainingEntry = rateLimitStore.get(clientId);
    const headers: Record<string, string> = {};
    if (remainingEntry) {
      headers["X-RateLimit-Limit"] = String(RATE_LIMIT_MAX_REQUESTS);
      headers["X-RateLimit-Remaining"] = String(
        Math.max(0, RATE_LIMIT_MAX_REQUESTS - remainingEntry.count),
      );
      headers["X-RateLimit-Reset"] = String(
        Math.ceil(remainingEntry.resetTime / 1000),
      );
    }

    return NextResponse.json(result, { headers });
  } catch (e) {
    console.error("Natural language edit error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
