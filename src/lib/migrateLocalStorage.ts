import { ProjectData } from "./types";

const LS_PREFIX = "embeddy_project_";

function looksLikeProject(value: unknown): value is ProjectData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.createdAt === "string"
  );
}

export async function migrateLocalStorageToFirestore(): Promise<void> {
  if (typeof window === "undefined") return;

  const { db, auth, doc, setDoc, getDoc } = await import("./firebase");

  const user = auth.currentUser;
  if (!user || user.isAnonymous) return;

  const legacyKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(LS_PREFIX)) legacyKeys.push(k);
  }

  for (const key of legacyKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed: unknown = JSON.parse(raw);
      if (!looksLikeProject(parsed)) {
        localStorage.removeItem(key);
        continue;
      }

      const ref = doc(db, "projects", parsed.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          ...parsed,
          uid: user.uid,
          migratedAt: new Date().toISOString(),
        });
      }

      localStorage.removeItem(key);
    } catch (e) {
      console.warn("[Embeddy] Migration skipped an entry:", e);
    }
  }
}
