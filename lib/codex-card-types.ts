/**
 * Codex runtime row derived from STS_CARDS_DB.json (+ display helpers).
 */

export type CodexCard = {
  /** JSON object key — e.g. Bash, Strike_R */
  id: string;
  /** Display title — Strike (Ironclad) for Strike_R */
  name: string;
  displayKey: string;
  /** First pool slug for tinting / badge */
  character: string;
  /** All pools — used for Character filter membership */
  charactersList: string[];
  /** Raw DB entry — merged into detail panel */
  raw: Record<string, unknown>;
  type?: string;
  rarity?: string;
  description?: string;
  descriptionUpgraded?: string;
  /** Preformatted cost badge */
  costLabel: string;
};
