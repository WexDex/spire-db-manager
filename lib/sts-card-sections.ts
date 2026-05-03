/**
 * Detail panel sections for STS_CARDS_DB.json card objects (merged with name/id).
 */

const SECTION_KEYS: { title: string; keys: string[] }[] = [
  {
    title: "Identity",
    keys: ["name", "id", "characters", "character"],
  },
  {
    title: "Classification",
    keys: ["type", "rarity", "cost", "xCost", "unplayable"],
  },
  {
    title: "Text",
    keys: ["description", "descriptionUpgraded"],
  },
  {
    title: "Combat numbers",
    keys: ["damage", "block", "vulnerable"],
  },
  {
    title: "Draw & discard",
    keys: ["draw", "discardEffect"],
  },
  {
    title: "Orbs & evokes",
    keys: ["orbInteractions"],
  },
  {
    title: "Multi-hit",
    keys: ["multiHit"],
  },
  {
    title: "Status & exhaustion",
    keys: ["selfExhaustOnPlay", "appliesDebuffs"],
  },
];

export function groupCardKeys(
  card: Record<string, unknown>,
): { title: string; entries: [string, unknown][] }[] {
  const keysOnCard = Object.keys(card);
  const used = new Set<string>();
  const sections: { title: string; entries: [string, unknown][] }[] = [];

  for (const { title, keys: groupKeys } of SECTION_KEYS) {
    const entries: [string, unknown][] = [];
    for (const k of groupKeys) {
      if (Object.prototype.hasOwnProperty.call(card, k)) {
        entries.push([k, card[k]]);
        used.add(k);
      }
    }
    if (entries.length > 0) sections.push({ title, entries });
  }

  const other: [string, unknown][] = [];
  for (const k of keysOnCard.sort((a, b) => a.localeCompare(b))) {
    if (!used.has(k)) other.push([k, card[k]]);
  }
  if (other.length > 0)
    sections.push({ title: "Other", entries: other });

  return sections;
}
