/**
 * STS catalog glyphs + semantic effect labels for the glyph atlas page.
 */

import type { AttributeIconLink } from "@/lib/sts-attribute-icon-link-types";
import { DERIVED_UI_ONLY_ICON_KEYS } from "@/lib/sts-icon-catalog-sections";
import {
  FALLBACK_ICON_CATALOG,
  STS_ICON_GLYPH,
  stsIconFallbackLabel,
} from "@/lib/sts-icon-glyph";
import { BUILTIN_ICON_TRIGGERS } from "@/lib/sts-icon-special-triggers";
import {
  DEFAULT_EFFECT_ICONS,
  EFFECT_TYPE_ORDER,
} from "@/lib/sts-effect-type-icons";
import { pathsForEffectPreview } from "@/lib/sts-effect-to-card-paths";

export type GlyphAttachmentKind =
  | "attribute"
  | "builtin"
  | "orb"
  | "stat_lane"
  | "note";

export type GlyphAttachment = {
  kind: GlyphAttachmentKind;
  text: string;
};

export type StsAtlasRow = {
  kind: "sts";
  iconKey: string;
  shortLabel: string;
  shapeId: string;
  iconClass: string;
  description: string;
  sectionBadge: "database" | "derived_ui";
};

export type PlannerOnlyAtlasRow = {
  kind: "planner_only";
  iconKey: string;
  shortLabel: string;
  lucideExportName: string;
  iconClass: string;
  description: string;
};

export type EffectAtlasRow = {
  kind: "effect";
  effectKey: string;
  lucideName: string;
  paths: readonly string[];
};

const ORB_ICON_KEYS = new Set<string>([
  "LIGHTNING_ORB",
  "FROST_ORB",
  "DARK_ORB",
  "PLASMA_ORB",
  "ANY_ORB",
  "SAME_ORB_AS_EVOKED",
]);

const STAT_LANE_NOTE: Partial<Record<string, string>> = {
  DMG_ICON: 'Numeric / stat row for damage (paired with `"damage"` on cards).',
  BLOCK_ICON: 'Numeric / stat row for block (paired with `"block"`).',
  ENERGY_ICON: 'Energy / `[G]` style stats (paired with `"cost"` or gain-energy verbs).',
  HEAL_ICON: 'Heal stat row (`"heal"`).',
  POISON_ICON: 'Poison debuff stacks (`appliesDebuffs.poison`).',
  VULNERABLE_ICON: 'Vulnerable stacks (`appliesDebuffs.vulnerable`).',
  WEAK_ICON: 'Weak stacks (`appliesDebuffs.weak`).',
  TARGET_SINGLE: "Gallery / single-target affordance beside damage lane.",
};

const ORB_ATTACHMENT: GlyphAttachment = {
  kind: "orb",
  text:
    "`orbInteractions[]` verbs (channel / evoke / next / repeat): each row uses `orbIcon` for this STS key.",
};

export const PLANNER_ONLY_GLYPHS: Omit<PlannerOnlyAtlasRow, "kind">[] = [
  {
    iconKey: "SCRY_ICON",
    shortLabel: "Scry",
    lucideExportName: "ScanSearch",
    iconClass: "text-fuchsia-300",
    description:
      "Gallery scry verb — used in sts-planner `galleryStsGlyphs`; not in spire-db-manager `STS_ICON_GLYPH`.",
  },
  {
    iconKey: "LOSE_STRENGTH",
    shortLabel: "Lose Strength",
    lucideExportName: "TrendingDown",
    iconClass: "text-orange-300",
    description: "Planner gallery — strength loss motifs.",
  },
  {
    iconKey: "KEY_INNATE",
    shortLabel: "Innate",
    lucideExportName: "Star",
    iconClass: "text-amber-200",
    description:
      "Maps from card.keywords / innate — planner gallery overlay only.",
  },
  {
    iconKey: "KEY_ETHEREAL",
    shortLabel: "Ethereal",
    lucideExportName: "Ghost",
    iconClass: "text-slate-400",
    description: "Keyword strip — planner gallery overlay only.",
  },
  {
    iconKey: "KEY_RETAIN",
    shortLabel: "Retain",
    lucideExportName: "Bookmark",
    iconClass: "text-lime-200",
    description: "Keyword strip — planner gallery overlay only.",
  },
  {
    iconKey: "KEY_UNPLAYABLE",
    shortLabel: "Unplayable",
    lucideExportName: "Ban",
    iconClass: "text-slate-500",
    description: "Keyword strip — planner gallery overlay only.",
  },
  {
    iconKey: "COST_MANIP",
    shortLabel: "Cost",
    lucideExportName: "Coins",
    iconClass: "text-amber-300",
    description:
      "Cost manipulation / cost-on-card UI — planner gallery derivation.",
  },
  {
    iconKey: "UPGRADE_CARD",
    shortLabel: "Upgrade",
    lucideExportName: "ChevronsUp",
    iconClass: "text-violet-300",
    description: "Cards that upgrade other cards.",
  },
  {
    iconKey: "ADD_CARD",
    shortLabel: "Add card",
    lucideExportName: "SquarePlus",
    iconClass: "text-cyan-300",
    description: "Add-a-card-from-deck motifs.",
  },
  {
    iconKey: "HP_COST",
    shortLabel: "HP cost",
    lucideExportName: "Droplets",
    iconClass: "text-rose-400",
    description: "Overlaps semantic `hpcost` effect lane in planner legend.",
  },
  {
    iconKey: "GAIN_ENERGY_ICON",
    shortLabel: "Gain energy",
    lucideExportName: "Orbit",
    iconClass: "text-yellow-300",
    description:
      'Gain-energy strip (paired with `"orbInteractions"` gain verbs in enrichment).',
  },
];

