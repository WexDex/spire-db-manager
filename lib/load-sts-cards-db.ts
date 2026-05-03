import { readFile } from "fs/promises";
import type { CodexCard } from "@/lib/codex-card-types";
import { charactersListFromRow } from "@/lib/sts-characters-parse";
import { formatCostBadge } from "@/lib/sts-card-format";
import type { AttributeIconLink } from "@/lib/sts-attribute-icon-link-types";
import type { FieldIconGroup } from "@/lib/sts-field-icon-types";
import { migrateLegacyFieldIconRules } from "@/lib/sts-field-icon-migrate";
import type { LegacyFieldIconRule } from "@/lib/sts-field-icon-migrate";
import { resolveStsCardsDbPath } from "@/lib/sts-canonical-db-path";

export type StsFinalLoadResult = {
  entries: CodexCard[];
  /** Keys from bundle _meta.galleryFieldGuide (design / overlay field docs). */
  galleryFieldKeys: string[];
  iconCatalog: Record<string, string>;
  attributeIconLinks: AttributeIconLink[];
  /**
   * iconCatalog key → Lucide export name (`lucideByIconKey` in the canonical bundle).
   * Use [`stsLucideOverridesFromLucideByIconKey`](lib/sts-icon-glyph.ts) → `StsLucideOverride`
   * for [`resolveStsIconDisplay`](lib/sts-icon-glyph.ts).
   */
  lucideByIconKey: Record<string, string>;
};

const RESERVED_STS_DOC_KEYS = new Set([
  "_meta",
  "iconCatalog",
  "attributeIconLinks",
  "fieldIconGroups",
  "fieldIconRules",
  "lucideByIconKey",
  "cards",
]);

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

/** Card map: `doc.cards` when present, else top-level minus bundle metadata keys. */
function cardsRootFromStsDocument(doc: Record<string, unknown>): Record<
  string,
  Record<string, unknown>
> {
  const nested = doc.cards;
  if (isRecord(nested)) return nested as Record<string, Record<string, unknown>>;

  const out: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (RESERVED_STS_DOC_KEYS.has(k)) continue;
    if (isRecord(v)) out[k] = v;
  }
  return out;
}

type StsBundleDoc = {
  _meta?: { galleryFieldGuide?: Record<string, unknown> };
  iconCatalog?: Record<string, string>;
  lucideByIconKey?: Record<string, string>;
  attributeIconLinks?: AttributeIconLink[];
  fieldIconGroups?: FieldIconGroup[];
  fieldIconRules?: LegacyFieldIconRule[];
  cards?: Record<string, Record<string, unknown>>;
};

async function readStsCanonicalBundle(): Promise<{
  doc: StsBundleDoc;
  cardsRoot: Record<string, Record<string, unknown>>;
}> {
  const filePath = resolveStsCardsDbPath();
  const text = (await readFile(filePath, "utf-8")).replace(/^\uFEFF/, "");
  const parsed = JSON.parse(text) as unknown;
  if (!isRecord(parsed)) {
    throw new Error(`STS card DB root must be an object (${filePath})`);
  }
  const doc = parsed as StsBundleDoc;
  return { doc, cardsRoot: cardsRootFromStsDocument(parsed) };
}

export function poolSuffixToLabel(s: string): string {
  const m: Record<string, string> = { R: "Ironclad", G: "Silent", B: "Defect", P: "Watcher" };
  return m[s] ?? s;
}

function poolStrikeDefendDisplayName(cardKey: string): string | null {
  const m = /^(.+)_(R|G|B|P)$/.exec(cardKey);
  if (
    !m ||
    (m[1] !== "Strike" && m[1] !== "Defend")
  )
    return null;
  return `${m[1]} (${poolSuffixToLabel(m[2])})`;
}

function characterPoolForRow(obj: Record<string, unknown>): {
  primary: string;
  list: string[];
} {
  const chars = charactersListFromRow(obj);
  return {
    primary: chars[0] ?? "",
    list: [...chars],
  };
}

