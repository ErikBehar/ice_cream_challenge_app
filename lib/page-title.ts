export const DEFAULT_PAGE_TITLE = "Escondido PTA Ice Cream Challenge 2026";
export const PAGE_TITLE_MAX_LENGTH = 120;

export function parsePageTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length > PAGE_TITLE_MAX_LENGTH) return null;
  return trimmed;
}
