import { auth, requireUID } from "./firebase";

export class NotSignedInError extends Error {
  constructor() {
    super("Please sign in to continue.");
  }
}

async function getIdToken(forceRefresh = false): Promise<string> {
  const uid = await requireUID().catch(() => null);
  if (!uid || !auth.currentUser) throw new NotSignedInError();
  return auth.currentUser.getIdToken(forceRefresh);
}

function buildHeaders(init: RequestInit, token: string): Headers {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

export async function authedFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: buildHeaders(init, await getIdToken()),
  });

  // Firebase caches the ID token and refreshes it on a background timer that
  // browsers throttle in hidden tabs. The cached token can therefore expire
  // while the UI still shows a signed-in user, and the server rejects it.
  // Retry once with a forced refresh.
  if (res.status === 401) {
    try {
      return await fetch(url, {
        ...init,
        headers: buildHeaders(init, await getIdToken(true)),
      });
    } catch (e) {
      if (e instanceof NotSignedInError) return res;
      throw e;
    }
  }

  return res;
}

export async function parseApiResponse<T>(res: Response): Promise<T> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    throw new Error(
      res.ok ? "Unexpected empty response from server" : `Request failed (${res.status})`,
    );
  }
  if (!res.ok) {
    const bodyShape = body as { error?: string; message?: string };
    const message =
      bodyShape?.message ??
      bodyShape?.error ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

export interface StreamHandlers {
  onEvent: (event: unknown) => void;
  signal?: AbortSignal;
}

/**
 * POSTs JSON and consumes a `text/event-stream` response, invoking onEvent for
 * every `data:` payload. Used by the create-project pipeline so the UI can
 * render live agent progress.
 */
export async function authedPostStream(
  url: string,
  payload: unknown,
  { onEvent, signal }: StreamHandlers,
): Promise<void> {
  const res = await authedFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
    headers: { Accept: "text/event-stream" },
  });

  if (!res.ok) {
    // Error paths before the stream opens still return plain JSON.
    return parseApiResponse<unknown>(res) as never;
  }

  if (!res.body) throw new Error("Streaming response had no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk
        .split("\n")
        .find((l) => l.startsWith("data:"));
      if (!line) continue;
      try {
        onEvent(JSON.parse(line.slice(5).trim()));
      } catch {
        // ignore malformed frames
      }
    }
  }
}

export async function authedPostJSON<T>(
  url: string,
  payload: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await authedFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
  return parseApiResponse<T>(res);
}
