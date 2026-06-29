import { ProjectData } from "./types";

const LS_PREFIX = "embeddy_project_";

export async function migrateLocalStorageToFirestore(): Promise<void> {
  if (typeof window === "undefined") return;

  const { db, auth, doc, setDoc, getDoc, collection } = await import("./firebase");

  const user = auth.currentUser;
  if (!user || user.isAnonymous) return;

  const uid = user.uid;
  const legacyKeys: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(LS_PREFIX)) legacyKeys.push(k);
  }

  if (legacyKeys.length === 0) return;

  const colRef = collection(db, "projects");

  for (const key of legacyKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const project = JSON.parse(raw) as ProjectData;
      const ref  = doc(colRef, project.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { ...project, uid, migratedAt: new Date().toISOString() });
      }
    } catch {}
  }
}
