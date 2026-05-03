import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowDown,
  BadgeAlert,
  BarChart3,
  Battery,
  BookOpen,
  Circle,
  CircleDot,
  Copy,
  Crosshair,
  Dumbbell,
  Droplets,
  FileText,
  Flame,
  Ghost,
  Heart,
  HeartCrack,
  HeartPulse,
  HelpCircle,
  Layers,
  Link,
  Moon,
  Orbit,
  Shield,
  ShieldOff,
  Shuffle,
  Skull,
  Snowflake,
  Sparkles,
  Star,
  Sword,
  Swords,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

/** Curated Lucide icons available in the Field Icon Manager picker (dynamic UI). */
export const LUCIDE_SHAPES = {
  AlertCircle,
  ArrowDown,
  BarChart3,
  BadgeAlert,
  Battery,
  BookOpen,
  Circle,
  CircleDot,
  Copy,
  Crosshair,
  Dumbbell,
  Droplets,
  FileText,
  Flame,
  Ghost,
  Heart,
  HeartCrack,
  HeartPulse,
  HelpCircle,
  Layers,
  Link,
  Moon,
  Orbit,
  Shield,
  ShieldOff,
  Shuffle,
  Skull,
  Snowflake,
  Sparkles,
  Star,
  Sword,
  Swords,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} as const satisfies Record<string, LucideIcon>;

export type LucideShapeId = keyof typeof LUCIDE_SHAPES;

export const LUCIDE_SHAPE_IDS: LucideShapeId[] = (
  Object.keys(LUCIDE_SHAPES) as LucideShapeId[]
).sort((a, b) => a.localeCompare(b));

export function getLucideShape(id: string): LucideIcon | undefined {
  return id in LUCIDE_SHAPES ?
      LUCIDE_SHAPES[id as LucideShapeId]
    : undefined;
}