export function stsKeysSorted(): string[] {
  return (Object.keys(STS_ICON_GLYPH) as (keyof typeof STS_ICON_GLYPH)[])
    .map(String)
    .sort((a, b) => a.localeCompare(b));
}

export function reverseAttributeLinks(
  links: AttributeIconLink[],
): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const L of links) {
    if (L.enabled === false) continue;
    const attr = L.attribute.trim();
    if (!attr) continue;
    const prev = m.get(L.iconKey) ?? [];
    if (!prev.includes(attr)) prev.push(attr);
    m.set(L.iconKey, prev.sort((a, b) => a.localeCompare(b)));
  }
  return m;
}

function builtinAttachmentsByIconKey(): Map<string, GlyphAttachment[]> {
  const map = new Map<string, GlyphAttachment[]>();
  for (const t of BUILTIN_ICON_TRIGGERS) {
    const txt = `"${t.pathLabel}" — ${t.label}`;
    const list = map.get(t.iconKey) ?? [];
    list.push({ kind: "builtin", text: txt });
    map.set(t.iconKey, list);
  }
  return map;
}

export function attachmentsForStsKey(
  iconKey: string,
  attrRev: Map<string, string[]>,
  builtinRev: Map<string, GlyphAttachment[]>,
): GlyphAttachment[] {
  const out: GlyphAttachment[] = [];

  const attrs = attrRev.get(iconKey);
  if (attrs && attrs.length) {
    out.push({
      kind: "attribute",
      text: attrs.map((a) => `"${a}"`).join(", "),
    });
  }

  const builtins = builtinRev.get(iconKey);
  if (builtins?.length) out.push(...builtins);

  if (ORB_ICON_KEYS.has(iconKey)) {
    const hasOrb = out.some((a) => a.kind === "orb");
    if (!hasOrb) out.push(ORB_ATTACHMENT);
  }

  const statTxt = STAT_LANE_NOTE[iconKey];
  if (statTxt) out.push({ kind: "stat_lane", text: statTxt });

  if (iconKey === "EVOKE_ICON") {
    out.push({
      kind: "note",
      text: "`EVOKE_ICON` on orb evoke verbs inside `orbInteractions`.",
    });
  }

  if (iconKey === "CONDITIONAL_MARKER") {
    out.push({
      kind: "note",
      text:
        "Prepended when JSON `conditioned: true` is set on a numeric field (e.g. draw, damage).",
    });
  }

  if (!out.length && !DERIVED_UI_ONLY_ICON_KEYS.has(iconKey)) {
    out.push({
      kind: "note",
      text:
        "Primarily an `iconCatalog` label; may appear via enrichment or gallery without one fixed attribute link.",
    });
  }

  return out;
}

export type GlyphAtlasSerializable = {
  stsRows: StsAtlasRow[];
  stsAttachments: Record<string, GlyphAttachment[]>;
  plannerRows: PlannerOnlyAtlasRow[];
  effectRows: EffectAtlasRow[];
  /** Combined iconCatalog prose + manager fallbacks (for exports). */
  mergedIconCatalog: Record<string, string>;
  lucideByIconKey: Record<string, string>;
};

export function buildGlyphAtlasData(input: {
  iconCatalog: Record<string, string>;
  attributeIconLinks: AttributeIconLink[];
  lucideByIconKey: Record<string, string>;
}): GlyphAtlasSerializable {
  const mergedIconCatalog: Record<string, string> = {
    ...FALLBACK_ICON_CATALOG,
    ...input.iconCatalog,
  };

  const attrRev = reverseAttributeLinks(input.attributeIconLinks);
  const builtinAttachments = builtinAttachmentsByIconKey();

  const stsRows: StsAtlasRow[] = [];
  const stsAttachments: Record<string, GlyphAttachment[]> = {};

  for (const iconKey of stsKeysSorted()) {
    const bundled = STS_ICON_GLYPH[iconKey as keyof typeof STS_ICON_GLYPH];
    const prose =
      mergedIconCatalog[iconKey]?.trim()
      ?? stsIconFallbackLabel(iconKey)
      ?? "";
    stsRows.push({
      kind: "sts",
      iconKey,
      shortLabel: bundled.shortLabel,
      shapeId: bundled.shapeId,
      iconClass: bundled.iconClass,
      description: prose,
      sectionBadge: DERIVED_UI_ONLY_ICON_KEYS.has(iconKey) ?
          "derived_ui"
        : "database",
    });
    stsAttachments[iconKey] = attachmentsForStsKey(
      iconKey,
      attrRev,
      builtinAttachments,
    );
  }

  const plannerRows: PlannerOnlyAtlasRow[] = PLANNER_ONLY_GLYPHS.map((row) => ({
    kind: "planner_only" as const,
    ...row,
  }));

  const effectRows: EffectAtlasRow[] = EFFECT_TYPE_ORDER.map((effectKey) => ({
    kind: "effect" as const,
    effectKey,
    lucideName: DEFAULT_EFFECT_ICONS[effectKey],
    paths: pathsForEffectPreview(effectKey),
  }));

  return {
    stsRows,
    stsAttachments,
    plannerRows,
    effectRows,
    mergedIconCatalog,
    lucideByIconKey: { ...input.lucideByIconKey },
  };
}
