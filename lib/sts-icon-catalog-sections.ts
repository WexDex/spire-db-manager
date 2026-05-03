/**
 * UI-only: which icon keys render under "Database" vs "Derived / UI-only" in the catalog.
 * Keys not listed default to database unless present in derived set.
 */

export const DERIVED_UI_ONLY_ICON_KEYS = new Set<string>([
  "AOE_DAMAGE",
  "EXHAUST_SELF",
]);
