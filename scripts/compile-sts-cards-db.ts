/**
 * Compiles `Slay the Spire Reference - Cards.csv` into canonical
 * `sts-planner-reworked/app/data/STS_CARDS_DB.json` (object keyed by card name).
 *
 * Run: npx tsx scripts/compile-sts-cards-db.ts
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { resolveStsCardsDbPath } from "../lib/sts-canonical-db-path";
import { enrichFromDescriptions } from "../lib/sts-description-enrichment";
import { parseStsCardsCsv } from "../lib/parse-sts-cards-csv";

/** Run from repository root (npm run compile:sts-db). */
const ROOT = process.cwd();

/** R=Ironclad, G=Silent, B=Defect, P=Watcher — used for Strike/Defend row keys. */
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

function parseCost(
  costRaw: string,
): { cost?: CostShape; xCost?: boolean; unplayable?: boolean } {
  const t = costRaw.trim();
  if (!t) return {};
  if (t.toLowerCase() === "unplayable") {
    return { unplayable: true };
  }
  if (t === "X") {
    return { xCost: true };
  }
  const pair = t.match(/^(\d+)\s*\((\d+)\)\s*$/);
  if (pair) {
    return {
      cost: { base: Number(pair[1]), upgraded: Number(pair[2]) },
    };
  }
  const single = t.match(/^(\d+)$/);
  if (single) {
    return { cost: { base: Number(single[1]) } };
  }
  return {};
}

type CostShape = { base: number; upgraded?: number };

type NumPair = { base: number; upgraded?: number };

function extractDealDamage(text: string): NumPair | undefined {
  const m = text.match(/Deal (\d+) \((\d+)\) damage/i);
  if (m) return { base: Number(m[1]), upgraded: Number(m[2]) };
  const m2 = text.match(/Deal (\d+) damage/i);
  if (m2) return { base: Number(m2[1]) };
  return undefined;
}

function extractGainBlock(text: string): NumPair | undefined {
  const m = text.match(/Gain (\d+) \((\d+)\) Block/i);
  if (m) return { base: Number(m[1]), upgraded: Number(m[2]) };
  const m2 = text.match(/Gain (\d+) Block/i);
  if (m2) return { base: Number(m2[1]) };
  return undefined;
}

/** Build one DB entry from merged row data (cardDB-like keys). */
function toDbEntry(input: {
  type: string;
  rarity: string;
  characters: string[];
  costRaw: string;
  description: string;
  descriptionUpgraded: string;
  /** Strike_* / Defend_* use `character` instead of `characters`. */
  useSingularCharacterField?: boolean;
}): Record<string, unknown> {
  const sortedChars = [...input.characters].sort((a, b) => a.localeCompare(b));
  const out: Record<string, unknown> = {
    type: input.type,
    rarity: input.rarity,
    description: templateDescription(input.description),
  };
  if (input.useSingularCharacterField && sortedChars.length === 1) {
    out.character = sortedChars[0];
  } else {
    out.characters = sortedChars.join(",");
  }

  const up = input.descriptionUpgraded.trim();
  if (up) {
    out.descriptionUpgraded = templateDescription(up);
  }

  const { cost, xCost, unplayable } = parseCost(input.costRaw);
  if (cost) {
    const c = cost as CostShape;
    if (c.upgraded !== undefined) {
      out.cost = { base: c.base, upgraded: c.upgraded };
    } else {
      out.cost = { base: c.base };
    }
  }
  if (xCost) out.xCost = true;
  if (unplayable) out.unplayable = true;

  const dmgBase = extractDealDamage(input.description.trim());
  const dmgUp = extractDealDamage(input.descriptionUpgraded.trim());
  if (dmgBase) {
    const d: Record<string, number> = { base: dmgBase.base };
    if (dmgBase.upgraded !== undefined) d.upgraded = dmgBase.upgraded;
    else if (dmgUp?.upgraded !== undefined) d.upgraded = dmgUp.upgraded;
    else if (dmgUp?.base !== undefined && dmgUp.base !== dmgBase.base) {
      d.upgraded = dmgUp.base;
    }
    out.damage = d;
  }

  const blkBase = extractGainBlock(input.description.trim());
  const blkUp = extractGainBlock(input.descriptionUpgraded.trim());
  if (blkBase) {
    const b: Record<string, number> = { base: blkBase.base };
    if (blkBase.upgraded !== undefined) b.upgraded = blkBase.upgraded;
    else if (blkUp?.upgraded !== undefined) b.upgraded = blkUp.upgraded;
    else if (blkUp?.base !== undefined && blkUp.base !== blkBase.base) {
      b.upgraded = blkUp.base;
    }
    out.block = b;
  }

  const enrichment = enrichFromDescriptions({
    description: input.description,
    descriptionUpgraded: input.descriptionUpgraded,
    costRaw: input.costRaw,
  });
  Object.assign(out, enrichment);

  const ad = out.appliesDebuffs as
    | { vulnerable?: { base: number; upgraded?: number } }
    | undefined;
  if (ad?.vulnerable) {
    out.vulnerable = ad.vulnerable;
  }

  return out;
}

