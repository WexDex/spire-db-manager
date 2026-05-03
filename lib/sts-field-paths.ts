/** Dotted paths (e.g. discardEffect.random) for nested field editing. */

export function isPlainObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

export function getAtPath(obj: unknown, parts: string[]): unknown {
  let v: unknown = obj;
  for (const p of parts) {
    if (!isPlainObject(v)) return undefined;
    v = v[p];
  }
  return v;
}

export function hasPath(obj: unknown, parts: string[]): boolean {
  return getAtPath(obj, parts) !== undefined;
}

/** DFS plain objects only; arrays are leaves (path stops at array key). */
export function collectDottedPathsFromCard(obj: Record<string, unknown>): string[] {
  const list: string[] = [];
  function walk(o: unknown, prefix: string) {
    if (!isPlainObject(o)) return;
    for (const [k, v] of Object.entries(o)) {
      if (k === "id") continue;
      const p = prefix ? `${prefix}.${k}` : k;
      list.push(p);
      if (isPlainObject(v) && !Array.isArray(v)) walk(v, p);
    }
  }
  walk(obj, "");
  return list;
}

/**
 * Typical nested paths (pair fields, discardEffect, etc.) so the UI lists
 * sub-keys even when the current dataset omits some combinations.
 */
export const COMMON_FIELD_PATH_HINTS: readonly string[] = [
  "discardEffect.base",
  "discardEffect.upgraded",
  "discardEffect.random",
  "discardEffect.fromHand",
  "draw.base",
  "draw.upgraded",
  "draw.conditioned",
  "draw.trigger",
  "cost.base",
  "cost.upgraded",
  "damage.base",
  "damage.upgraded",
  "block.base",
  "block.upgraded",
  "appliesDebuffs.vulnerable.base",
  "appliesDebuffs.vulnerable.upgraded",
  "appliesDebuffs.weak.base",
  "appliesDebuffs.weak.upgraded",
  "appliesDebuffs.poison.base",
  "appliesDebuffs.poison.upgraded",
];

