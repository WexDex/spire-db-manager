import { STS_ICON_GLYPH } from "@/lib/sts-icon-glyph";
import {
  DEFAULT_EFFECT_ICONS,
  formatEffectIconsAsTypeScript,
} from "@/lib/sts-effect-type-icons";
import type { GlyphAtlasSerializable } from "@/lib/glyph-registry";
import { stsKeysSorted } from "@/lib/glyph-registry";

export function formatIconCatalogJson(catalog: Record<string, string>): string {
  const keys = Object.keys(catalog).sort((a, b) => a.localeCompare(b));
  const ordered: Record<string, string> = {};
  for (const k of keys) ordered[k] = catalog[k] ?? "";
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export function formatLucideByIconKeyJson(map: Record<string, string>): string {
  const keys = Object.keys(map).sort((a, b) => a.localeCompare(b));
  const ordered: Record<string, string> = {};
  for (const k of keys) ordered[k] = map[k] ?? "";
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export type StsVisualEntry = {
  shapeId: string;
  iconClass: string;
  shortLabel: string;
};

export function stsVisualDefaultsRecord(): Record<string, StsVisualEntry> {
  const out: Record<string, StsVisualEntry> = {};
  for (const iconKey of stsKeysSorted()) {
    const b = STS_ICON_GLYPH[iconKey as keyof typeof STS_ICON_GLYPH];
    out[iconKey] = {
      shapeId: String(b.shapeId),
      iconClass: b.iconClass,
      shortLabel: b.shortLabel,
    };
  }
  return out;
}

export function formatStsVisualDefaultsJson(): string {
  return `${JSON.stringify(stsVisualDefaultsRecord(), null, 2)}\n`;
}

/** Full atlas export blob for tooling / manual merge into sts-planner-reworked. */
export function formatPlannerMergeBundle(payload: GlyphAtlasSerializable): string {
  return `${JSON.stringify(
    {
      _meta: {
        kind: "sts-planner-glyphs-export",
        description:
          "Merge iconCatalog into STS_CARDS_DB.json; use stsVisualDefaults for gallery shape/iconClass/shortLabel; lucideByIconKey for optional overrides.",
      },
      iconCatalog: payload.mergedIconCatalog,
      lucideByIconKey: payload.lucideByIconKey,
      stsVisualDefaults: stsVisualDefaultsRecord(),
      plannerOnlyGlyphs: payload.plannerRows,
    },
    null,
    2,
  )}\n`;
}

export function formatEffectIconsTsPlanner(): string {
  return formatEffectIconsAsTypeScript({
    ...(DEFAULT_EFFECT_ICONS as Record<string, string>),
  });
}
