/**
 * Icons are keyed by structured card fields (e.g. `draw`), not ad-hoc dotted paths,
 * plus optional overlays such as conditioned flags under the same field.
 */

/** Extra icon anchored under `{field}.{pathSuffix}` (e.g. `conditioned`). */
export type FieldIconOverlay = {
  /** Path segments after the field root, e.g. `conditioned` or `nested.flag` */
  pathSuffix: string;
  iconKey: string;
  /** When true, only fires if the resolved value at that path is strictly `true`. */
  whenTruthy?: boolean;
  note?: string;
};

/** One top-level DB field maps to one primary icon (+ optional overlays). */
export type FieldIconGroup = {
  /** Top-level JSON key (e.g. `draw`, `discardEffect`). */
  field: string;
  /** Shown whenever that field key exists on the card. */
  primaryIconKey: string;
  /**
   * Relative paths under the field whose scalar is shown next to the primary icon —
   * first candidate that exists wins (typical pair: base, upgraded).
   */
  valueCandidates?: string[];
  /** Optional stacked icons (conditional badges, …). Applied after primary. */
  overlays?: FieldIconOverlay[];
  note?: string;
  enabled?: boolean;
};