export function globalPathCatalog(
  cardData: Record<string, Record<string, unknown>>,
  ids: string[],
  galleryFieldKeys: string[],
): string[] {
  const s = new Set<string>(galleryFieldKeys);
  for (const h of COMMON_FIELD_PATH_HINTS) s.add(h);
  for (const id of ids) {
    const row = cardData[id];
    if (row) for (const p of collectDottedPathsFromCard(row)) s.add(p);
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

/** Catalog paths plus any keys already present on the card at parentPath. */
export function childKeysMerged(
  parentPath: string,
  catalog: string[],
  raw: Record<string, unknown>,
): string[] {
  const fromCat = directChildKeysFromCatalog(catalog, parentPath);
  const fromData: string[] = [];
  if (parentPath === "") {
    for (const k of Object.keys(raw)) {
      if (k === "id") continue;
      fromData.push(k);
    }
  } else {
    const parentVal = getAtPath(raw, parentPath.split(".").filter(Boolean));
    if (isPlainObject(parentVal)) {
      for (const k of Object.keys(parentVal)) fromData.push(k);
    }
  }
  return [...new Set([...fromCat, ...fromData])].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Direct child key names under parentPath ("" = root segments without a dot). */
export function directChildKeysFromCatalog(
  catalog: Iterable<string>,
  parentPath: string,
): string[] {
  const seen = new Set<string>();
  if (parentPath === "") {
    for (const p of catalog) {
      const i = p.indexOf(".");
      seen.add(i === -1 ? p : p.slice(0, i));
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  }
  const prefix = `${parentPath}.`;
  for (const p of catalog) {
    if (!p.startsWith(prefix)) continue;
    const rest = p.slice(prefix.length);
    if (!rest) continue;
    const dot = rest.indexOf(".");
    seen.add(dot === -1 ? rest : rest.slice(0, dot));
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

function leafDefaultFromSamples(
  pathStr: string,
  cardData: Record<string, Record<string, unknown>>,
  baselineOrder: string[],
): unknown {
  const parts = pathStr.split(".");
  for (const id of baselineOrder) {
    const row = cardData[id];
    if (!row) continue;
    const v = getAtPath(row, parts);
    if (v !== undefined) {
      try {
        return JSON.parse(JSON.stringify(v)) as unknown;
      } catch {
        return v;
      }
    }
  }
  const leaf = parts[parts.length - 1] ?? "";
  if (
    /^(is|has|use)[A-Z]/i.test(leaf) ||
    /(OnPlay|UsesIcon|Target|Hand|playable)$/i.test(leaf) ||
    /^(random|conditional|conditioned|innate|ethereal)/i.test(leaf)
  )
    return false;
  return {};
}

/** Immutable: ensure path exists with sampled or heuristic leaf default. */
export function setPathPresent(
  raw: Record<string, unknown>,
  parts: string[],
  present: boolean,
  cardData: Record<string, Record<string, unknown>>,
  baselineOrder: string[],
): Record<string, unknown> {
  if (parts.length === 0) return raw;
  const pathStr = parts.join(".");

  if (!present) {
    const removed = deletePathImmutable(raw, parts);
    return { ...removed, id: raw.id };
  }

  if (hasPath(raw, parts)) {
    return { ...raw, id: raw.id };
  }

  const next = { ...raw };
  let cur: Record<string, unknown> = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const child = cur[k];
    if (!isPlainObject(child)) {
      cur[k] = {};
    } else {
      cur[k] = { ...child };
    }
    cur = cur[k] as Record<string, unknown>;
  }
  const leaf = parts[parts.length - 1];
  cur[leaf] = leafDefaultFromSamples(pathStr, cardData, baselineOrder);
  return { ...next, id: raw.id };
}

function deepCloneJson<T>(x: T): T {
  try {
    return JSON.parse(JSON.stringify(x)) as T;
  } catch {
    return x;
  }
}

/** Set or replace the value at a dotted path (creates parent objects). */
export function setLeafValue(
  raw: Record<string, unknown>,
  parts: string[],
  value: unknown,
): Record<string, unknown> {
  if (parts.length === 0) return { ...raw, id: raw.id };
  const next = { ...raw };
  let cur: Record<string, unknown> = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const child = cur[k];
    if (!isPlainObject(child)) cur[k] = {};
    else cur[k] = { ...child };
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  return { ...next, id: raw.id };
}

/** Rename the last segment of a path (e.g. draw.base → draw.min). */
export function renameLeafAtPath(
  raw: Record<string, unknown>,
  parts: string[],
  newLeafName: string,
): Record<string, unknown> {
  const name = newLeafName.trim().replace(/\./g, "");
  if (!name || parts.length === 0) return { ...raw, id: raw.id };
  const old = parts[parts.length - 1];
  if (old === "id") return { ...raw, id: raw.id };
  const v = getAtPath(raw, parts);
  if (v === undefined) return { ...raw, id: raw.id };
  const parentParts = parts.slice(0, -1);
  let parentObj: Record<string, unknown> = raw;
  for (const p of parentParts) {
    const c = parentObj[p];
    if (!isPlainObject(c)) return { ...raw, id: raw.id };
    parentObj = c as Record<string, unknown>;
  }
  if (name in parentObj && name !== old) return { ...raw, id: raw.id };
  const next = deletePathImmutable(raw, parts);
  const newParts = [...parentParts, name];
  return setLeafValue(next, newParts, deepCloneJson(v));
}

function deletePathImmutable(
  obj: Record<string, unknown>,
  parts: string[],
): Record<string, unknown> {
  if (parts.length === 0) return obj;
  const [head, ...rest] = parts;
  if (rest.length === 0) {
    const { [head]: omitChild, ...keep } = obj;
    void omitChild;
    return keep as Record<string, unknown>;
  }
  const child = obj[head];
  if (!isPlainObject(child)) return obj;
  const newChild = deletePathImmutable(child, rest);
  if (Object.keys(newChild).length === 0) {
    const { [head]: omitNested, ...keep } = obj;
    void omitNested;
    return keep as Record<string, unknown>;
  }
  return { ...obj, [head]: newChild };
}
