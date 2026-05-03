/** Persisted STS_CARDS_DB bundle text (same format as sts-planner-reworked JSON). */

export const STS_CARDS_DB_LOCAL_STORAGE_KEY =
  "spire-sts-cards-db-bundle-v1";

export function loadStoredStsCardsDbText(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STS_CARDS_DB_LOCAL_STORAGE_KEY);
    const t = raw?.trim();
    return t ? raw! : null;
  } catch {
    return null;
  }
}

export function saveStoredStsCardsDbText(text: string): void {
  localStorage.setItem(STS_CARDS_DB_LOCAL_STORAGE_KEY, text);
}

export function clearStoredStsCardsDbText(): void {
  try {
    localStorage.removeItem(STS_CARDS_DB_LOCAL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