/** Replace numeric damage/block patterns with cardDB-style tokens. */
function templateDescription(text: string): string {
  let s = text.trim();
  if (!s) return s;
  s = s.replace(/Deal \d+ \(\d+\) damage/gi, "Deal [DMG] damage");
  s = s.replace(/Deal \d+ damage/gi, "Deal [DMG] damage");
  s = s.replace(/Gain \d+ \(\d+\) Block/gi, "Gain [BLOCK] Block");
  s = s.replace(/Gain \d+ Block/gi, "Gain [BLOCK] Block");
  s = s.replace(
    /Apply \d+ \(\d+\) Vulnerable/gi,
    "Apply [VULN] Vulnerable",
  );
  s = s.replace(/Apply \d+ Vulnerable/gi, "Apply [VULN] Vulnerable");
  return s;
}

async function main() {
  const csvPath = path.join(
    ROOT,
    "app",
    "data",
    "Slay the Spire Reference - Cards.csv",
  );
  const text = (await readFile(csvPath, "utf-8")).replace(/^\uFEFF/, "");
  const rows = parseStsCardsCsv(text);

  /** name -> aggregate */
  const merged = new Map<
    string,
    {
      type: string;
      rarity: string;
      characters: Set<string>;
      costRaw: string;
      description: string;
      descriptionUpgraded: string;
    }
  >();

  for (const r of rows) {
    const name = r.name.trim();
    const key = dbKeyFromRow(name, r.character);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, {
        type: r.type,
        rarity: r.rarity,
        characters: new Set([r.character]),
        costRaw: r.cost,
        description: r.description,
        descriptionUpgraded: r.descriptionUpgraded,
      });
      continue;
    }

    existing.characters.add(r.character);
    const same =
      existing.type === r.type &&
      existing.rarity === r.rarity &&
      existing.costRaw === r.cost &&
      existing.description === r.description &&
      existing.descriptionUpgraded === r.descriptionUpgraded;
    if (!same) {
      console.warn(
        `[compile-sts-cards-db] Duplicate name with different data, keeping first: ${JSON.stringify(key)}`,
      );
    }
  }

  const out: Record<string, Record<string, unknown>> = {};
  const names = [...merged.keys()].sort((a, b) => a.localeCompare(b));
  for (const name of names) {
    const m = merged.get(name)!;
    const useSingularCharacterField =
      /^Strike_[RGBP]$/.test(name) || /^Defend_[RGBP]$/.test(name);
    out[name] = toDbEntry({
      type: m.type,
      rarity: m.rarity,
      characters: [...m.characters],
      costRaw: m.costRaw,
      description: m.description,
      descriptionUpgraded: m.descriptionUpgraded,
      useSingularCharacterField,
    });
  }

  const outPath = resolveStsCardsDbPath(ROOT);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${Object.keys(out).length} cards → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
