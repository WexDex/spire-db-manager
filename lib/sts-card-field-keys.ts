/**
 * Collect JSON field names (shallow + one nested level + array item keys) for catalogs / search.
 */

import type { CodexCard } from "@/lib/codex-card-types";

export function collectRawFieldKeys(obj: unknown, depth = 0): string[] {
  if (obj === null || obj === undefined) return [];
  if (depth > 3) return [];
  if (typeof obj !== "object") return [];
  if (Array.isArray(obj)) {
    const keys: string[] = [];
    for (const item of obj) keys.push(...collectRawFieldKeys(item, depth + 1));
    return keys;
  }
  const o = obj as Record<string, unknown>;
  const keys: string[] = [];
  for (const k of Object.keys(o)) {
    keys.push(k);
    const v = o[k];
    if (v && typeof v === "object") {
      if (Array.isArray(v)) {
        for (const item of v) keys.push(...collectRawFieldKeys(item, depth + 1));
      } else {
        keys.push(...Object.keys(v as Record<string, unknown>));
      }
    }
  }
  return keys;
}

export function uniqSortedFieldKeysFromCards(entries: CodexCard[]): string[] {
  const s = new Set<string>();
  for (const e of entries) {
    for (const k of collectRawFieldKeys(e.raw)) s.add(k);
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}
