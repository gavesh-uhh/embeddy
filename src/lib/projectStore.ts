import { ProjectData } from "./types";

const LS_PREFIX = "embeddy_project_";

function lsSet(project: ProjectData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_PREFIX + project.id, JSON.stringify(project));
  } catch {}
}

function lsGet(id: string): ProjectData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_PREFIX + id);
    return raw ? (JSON.parse(raw) as ProjectData) : null;
  } catch { return null; }
}

function lsDel(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_PREFIX + id);
  } catch {}
}

export function lastModified(p: ProjectData): number {
  const t = (p as ProjectData & { updatedAt?: string }).updatedAt ?? p.createdAt;
  const parsed = Date.parse(t);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function isSignedIn(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { requireUID } = await import("./firebase");
    return Boolean(await requireUID());
  } catch {
    return false;
  }
}

export async function saveProject(project: ProjectData): Promise<boolean> {
  lsSet(project);
  if (!(await isSignedIn())) return false;

  try {
    const { db, requireUID, doc, setDoc } = await import("./firebase");
    const uid = await requireUID();
    const ref = doc(db, "projects", project.id);
    await setDoc(ref, {
      ...project,
      uid,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (e) {
    console.warn("[Embeddy] Firestore save failed:", e);
    return false;
  }
}

export type LoadStatus = "ok" | "not_found" | "error";
export type LoadSource = "cloud" | "cache" | "offline";

export interface LoadResult {
  status: LoadStatus;
  data?: ProjectData;
  source?: LoadSource;
  error?: string;
}

export async function loadProjectResult(id: string): Promise<LoadResult> {
  const cached = lsGet(id);

  if (!(await isSignedIn())) {
    if (cached) return { status: "ok", data: cached, source: "offline" };
    return {
      status: "error",
      error: "Please sign in to view your projects.",
    };
  }

  try {
    const { db, doc, getDoc } = await import("./firebase");
    const snap = await getDoc(doc(db, "projects", id));

    if (!snap.exists()) {
      if (cached) return { status: "ok", data: cached, source: "cache" };
      return { status: "not_found" };
    }

    const cloud = snap.data() as ProjectData & {
      uid?: string;
      updatedAt?: string;
    };

    if (cached && lastModified(cached) > lastModified(cloud)) {
      return { status: "ok", data: cached, source: "cache" };
    }

    lsSet(cloud);
    return { status: "ok", data: cloud, source: "cloud" };
  } catch (e) {
    console.warn("[Embeddy] Firestore load failed:", e);
    const message = e instanceof Error ? e.message : String(e);
    if (cached) {
      return { status: "ok", data: cached, source: "offline", error: message };
    }
    return { status: "error", error: message };
  }
}

export async function loadProject(id: string): Promise<ProjectData | null> {
  const result = await loadProjectResult(id);
  return result.status === "ok" ? result.data ?? null : null;
}

export interface ListResult {
  projects: ProjectData[];
  source: "cloud" | "local";
}

export async function listProjects(): Promise<ListResult> {
  if (await isSignedIn()) {
    try {
      const fb = await import("./firebase");
      const uid = await fb.requireUID();

      const readAll = async (ordered: boolean) => {
        const snap = ordered
          ? await fb.getDocs(
              fb.query(
                fb.collection(fb.db, "projects"),
                fb.where("uid", "==", uid),
                fb.orderBy("createdAt", "desc"),
              ),
            )
          : await fb.getDocs(
              fb.query(fb.collection(fb.db, "projects"), fb.where("uid", "==", uid)),
            );
        return snap.docs.map((d) => d.data() as ProjectData);
      };

      let projects: ProjectData[];
      try {
        projects = await readAll(true);
      } catch (orderedErr) {
        // A missing composite index makes the ordered query fail outright.
        // Retry unordered and sort client-side rather than silently falling
        // back to localStorage-only data.
        console.warn(
          "[Embeddy] Ordered Firestore query failed, retrying unsorted:",
          orderedErr,
        );
        projects = (await readAll(false)).sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
        );
      }

      projects.forEach(lsSet);
      return { projects, source: "cloud" };
    } catch (e) {
      console.warn("[Embeddy] Firestore list failed:", e);
    }
  }

  return { projects: readLocalProjects(), source: "local" };
}

function readLocalProjects(): ProjectData[] {
  if (typeof window === "undefined") return [];
  const projects: ProjectData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) projects.push(JSON.parse(raw) as ProjectData);
      } catch {}
    }
  }
  return projects.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function deleteProject(id: string): Promise<boolean> {
  let cloudDeleted = true;

  if (await isSignedIn()) {
    try {
      const { db, doc, deleteDoc } = await import("./firebase");
      await deleteDoc(doc(db, "projects", id));
    } catch (e) {
      console.warn("[Embeddy] Firestore delete failed:", e);
      cloudDeleted = false;
    }
  }

  lsDel(id);
  return cloudDeleted;
}
