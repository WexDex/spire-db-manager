import { existsSync } from "fs";
import path from "path";

export const STS_CARDS_DB_FILENAME = "STS_CARDS_DB.json";

/**
 * Path to the authoritative DB relative to spire-db-manager when both repos live as
 * siblings under the same parent (e.g. `NextJS/sts-planner-reworked/...`).
 */
export const CANONICAL_STS_CARDS_DB_REL_TO_SPIRE =
  "../sts-planner-reworked/app/data/STS_CARDS_DB.json" as const;

/**
 * Absolute path to `STS_CARDS_DB.json`.
 *
 * Resolution order:
 * 1. `STS_CARDS_DB_PATH` env (absolute or cwd-relative file path)
 * 2. Sibling checkout `sts-planner-reworked/app/data/STS_CARDS_DB.json`
 * 3. Legacy local `app/data/STS_CARDS_DB.json` (standalone clone)
 */
export function resolveStsCardsDbPath(cwd: string = process.cwd()): string {
  const fromEnv = process.env.STS_CARDS_DB_PATH?.trim();
  if (fromEnv) return path.resolve(cwd, fromEnv);

  const sibling = path.resolve(
    cwd,
    "..",
    "sts-planner-reworked",
    "app",
    "data",
    STS_CARDS_DB_FILENAME,
  );
  if (existsSync(sibling)) return sibling;

  return path.join(cwd, "app", "data", STS_CARDS_DB_FILENAME);
}
