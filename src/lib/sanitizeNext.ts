export function sanitizeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  const decoded = raw.startsWith("%2F") || raw.startsWith("%2f")
    ? decodeURIComponent(raw)
    : raw;
  if (!decoded.startsWith("/")) return "/";
  if (decoded.startsWith("//") || decoded.startsWith("/\\")) return "/";
  if (/[\r\n]/.test(decoded)) return "/";
  return decoded;
}