/** Bundle `lucideByIconKey`: iconCatalog key → Lucide export name (e.g. `FileText`). */
export function stsLucideOverridesFromLucideByIconKey(
  lucideByIconKey: Record<string, string> | undefined,
): Record<string, StsLucideOverride> | undefined {
  if (!lucideByIconKey) return undefined;
  const out: Record<string, StsLucideOverride> = {};
  for (const [iconKey, name] of Object.entries(lucideByIconKey)) {
    const t = String(name ?? "").trim();
    if (!t) continue;
    out[iconKey] = { shapeId: t };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export type StsIconGlyphEntry = {
  Icon: LucideIcon;
  iconClass: string;
  shortLabel: string;
  /** Default Lucide shape id (picker + reset). */
  shapeId: LucideShapeId;
};

/** Per–icon-key overrides from the UI (persisted in localStorage / export snippet). */
export type StsLucideOverride = {
  /** When set, replaces bundled `STS_ICON_GLYPH[iconKey].Icon`. */
  shapeId?: LucideShapeId | string;
  /** When set (including empty string), overrides bundled `iconClass` (empty → use bundled class). */
  iconClass?: string;
};

/** Lucide glyphs for STS catalog keys (bundle `iconCatalog`) plus optional UX extensions. */
export const STS_ICON_GLYPH = {
  LIGHTNING_ORB: {
    Icon: Zap,
    shapeId: "Zap",
    iconClass: "text-amber-300",
    shortLabel: "Lightning orb",
  },
  FROST_ORB: {
    Icon: Snowflake,
    shapeId: "Snowflake",
    iconClass: "text-sky-300",
    shortLabel: "Frost orb",
  },
  DARK_ORB: {
    Icon: Moon,
    shapeId: "Moon",
    iconClass: "text-violet-300",
    shortLabel: "Dark orb",
  },
  PLASMA_ORB: {
    Icon: Sparkles,
    shapeId: "Sparkles",
    iconClass: "text-yellow-200",
    shortLabel: "Plasma orb",
  },
  DRAW_ICON: {
    Icon: FileText,
    shapeId: "FileText",
    iconClass: "text-cyan-300",
    shortLabel: "Draw",
  },
  DISCARD_ICON: {
    Icon: Trash2,
    shapeId: "Trash2",
    iconClass: "text-orange-300",
    shortLabel: "Discard",
  },
  EVOKE_ICON: {
    Icon: CircleDot,
    shapeId: "CircleDot",
    iconClass: "text-amber-200",
    shortLabel: "Evoke",
  },
  CONDITIONAL_MARKER: {
    Icon: HelpCircle,
    shapeId: "HelpCircle",
    iconClass: "text-amber-200/90",
    shortLabel: "Conditional",
  },
  ANY_ORB: {
    Icon: Layers,
    shapeId: "Layers",
    iconClass: "text-slate-300",
    shortLabel: "Any orb",
  },
  SAME_ORB_AS_EVOKED: {
    Icon: Copy,
    shapeId: "Copy",
    iconClass: "text-slate-300",
    shortLabel: "Same as evoked",
  },
  AOE_ICON: {
    Icon: Crosshair,
    shapeId: "Crosshair",
    iconClass: "text-rose-200",
    shortLabel: "AoE",
  },
  AOE_DAMAGE: {
    Icon: Swords,
    shapeId: "Swords",
    iconClass: "text-rose-300",
    shortLabel: "AoE damage",
  },
  RANDOM_ICON: {
    Icon: Shuffle,
    shapeId: "Shuffle",
    iconClass: "text-violet-300",
    shortLabel: "Random",
  },
  EXHAUST_SELF: {
    Icon: Flame,
    shapeId: "Flame",
    iconClass: "text-orange-400",
    shortLabel: "Exhaust (self)",
  },

  DMG_ICON: {
    Icon: Sword,
    shapeId: "Sword",
    iconClass: "text-rose-200",
    shortLabel: "Damage",
  },
  BLOCK_ICON: {
    Icon: Shield,
    shapeId: "Shield",
    iconClass: "text-emerald-300",
    shortLabel: "Block",
  },
  ENERGY_ICON: {
    Icon: Battery,
    shapeId: "Battery",
    iconClass: "text-amber-200",
    shortLabel: "Energy",
  },
  HEAL_ICON: {
    Icon: HeartPulse,
    shapeId: "HeartPulse",
    iconClass: "text-pink-300",
    shortLabel: "Heal",
  },
  POISON_ICON: {
    Icon: Droplets,
    shapeId: "Droplets",
    iconClass: "text-lime-300",
    shortLabel: "Poison",
  },
  VULNERABLE_ICON: {
    Icon: BadgeAlert,
    shapeId: "BadgeAlert",
    iconClass: "text-amber-200",
    shortLabel: "Vulnerable",
  },
  WEAK_ICON: {
    Icon: TrendingDown,
    shapeId: "TrendingDown",
    iconClass: "text-blue-300/90",
    shortLabel: "Weak",
  },
  TARGET_SINGLE: {
    Icon: Target,
    shapeId: "Target",
    iconClass: "text-rose-200/95",
    shortLabel: "Single target",
  },
  DRAW_ICON_ALT: {
    Icon: BookOpen,
    shapeId: "BookOpen",
    iconClass: "text-cyan-200",
    shortLabel: "Draw (deck)",
  },
} satisfies Record<string, StsIconGlyphEntry>;

/** Long labels aligned with canonical `STS_CARDS_DB.json` → `iconCatalog` (fallback when bundle omits prose). */
export const FALLBACK_ICON_CATALOG: Record<string, string> = {
  LIGHTNING_ORB: "Lightning orb (channel / evoke visuals)",
  FROST_ORB: "Frost orb",
  DARK_ORB: "Dark orb",
  PLASMA_ORB: "Plasma orb",
  DRAW_ICON: "Draw from draw pile",
  DISCARD_ICON: "Discard to discard pile",
  EVOKE_ICON: "Evoke orb",
  CONDITIONAL_MARKER: "Effect is conditional (paired with draw, energy, etc.)",
  ANY_ORB: "Generic orb placeholder when color not fixed",
  SAME_ORB_AS_EVOKED: "Echo orb type from prior evoke",
  AOE_ICON: "Hits all enemies (paired with damage icon)",
  RANDOM_ICON: "Random choice (e.g. discard target)",
  AOE_DAMAGE: "AoE damage",
  EXHAUST_SELF: "Exhaust (self)",

  DMG_ICON: "Single-target damage lane",
  BLOCK_ICON: "Block / armor",
  ENERGY_ICON: "Energy-style resource indicator",
  HEAL_ICON: "Recovery / heal",
  POISON_ICON: "Poison stacks",
  VULNERABLE_ICON: "Vulnerable debuff",
  WEAK_ICON: "Weak debuff",
  TARGET_SINGLE: "Single-enemy targeting",
  DRAW_ICON_ALT: "Alternate draw / deck motif",
};

export type KnownStsIconGlyphKey = keyof typeof STS_ICON_GLYPH;

export type StsIconDisplay = {
  Icon: LucideIcon;
  iconClass: string;
  shortLabel: string;
  shapeId: LucideShapeId | string;
  usesShapeOverride: boolean;
  usesClassOverride: boolean;
};

export function stsIconFallbackLabel(iconKey: string): string | undefined {
  return FALLBACK_ICON_CATALOG[iconKey];
}

/** Glyph when the key maps to STS_ICON_GLYPH; undefined if unknown — prefer runtime `iconCatalog` label. */
export function getStsIconGlyph(iconKey: string): StsIconGlyphEntry | undefined {
  if (!(iconKey in STS_ICON_GLYPH)) return undefined;
  return STS_ICON_GLYPH[iconKey as KnownStsIconGlyphKey];
}

/**
 * Resolved Lucide component + classes for an icon key, including optional UI overrides.
 */
export function resolveStsIconDisplay(
  iconKey: string,
  overrides:
    | Record<string, StsLucideOverride | undefined>
    | undefined,
): StsIconDisplay {
  const bundled = getStsIconGlyph(iconKey);
  const ov = overrides?.[iconKey];

  if (!bundled) {
    const sid = ov?.shapeId?.trim();
    let Icon: LucideIcon = LUCIDE_SHAPES.Layers;
    let shapeId: LucideShapeId | string = "Layers";
    if (sid && getLucideShape(sid)) {
      Icon = getLucideShape(sid)!;
      shapeId = sid;
    }
    let iconClass = "text-zinc-400";
    if (ov && "iconClass" in ov && ov.iconClass !== undefined) {
      const t = ov.iconClass.trim();
      iconClass = t === "" ? "text-zinc-400" : t;
    }
    return {
      Icon,
      iconClass,
      shortLabel: iconKey,
      shapeId,
      usesShapeOverride: !!(sid && getLucideShape(sid)),
      usesClassOverride:
        !!(ov && "iconClass" in ov && ov.iconClass !== undefined && ov.iconClass.trim() !== ""),
    };
  }

  let Icon: LucideIcon = bundled.Icon;
  let shapeId: LucideShapeId | string = bundled.shapeId;

  const sid = ov?.shapeId?.trim();
  if (sid && getLucideShape(sid)) {
    Icon = getLucideShape(sid)!;
    shapeId = sid;
  }

  let iconClass = bundled.iconClass;
  if (ov && "iconClass" in ov && ov.iconClass !== undefined) {
    const t = ov.iconClass.trim();
    iconClass = t === "" ? bundled.iconClass : t;
  }

  const usesShapeOverride = !!(sid && sid !== bundled.shapeId);
  const usesClassOverride =
    !!(
      ov &&
      "iconClass" in ov &&
      ov.iconClass !== undefined &&
      ov.iconClass.trim() !== "" &&
      ov.iconClass.trim() !== bundled.iconClass
    );

  return {
    Icon,
    iconClass,
    shortLabel: bundled.shortLabel,
    shapeId,
    usesShapeOverride,
    usesClassOverride,
  };
}
