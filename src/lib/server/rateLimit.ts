interface LimitResult {
  allowed: boolean;
  remaining: number;
  resetSec: number;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

function memoryLimit(key: string, limit: number, windowSec: number): LimitResult {
  const now = Date.now();

  const existing = memoryStore.get(key);
  if (!existing || now > existing.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    if (memoryStore.size > 10_000) {
      const cutoff = now;
      memoryStore.forEach((v, k) => {
        if (v.resetAt < cutoff) memoryStore.delete(k);
      });
    }
    return { allowed: true, remaining: limit - 1, resetSec: windowSec };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

async function upstashLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<LimitResult> {
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
        ["TTL", key],
      ]),
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
    const results = (await res.json()) as Array<{ result: unknown }>;
    const count = Number(results[0]?.result ?? 1);
    const ttl = Number(results[2]?.result ?? windowSec);
    const resetSec = ttl > 0 ? ttl : windowSec;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetSec,
    };
  } catch {
    return memoryLimit(key, limit, windowSec);
  }
}

export function rateLimitEnabled(): boolean {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<LimitResult> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    return upstashLimit(key, limit, windowSec);
  }
  return memoryLimit(key, limit, windowSec);
}

export function rateLimitHeaders(result: LimitResult, limit: number) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(
      Math.ceil(Date.now() / 1000) + result.resetSec,
    ),
  };
}

export function clientRateKey(req: NextRequestLike, uid: string | null): string {
  if (uid) return `uid:${uid}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `ip:${ip}`;
}

interface NextRequestLike {
  headers: {
    get(name: string): string | null;
  };
}
