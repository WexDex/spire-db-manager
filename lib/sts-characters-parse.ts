/**
 * Normalize `character` / `characters` on a card row to a list of pool slugs.
 * `characters` may be a comma-separated string (current) or a string[] (legacy).
 */

export function charactersListFromRow(obj: Record<string, unknown>): string[] {
  if (typeof obj.character === "string" && obj.character.trim()) {
    return [obj.character.trim().toLowerCase()];
  }
  const ch = obj.characters;
  if (typeof ch === "string" && ch.trim()) {
    return ch
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  if (Array.isArray(ch)) {
    return (ch as unknown[])
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((s) => s.trim().toLowerCase());
  }
  return [];
}
