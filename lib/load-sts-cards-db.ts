import { readFile } from "fs/promises";
import type { CodexCard } from "@/lib/codex-card-types";
import { resolveStsCardsDbPath } from "@/lib/sts-canonical-db-path";
import type { StsFinalLoadResult } from "@/lib/sts-cards-db-parse-document";
import { parseStsCardsDocument } from "@/lib/sts-cards-db-parse-document";
export type { StsFinalLoadResult } from "@/lib/sts-cards-db-parse-document";

export {
  cardsRootFromStsDocument,
  entriesFromCardsRoot,
  parseStsCardsDocument,
  poolSuffixToLabel,
} from "@/lib/sts-cards-db-parse-document";

export { formatCostBadge } from "@/lib/sts-card-format";

/** UTF-8 text of the canonical `STS_CARDS_DB.json` on disk (BOM stripped). */
export async function readStsCanonicalBundleText(): Promise<string> {
  const filePath = resolveStsCardsDbPath();
  return (await readFile(filePath, "utf-8")).replace(/^\uFEFF/, "");
}

/**
 * Canonical `STS_CARDS_DB.json` from sts-planner-reworked (see `resolveStsCardsDbPath`) → codex rows.
 */
export async function loadStsCardsFromDb(): Promise<CodexCard[]> {
  const text = await readStsCanonicalBundleText();
  const parsed = JSON.parse(text) as unknown;
  return parseStsCardsDocument(parsed).entries;
}

/**
 * Same document as [`loadStsCardsFromDb`] plus icon/metadata fields (`iconCatalog`, links, lucide overrides).
 */
export async function loadStsCardsFinal(): Promise<StsFinalLoadResult> {
  const text = await readStsCanonicalBundleText();
  const parsed = JSON.parse(text) as unknown;
  return parseStsCardsDocument(parsed);
}
