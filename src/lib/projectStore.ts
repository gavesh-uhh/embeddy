import { ProjectData } from "./types";

const PREFIX = "embeddy_project_";

export function saveProject(project: ProjectData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + project.id, JSON.stringify(project));
}

export function loadProject(id: string): ProjectData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PREFIX + id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProjectData;
  } catch {
    return null;
  }
}

export function listProjects(): ProjectData[] {
  if (typeof window === "undefined") return [];
  const projects: ProjectData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) projects.push(JSON.parse(raw) as ProjectData);
      } catch {
        // skip malformed entries
      }
    }
  }
  return projects.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function deleteProject(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + id);
}
