/**
 * Semantic effect keys → Lucide React export names (e.g. `ArrowDown`).
 * Used as the default for /field-icons and for generated TypeScript exports.
 */

export const EFFECT_TYPE_ORDER = [
  "weak",
  "vulnerable",
  "frail",
  "damage",
  "block",
  "wound",
  "strength",
  "strength_buff",
  "entangle",
  "takedamage",
  "energygain",
  "draw",
  "intangible",
  "hp",
  "maxHp",
  "health",
  "attack",
  "energy",
  "heal",
  "focus",
  "poison",
  "hpcost",
] as const;

export type EffectType = (typeof EFFECT_TYPE_ORDER)[number];

/** Lucide PascalCase export names; matches picker / `lib/sts-icon-glyph.ts` `LUCIDE_SHAPES`. */
export const DEFAULT_EFFECT_ICONS: Record<EffectType, string> = {
  weak: "ArrowDown",
  vulnerable: "AlertCircle",
  frail: "ShieldOff",
  damage: "Zap",
  block: "Shield",
  wound: "HeartCrack",
  strength: "Dumbbell",
  strength_buff: "TrendingUp",
  entangle: "Link",
  takedamage: "HeartCrack",
  energygain: "Orbit",
  draw: "FileText",
  intangible: "Ghost",
  hp: "Heart",
  maxHp: "BarChart3",
  health: "Heart",
  attack: "BarChart3",
  energy: "Zap",
  heal: "Heart",
  focus: "Sparkles",
  poison: "Skull",
  hpcost: "Droplets",
};

export function orderedEffectKeys(map: Record<string, string>): string[] {
  const known = new Set<string>(EFFECT_TYPE_ORDER);
  const fromPreset = EFFECT_TYPE_ORDER.filter((k) => k in map);
  const extra = Object.keys(map)
    .filter((k) => !known.has(k))
    .sort((a, b) => a.localeCompare(b));
  return [...fromPreset, ...extra];
}

const IDENT = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function effectKeyLiteral(k: string): string {
  return IDENT.test(k) ? k : JSON.stringify(k);
}

/** TypeScript module: `Record<EffectType, LucideIcon>` + imports. */
export function formatEffectIconsAsTypeScript(
  map: Record<string, string>,
): string {
  const keys = orderedEffectKeys(map);
  const iconNames = [
    ...new Set(
      keys
        .map((k) => map[k]?.trim())
        .filter((v): v is string => Boolean(v && v.length > 0)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const importBlock =
    `import type { LucideIcon } from "lucide-react";\n` +
    `import {\n  ${iconNames.join(",\n  ")},\n} from "lucide-react";\n\n`;

  const typeBody = keys
    .map((k) => `  | ${JSON.stringify(k)}`)
    .join("\n");
  const typeBlock = `export type EffectType =\n${typeBody};\n\n`;

  const entries = keys
    .map((k) => {
      const icon = map[k]?.trim() ?? "";
      return `  ${effectKeyLiteral(k)}: ${icon},`;
    })
    .join("\n");

  const recordBlock =
    `export const ICONS: Record<EffectType, LucideIcon> = {\n` +
    `${entries}\n};\n`;

  return importBlock + typeBlock + recordBlock;
}
