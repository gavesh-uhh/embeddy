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
  localStorage.removeItem(LS_PREFIX + id);
}

export async function saveProject(project: ProjectData): Promise<void> {
  lsSet(project);
  try {
    const { db, requireUID, doc, setDoc } = await import("./firebase");
    const uid = await requireUID();
    const ref = doc(db, "projects", project.id);
    await setDoc(ref, { ...project, uid, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.warn("[Embeddy] Firestore save failed:", e);
  }
}

export async function loadProject(id: string): Promise<ProjectData | null> {
  const cached = lsGet(id);
  if (cached) return cached;

  try {
    const { db, doc, getDoc } = await import("./firebase");
    const ref  = doc(db, "projects", id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as ProjectData & { uid?: string; updatedAt?: string };
      lsSet(data);
      return data;
    }
  } catch (e) {
    console.warn("[Embeddy] Firestore load failed:", e);
  }

  return null;
}

export async function listProjects(): Promise<ProjectData[]> {
  try {
    const { db, requireUID, collection, query, where, orderBy, getDocs } =
      await import("./firebase");
    const uid = await requireUID();

    const q = query(
      collection(db, "projects"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );

    const snap     = await getDocs(q);
    const projects = snap.docs.map((d) => d.data() as ProjectData);
    projects.forEach(lsSet);
    return projects;
  } catch (e) {
    console.warn("[Embeddy] Firestore list failed:", e);
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
}

export async function deleteProject(id: string): Promise<void> {
  lsDel(id);
  try {
    const { db, doc, deleteDoc } = await import("./firebase");
    const ref = doc(db, "projects", id);
    await deleteDoc(ref);
  } catch (e) {
    console.warn("[Embeddy] Firestore delete failed:", e);
  }
}
