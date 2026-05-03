import { getAtPath, hasPath, isPlainObject } from "@/lib/sts-field-paths";
import type { ResolvedFieldIcon } from "@/lib/sts-field-icon-resolve";

/**
 * Fixed pairings (conditioned, random discard, rough AoE) — not stored in JSON.
 * Shown read-only in the UI; applied after user links in the resolver.
 */
export type BuiltinTriggerDef = {
  id: string;
  /** Human label for settings panel */
  label: string;
  iconKey: string;
  /** When this returns true for a card row, emit the icon (no value unless provided) */
  matches: (raw: Record<string, unknown>) => boolean;
  /** Dotted path label for preview chips */
  pathLabel: string;
  valueFrom?: (raw: Record<string, unknown>) => string | undefined;
};

function firstScalarFrom(
  raw: Record<string, unknown>,
  root: string,
  candidates: string[],
): string | undefined {
  if (!hasPath(raw, [root])) return undefined;
  const fieldVal = getAtPath(raw, [root]);
  if (!isPlainObject(fieldVal)) return undefined;
  for (const c of candidates) {
    const parts = [root, ...c.split(".").filter(Boolean)];
    if (!hasPath(raw, parts)) continue;
    const v = getAtPath(raw, parts);
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string") return v.length > 12 ? `${v.slice(0, 10)}…` : v;
  }
  return undefined;
}

export const BUILTIN_ICON_TRIGGERS: BuiltinTriggerDef[] = [
  {
    id: "draw-conditioned",
    label: "Conditional draw",
    iconKey: "CONDITIONAL_MARKER",
    pathLabel: "draw.conditioned",
    matches: (raw) => getAtPath(raw, ["draw", "conditioned"]) === true,
  },
  {
    id: "discard-random",
    label: "Random discard target",
    iconKey: "RANDOM_ICON",
    pathLabel: "discardEffect.random",
    matches: (raw) => {
      const d = getAtPath(raw, ["discardEffect"]);
      return isPlainObject(d) && d.random === true;
    },
  },
  {
    id: "aoe-hint",
    label: "AoE damage (heuristic)",
    iconKey: "AOE_ICON",
    pathLabel: "description · ALL enemies",
    matches: (raw) => {
      const d = raw.description;
      const u = raw.descriptionUpgraded;
      const hay = [d, u]
        .filter((x): x is string => typeof x === "string")
        .join(" ")
        .toUpperCase();
      if (!hay.includes("ALL ENEMIES")) return false;
      return hasPath(raw, ["damage"]) || hasPath(raw, ["block"]);
    },
    valueFrom: (raw) => firstScalarFrom(raw, "damage", ["base", "upgraded"]),
  },
];

export function resolveBuiltinIcons(
  raw: Record<string, unknown>,
  iconCatalog: Record<string, string>,
): ResolvedFieldIcon[] {
  const labelFor = (k: string) => iconCatalog[k]?.trim() || k;
  const out: ResolvedFieldIcon[] = [];
  for (const t of BUILTIN_ICON_TRIGGERS) {
    if (!t.matches(raw)) continue;
    const valueDisplay = t.valueFrom?.(raw);
    out.push({
      path: t.pathLabel,
      iconKey: t.iconKey,
      label: labelFor(t.iconKey),
      valueDisplay,
    });
  }
  return out;
}
