import { NextRequest } from "next/server";
import {
  jwtVerify,
  createLocalJWKSet,
  decodeProtectedHeader,
} from "jose";
import type { JWTPayload, JWK } from "jose";
import { X509Certificate } from "node:crypto";

// Google's canonical JWKS endpoint for Firebase ID tokens. It currently answers
// 404, so it is treated as a best-effort primary and the x509 endpoint below is
// the working fallback.
const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwks/securetoken@system.gserviceaccount.com";
const FIREBASE_X509_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

const KEY_TTL_MS = 60 * 60 * 1000; // revalidate hourly
const FETCH_TIMEOUT_MS = 5000;

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = "unauthorized") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface AuthContext {
  uid: string;
}

function getProjectId(): string {
  const projectId = process.env.NEXT_PUBLIC_FB_PROJECT_ID;
  if (!projectId)
    throw new ApiError(
      500,
      "Server misconfigured: NEXT_PUBLIC_FB_PROJECT_ID is not set",
      "server_misconfigured",
    );
  return projectId;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

// Converts the x509 endpoint's { kid: PEM } map into a JWKS jose can use.
async function fetchKeysFromX509(): Promise<JWK[]> {
  const res = await fetchWithTimeout(FIREBASE_X509_URL);
  if (!res.ok)
    throw new ApiError(
      503,
      "Could not verify your session right now. Please try again.",
      "jwks_unavailable",
    );

  const certs = (await res.json()) as Record<string, string>;
  const keys: JWK[] = [];
  for (const [kid, pem] of Object.entries(certs)) {
    try {
      const cert = new X509Certificate(pem);
      const jwk = cert.publicKey.export({ format: "jwk" }) as JWK;
      keys.push({ ...jwk, kid, use: "sig", alg: "RS256" });
    } catch (e) {
      console.error(`[auth] skipping unparseable cert kid=${kid}:`, e);
    }
  }
  if (keys.length === 0)
    throw new ApiError(
      503,
      "Could not verify your session right now. Please try again.",
      "jwks_unavailable",
    );
  return keys;
}

async function fetchKeys(): Promise<JWK[]> {
  try {
    const res = await fetchWithTimeout(FIREBASE_JWKS_URL);
    if (res.ok) {
      const body = (await res.json()) as { keys?: JWK[] };
      if (Array.isArray(body?.keys) && body.keys.length > 0) {
        console.error(`[auth] signing keys loaded from JWKS endpoint`);
        return body.keys;
      }
    }
    console.error(
      `[auth] JWKS endpoint unusable (status ${res.status}); falling back to x509`,
    );
  } catch (e) {
    console.error("[auth] JWKS endpoint unreachable; falling back to x509:", e);
  }
  return fetchKeysFromX509();
}

let keyCache: { keys: JWK[]; at: number } | null = null;
let inflight: Promise<JWK[]> | null = null;

// Deduplicates concurrent fetches; `force` bypasses a still-fresh cache so an
// unknown kid (Google key rotation) can be resolved immediately.
function getKeys(force = false): Promise<JWK[]> {
  const cached = keyCache;
  const age = cached ? Date.now() - cached.at : Infinity;

  if (cached && age < KEY_TTL_MS && !force) {
    // Revalidate in the background so a rotation is picked up without making
    // the next user request wait on the network.
    if (age > KEY_TTL_MS / 2 && !inflight) {
      const bg = fetchKeys()
        .then((keys) => {
          keyCache = { keys, at: Date.now() };
          return keys;
        })
        .catch((e) => {
          console.error("[auth] background key refresh failed:", e);
          throw e;
        })
        .finally(() => {
          inflight = null;
        });
      inflight = bg;
      bg.catch(() => {}); // never an unhandled rejection
    }
    return Promise.resolve(cached.keys);
  }

  if (!inflight) {
    inflight = fetchKeys()
      .then((keys) => {
        keyCache = { keys, at: Date.now() };
        return keys;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

// Fetch-level problems only. A key we obtained but that does not match the
// token is the caller's problem (401), not ours (503).
function isInfrastructureFailure(e: unknown): boolean {
  if (e instanceof ApiError) return true;
  if (e instanceof TypeError) return true; // fetch/AbortError rejected
  const code = (e as { code?: string })?.code;
  return code === "ERR_JWKS_TIMEOUT";
}

function describe(e: unknown): string {
  const code = (e as { code?: string })?.code ?? e?.constructor?.name ?? "Error";
  return `${code}: ${e instanceof Error ? e.message : String(e)}`;
}

// Unverified, log-only view of the token. `kid` lives in the JOSE header;
// iss/aud/exp live in the payload.
function peekClaims(token: string): Record<string, unknown> {
  const seg = token.split(".");
  const out: Record<string, unknown> = {};
  try {
    const header = JSON.parse(Buffer.from(seg[0], "base64url").toString("utf8"));
    out.kid = header.kid;
  } catch {
    /* ignore */
  }
  try {
    const payload = JSON.parse(Buffer.from(seg[1], "base64url").toString("utf8"));
    out.iss = payload.iss;
    out.aud = payload.aud;
    out.exp = payload.exp;
  } catch {
    /* ignore */
  }
  return out;
}

export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or malformed Authorization header", "missing_token");
  }
  const token = header.slice(7).trim();
  if (!token || token.length > 4096) {
    throw new ApiError(401, "Invalid auth token", "malformed_token");
  }

  const projectId = getProjectId();

  try {
    let kid: string | undefined;
    try {
      kid = decodeProtectedHeader(token).kid;
    } catch {
      /* not a JWS; jwtVerify will report it */
    }

    let keys = await getKeys();
    // Google rotates signing keys; an unknown kid means our cache is behind.
    if (kid && !keys.some((k) => k.kid === kid)) {
      console.error(`[auth] unknown kid=${kid}; refreshing signing keys`);
      keys = await getKeys(true);
    }

    const { payload } = await jwtVerify(token, createLocalJWKSet({ keys }), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"], // Firebase ID tokens are always RS256
    });
    const uid = (payload as JWTPayload & { sub?: string }).sub;
    if (!uid) throw new Error("token has no subject");
    return { uid };
  } catch (e) {
    const claims = peekClaims(token);
    console.error(
      `[auth] token rejected projectId=${projectId} cause="${describe(e)}" ` +
        `unverifiedToken={kid:${claims.kid},iss:${claims.iss},aud:${claims.aud},exp:${claims.exp}}`,
    );

    if (isInfrastructureFailure(e)) {
      throw new ApiError(
        503,
        "Could not verify your session right now. Please try again.",
        "jwks_unavailable",
      );
    }

    const code = (e as { code?: string })?.code ?? "invalid_token";
    throw new ApiError(401, "Invalid or expired auth token", code);
  }
}