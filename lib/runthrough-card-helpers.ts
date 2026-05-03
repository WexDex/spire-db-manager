import type { CodexCard } from "@/lib/codex-card-types";
import { charactersListFromRow } from "@/lib/sts-characters-parse";
import { formatCostBadge } from "@/lib/sts-card-format";

export function baselineMapFromEntries(entries: CodexCard[]) {
  return Object.fromEntries(
    entries.map((e) => [e.id, { ...e.raw, id: e.id } as Record<string, unknown>]),
  );
}

export function codexRowFromRaw(
  template: CodexCard,
  raw: Record<string, unknown>,
): CodexCard {
  const list = charactersListFromRow(raw);
  const primary = list[0] ?? "";

  return {
    ...template,
    raw,
    character: primary,
    charactersList: list,
    type: typeof raw.type === "string" ? raw.type : undefined,
    rarity: typeof raw.rarity === "string" ? raw.rarity : undefined,
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    descriptionUpgraded:
      typeof raw.descriptionUpgraded === "string"
        ? raw.descriptionUpgraded
        : undefined,
    costLabel: formatCostBadge(raw),
  };
}

export function costRawFromCard(raw: Record<string, unknown>): string {
  if (raw.unplayable === true) return "";
  if (raw.xCost === true) return "X";
  const cost = raw.cost as { base?: number; upgraded?: number } | undefined;
  if (cost?.base !== undefined) return String(cost.base);
  return "";
}
