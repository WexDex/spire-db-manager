import type { AttributeIconLink } from "@/lib/sts-attribute-icon-link-types";
import { getAtPath, hasPath, isPlainObject } from "@/lib/sts-field-paths";

export type ResolvedFieldIcon = {
  path: string;
  iconKey: string;
  label: string;
  valueDisplay?: string;
};

function partsFromDots(s: string): string[] {
  return s.split(".").filter(Boolean);
}

function scalarDisplay(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") {
    if (v.length > 32) return `${v.slice(0, 29)}…`;
    return v;
  }
  return undefined;
}

/**
 * User-defined attribute → icon links (from attributeIconLinks in bundle).
 */
export function resolveAttributeIconLinksForCard(
  raw: Record<string, unknown>,
  links: AttributeIconLink[],
  iconCatalog: Record<string, string>,
): ResolvedFieldIcon[] {
  const out: ResolvedFieldIcon[] = [];
  const labelFor = (k: string) => iconCatalog[k]?.trim() || k;
  const fallbackCandidates = ["base", "upgraded"];

  for (const L of links) {
    if (L.enabled === false) continue;
    const anchor = partsFromDots(L.attribute.trim());
    if (anchor.length === 0) continue;
    if (!hasPath(raw, anchor)) continue;

    const valueAt = getAtPath(raw, anchor);
    let valueDisplay: string | undefined;
    let pathUsed = L.attribute.trim();

    const candidates =
      L.valueFrom && L.valueFrom.length > 0
        ? L.valueFrom
        : fallbackCandidates;

    if (isPlainObject(valueAt)) {
      for (const rel of candidates) {
        const sub = [...anchor, ...rel.split(".").filter(Boolean)];
        if (!hasPath(raw, sub)) continue;
        const v = getAtPath(raw, sub);
        const sd = scalarDisplay(v);
        if (sd !== undefined) {
          valueDisplay = sd;
          pathUsed = sub.join(".");
          break;
        }
      }
    } else {
      valueDisplay = scalarDisplay(valueAt);
    }

    out.push({
      path: pathUsed,
      iconKey: L.iconKey,
      label: labelFor(L.iconKey),
      valueDisplay,
    });
  }

  return out;
}
