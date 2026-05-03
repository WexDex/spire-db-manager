/**
 * Map semantic effect keys (Field icons / EffectType UI) → dotted paths on card JSON.
 * Used to sort + highlight codex rows when previewing one effect mapping.
 */

import { hasPath } from "@/lib/sts-field-paths";

/** Keys are effect keys from the icon map; multiple paths → match if ANY path exists on the card. */
export const EFFECT_TO_CARD_PATHS: Record<string, readonly string[]> = {
  weak: ["appliesDebuffs.weak"],
  vulnerable: ["appliesDebuffs.vulnerable"],
  frail: ["appliesDebuffs.frail"],
  poison: ["appliesDebuffs.poison"],
  wound: ["damage"],

  strength: ["strength"],
  strength_buff: ["strength", "damage"],
  damage: ["damage"],
  block: ["block"],
  heal: ["heal"],
  draw: ["draw"],
  focus: ["focus"],
  intangible: ["intangible"],
  maxHp: ["maxHp"],
  hp: ["hp"],
  health: ["health", "heal", "hp"],

  attack: ["damage"],
  energy: ["cost", "damage"],
  energygain: ["draw", "orbInteractions"],
  takedamage: ["damage"],

  entangle: ["appliesDebuffs.entangle"],
  hpcost: ["hpcost"],
};

export function pathsForEffectPreview(effectKey: string): readonly string[] {
  const mapped = EFFECT_TO_CARD_PATHS[effectKey];
  if (mapped && mapped.length > 0) return mapped;
  return [effectKey];
}

export function cardMatchesEffectPaths(
  raw: Record<string, unknown>,
  effectKey: string,
): boolean {
  const paths = pathsForEffectPreview(effectKey);
  return paths.some((p) => hasPath(raw, p.split(".").filter(Boolean)));
}
