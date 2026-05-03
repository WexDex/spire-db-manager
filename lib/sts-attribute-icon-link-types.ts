/**
 * User-editable: map a card JSON attribute (dotted path) → catalog icon key.
 */

export type AttributeIconLink = {
  /** Dotted path from card root e.g. draw, damage, discardEffect */
  attribute: string;
  iconKey: string;
  /** Show first numeric/string leaf under object (typical: base, upgraded) */
  valueFrom?: string[];
  enabled?: boolean;
  note?: string;
};
