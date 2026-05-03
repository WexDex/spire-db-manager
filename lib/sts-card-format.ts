/** Pure helpers for STS card rows (safe for client components). */

export function formatCostBadge(obj: Record<string, unknown>): string {
  if (obj.unplayable === true) return "—";
  if (obj.xCost === true) return "X";
  const cost = obj.cost as { base?: number; upgraded?: number } | undefined;
  if (!cost || cost.base === undefined) return "";
  if (cost.upgraded !== undefined && cost.upgraded !== cost.base)
    return `${cost.base} (${cost.upgraded})`;
  return String(cost.base);
}
