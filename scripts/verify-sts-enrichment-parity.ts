/**
 * Sanity-checks that the canonical STS_CARDS_DB.json enrichment fields match
 * enrichFromDescriptions() for merged CSV rows (same merge rules as compile).
 *
 * Run: npx tsx scripts/verify-sts-enrichment-parity.ts
 *      (typically after npm run compile:sts-db)
 */

import { readFile } from "fs/promises";
import path from "path";
import { resolveStsCardsDbPath } from "../lib/sts-canonical-db-path";
import { enrichFromDescriptions } from "../lib/sts-description-enrichment";
import { parseStsCardsCsv } from "../lib/parse-sts-cards-csv";

const ROOT = process.cwd();

const ENRICH_KEYS = [
  "draw",
  "discardEffect",
  "orbInteractions",
  "multiHit",
  "selfExhaustOnPlay",
  "appliesDebuffs",
  "vulnerable",
] as const;

function pickEnrichShape(obj: Record<string, unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const k of ENRICH_KEYS) {
    if (k in obj) o[k] = obj[k];
  }
  return o;
}

function stableString(v: unknown): string {
  return JSON.stringify(v, (_k, x) =>
    typeof x === "object" &&
    x !== null &&
    x !== undefined &&
    !Array.isArray(x)
      ? Object.keys(x as object)
          .sort()
          .reduce(
            (acc: Record<string, unknown>, key) => {
              acc[key] = (x as Record<string, unknown>)[key];
              return acc;
            },
            {},
          )
      : x,
  );
}

/** Same merge as compile-sts-cards-db (name + Strike/Defend pool key). */
const CHARACTER_POOL_SUFFIX: Record<string, string> = {
  ironclad: "R",
  silent: "G",
  defect: "B",
  watcher: "P",
};

function dbKeyFromRow(name: string, character: string): string {
  const n = name.trim();
  if (n === "Strike" || n === "Defend") {
    const suf = CHARACTER_POOL_SUFFIX[character];
    if (suf) return `${n}_${suf}`;
  }
  return n;
}

async function main() {
  const csvPath = path.join(
    ROOT,
    "app",
    "data",
    "Slay the Spire Reference - Cards.csv",
  );
  const dbPath = resolveStsCardsDbPath(ROOT);

  const text = (await readFile(csvPath, "utf-8")).replace(/^\uFEFF/, "");
  const rows = parseStsCardsCsv(text);

  const merged = new Map<
    string,
    { costRaw: string; description: string; descriptionUpgraded: string }
  >();

  for (const r of rows) {
    const key = dbKeyFromRow(r.name, r.character);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, {
        costRaw: r.cost,
        description: r.description,
        descriptionUpgraded: r.descriptionUpgraded,
      });
    }
  }

  const dbRaw = (await readFile(dbPath, "utf-8")).replace(/^\uFEFF/, "");
  const db = JSON.parse(dbRaw) as Record<string, Record<string, unknown>>;

  const mismatches: string[] = [];

  for (const [key, m] of merged) {
    const ex = enrichFromDescriptions({
      description: m.description,
      descriptionUpgraded: m.descriptionUpgraded,
      costRaw: m.costRaw,
    }) as Record<string, unknown>;
    const ad = ex.appliesDebuffs as
      | { vulnerable?: { base: number; upgraded?: number } }
      | undefined;
    if (ad?.vulnerable) {
      ex.vulnerable = ad.vulnerable;
    }

    const expected = pickEnrichShape(ex);
    const actual = pickEnrichShape(db[key] ?? {});

    if (stableString(expected) !== stableString(actual)) {
      mismatches.push(
        `${key}:\n  expected ${stableString(expected)}\n  actual   ${stableString(actual)}`,
      );
    }
  }

  if (mismatches.length) {
    console.error(
      `[verify-sts-enrichment-parity] ${mismatches.length} mismatch(es):\n\n` +
        mismatches.join("\n\n"),
    );
    process.exit(1);
  }
  console.log(
    `[verify-sts-enrichment-parity] OK — ${merged.size} cards match enrichment parity.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