function entriesFromCardsRoot(
  cardsRoot: Record<string, Record<string, unknown>>,
): CodexCard[] {
  return Object.entries(cardsRoot)
    .map(([cardKey, obj]) => {
      const sd = poolStrikeDefendDisplayName(cardKey);
      const name = sd ?? cardKey;
      const { primary, list } = characterPoolForRow(obj);

      const row: CodexCard = {
        id: cardKey,
        name,
        displayKey: cardKey,
        character: primary,
        charactersList: list,
        raw: obj,
        type: typeof obj.type === "string" ? obj.type : undefined,
        rarity: typeof obj.rarity === "string" ? obj.rarity : undefined,
        description:
          typeof obj.description === "string" ? obj.description : undefined,
        descriptionUpgraded:
          typeof obj.descriptionUpgraded === "string"
            ? obj.descriptionUpgraded
            : undefined,
        costLabel: formatCostBadge(obj),
      };
      return row;
    })
    .sort((a, b) => a.displayKey.localeCompare(b.displayKey));
}

/**
 * Canonical `STS_CARDS_DB.json` from sts-planner-reworked (see `resolveStsCardsDbPath`) → codex rows.
 */
export async function loadStsCardsFromDb(): Promise<CodexCard[]> {
  const { cardsRoot } = await readStsCanonicalBundle();
  return entriesFromCardsRoot(cardsRoot);
}

/**
 * Same document as [`loadStsCardsFromDb`] plus icon/metadata fields (`iconCatalog`, links, lucide overrides).
 */
export async function loadStsCardsFinal(): Promise<StsFinalLoadResult> {
  const { doc, cardsRoot } = await readStsCanonicalBundle();

  const guide = doc._meta?.galleryFieldGuide;
  const galleryFieldKeys =
    guide !== null && typeof guide === "object"
      ? Object.keys(guide as Record<string, unknown>)
      : [];
  const iconCatalog =
    doc.iconCatalog !== null && typeof doc.iconCatalog === "object"
      ? (doc.iconCatalog as Record<string, string>)
      : {};

  const lucideByIconKey: Record<string, string> = {};
  if (
    doc.lucideByIconKey !== null &&
    typeof doc.lucideByIconKey === "object" &&
    !Array.isArray(doc.lucideByIconKey)
  ) {
    for (const [k, v] of Object.entries(
      doc.lucideByIconKey as Record<string, unknown>,
    )) {
      if (typeof v === "string") lucideByIconKey[k] = v;
    }
  }

  const linksRaw = doc.attributeIconLinks;
  const groupsRaw = doc.fieldIconGroups;
  const legacyRaw = doc.fieldIconRules;

  let attributeIconLinks: AttributeIconLink[] = Array.isArray(linksRaw)
    ? linksRaw.filter(
        (L): L is AttributeIconLink =>
          L !== null &&
          typeof L === "object" &&
          typeof (L as AttributeIconLink).attribute === "string" &&
          typeof (L as AttributeIconLink).iconKey === "string",
      )
    : [];

  if (attributeIconLinks.length === 0) {
    let fieldIconGroups: FieldIconGroup[] = Array.isArray(groupsRaw)
      ? groupsRaw.filter(
          (g): g is FieldIconGroup =>
            g !== null &&
            typeof g === "object" &&
            typeof (g as FieldIconGroup).field === "string" &&
            typeof (g as FieldIconGroup).primaryIconKey === "string",
        )
      : [];

    if (
      fieldIconGroups.length === 0 &&
      Array.isArray(legacyRaw) &&
      legacyRaw.length > 0
    ) {
      const legacyParsed = legacyRaw.filter(
        (r): r is LegacyFieldIconRule =>
          r !== null &&
          typeof r === "object" &&
          typeof (r as LegacyFieldIconRule).path === "string" &&
          typeof (r as LegacyFieldIconRule).iconKey === "string",
      );
      fieldIconGroups = migrateLegacyFieldIconRules(legacyParsed);
    }

    attributeIconLinks = fieldIconGroups
      .filter((g) => g.enabled !== false)
      .map((g) => ({
        attribute: g.field,
        iconKey: g.primaryIconKey,
        valueFrom:
          g.valueCandidates && g.valueCandidates.length > 0
            ? g.valueCandidates
            : ["base", "upgraded"],
        note: g.note,
      }));
  }

  return {
    entries: entriesFromCardsRoot(cardsRoot),
    galleryFieldKeys,
    iconCatalog,
    attributeIconLinks,
    lucideByIconKey,
  };
}

export { formatCostBadge };
