/** One row from Slay the Spire Reference — Cards.csv */

export type StsCard = {
  id: string;
  name: string;
  /** Section slug: ironclad, silent, … */
  character: string;
  type: string;
  rarity: string;
  /** May include parentheses, X, Unplayable, etc. */
  cost: string;
  description: string;
  /** Empty if same as upgraded or not provided separately */
  descriptionUpgraded: string;
};
