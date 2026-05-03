/**
 * Best-effort conversion from deprecated flat rules (path + iconKey) to field groups.
 * Used only when loading legacy merged bundles (deprecated local export).
 */

import type { FieldIconGroup, FieldIconOverlay } from "@/lib/sts-field-icon-types";

export type LegacyFieldIconRule = {
  path: string;
  iconKey: string;
  showValue?: boolean;
  whenTruthy?: boolean;
  note?: string;
  enabled?: boolean;
};

export function migrateLegacyFieldIconRules(
  rules: LegacyFieldIconRule[],
): FieldIconGroup[] {
  type Acc = {
    primaryIconKey?: string;
    valueCandidates: Set<string>;
    overlays: FieldIconOverlay[];
  };
  const byField = new Map<string, Acc>();

  for (const r of rules) {
    if (r.enabled === false) continue;
    const parts = r.path.split(".").filter(Boolean);
    if (parts.length === 0) continue;
    const field = parts[0]!;
    const rest = parts.slice(1).join(".");
    if (!byField.has(field))
      byField.set(field, {
        valueCandidates: new Set(),
        overlays: [],
      });
    const acc = byField.get(field)!;

    if (r.whenTruthy === true && rest.length) {
      acc.overlays.push({
        pathSuffix: rest,
        iconKey: r.iconKey,
        whenTruthy: true,
        note: r.note,
      });
    } else if (r.showValue === true && rest.length) {
      acc.valueCandidates.add(rest);
      if (!acc.primaryIconKey) acc.primaryIconKey = r.iconKey;
    } else if (rest.length === 0) {
      /* path was only the field segment */
      if (!acc.primaryIconKey) acc.primaryIconKey = r.iconKey;
    } else {
      if (!acc.primaryIconKey) acc.primaryIconKey = r.iconKey;
    }
  }

  const groups: FieldIconGroup[] = [];
  for (const [field, acc] of byField.entries()) {
    groups.push({
      field,
      primaryIconKey: acc.primaryIconKey ?? "DRAW_ICON",
      valueCandidates:
        acc.valueCandidates.size > 0
          ? [...acc.valueCandidates].sort((a, b) => a.localeCompare(b))
          : undefined,
      overlays: acc.overlays.length > 0 ? acc.overlays : undefined,
    });
  }

  groups.sort((a, b) => a.field.localeCompare(b.field));
  return groups;
}
