/**
 * Extra STS_DB fields inferred from RAW description lines (CSV before [DMG] templating).
 * Icons are not stored here — UI can map draw/discard/orb verbs to glyphs later.
 */

type Pair = { base: number; upgraded?: number };

function pairApply(
  base: string,
  up: string,
  re: RegExp,
): Pair | undefined {
  const mb = base.match(re);
  if (!mb) return undefined;
  const b = Number(mb[1]);
  const bub = mb[2] !== undefined ? Number(mb[2]) : b;
  const mu = up && up !== base ? up.match(re) : null;
  let second = bub;
  if (mu?.[2] !== undefined)
    second = Number(mu[2]);

  else if (
    mu?.[1] !== undefined &&
    mb[2] !== undefined &&
    mu[2] !== undefined
  )
    second = Number(mu[2]);

  return { base: b, upgraded: second !== b ? second : bub };
}

function orbKw(w: string): string {
  const n = w.toLowerCase();
  if (n.includes("lightning")) return "LIGHTNING_ORB";
  if (n.includes("frost")) return "FROST_ORB";
  if (n.includes("dark")) return "DARK_ORB";
  if (n.includes("plasma")) return "PLASMA_ORB";
  return "ANY_ORB";
}

type WhenDrawRow = {
  trigger: string;
  amount: { base: number; upgraded?: number };
};

function collectWheneverDraws(
  base: string,
  upgraded: string,
): WhenDrawRow[] {
  const wRegex =
    /\bWhenever ([^,]+),?\s*[Dd]raw (\d+)(?: \(\d+\))? cards?\b/gi;
  const map = new Map<string, { base: number; up?: number }>();

  const run = (text: string, isUpgradedPass: boolean) => {
    let m: RegExpExecArray | null;
    wRegex.lastIndex = 0;
    while ((m = wRegex.exec(text)) !== null) {
      const trigger = m[1].trim();
      const n = Number(m[2]);
      const cur = map.get(trigger);
      if (!cur) {
        map.set(trigger, { base: n });
      } else if (isUpgradedPass) {
        cur.up = n;
      }
    }
  };

  run(base, false);
  if (upgraded !== base) run(upgraded, true);

  const rows: WhenDrawRow[] = [];
  for (const [trigger, { base: b, up }] of map) {
    rows.push({
      trigger,
      amount: {
        base: b,
        ...(up !== undefined && up !== b ? { upgraded: up } : {}),
      },
    });
  }
  return rows;
}

/** "If …, draw N card(s)." in a single sentence (e.g. FTL). */
function parseIfConditionalDraw(
  base: string,
  upgraded: string,
): { base: number; upgraded?: number; trigger: string } | null {
  const segments = base.split(/\.\s+/).map((s) => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const dm = seg.match(/\bdraw (\d+) cards?\b/i);
    if (!dm || !/\bif\b/i.test(seg)) continue;
    const tm = seg.match(/\bif\s+(.+?),/i);
    const trigger = tm
      ? tm[1].trim()
      : seg
          .replace(/\s*,\s*draw.*/i, "")
          .replace(/^\s*if\s+/i, "")
          .trim();
    const b = Number(dm[1]);
    let up = b;
    if (upgraded !== base) {
      const usegs = upgraded.split(/\.\s+/).map((s) => s.trim()).filter(Boolean);
      for (const useg of usegs) {
        const dm2 = useg.match(/\bdraw (\d+) cards?\b/i);
        if (dm2 && /\bif\b/i.test(useg)) {
          up = Number(dm2[1]);
          break;
        }
      }
    }
    return {
      base: b,
      ...(up !== b ? { upgraded: up } : {}),
      trigger,
    };
  }
  return null;
}

/** Main export */
export function enrichFromDescriptions(opts: {
  description: string;
  descriptionUpgraded: string;
  costRaw: string;
}): Record<string, unknown> {
  const base = opts.description.trim();
  const upgraded = opts.descriptionUpgraded.trim();
  const ex: Record<string, unknown> = {};
  const hasXCost = opts.costRaw.trim().toUpperCase() === "X";

  const skipStandaloneDrawTokens = /\bwhenever\b/i.test(base);

  const whenDraws = collectWheneverDraws(base, upgraded);
  if (whenDraws.length > 0) {
    const row = whenDraws[0];
    const trig = /^whenever\b/i.test(row.trigger)
      ? row.trigger
      : `Whenever ${row.trigger}`;
    ex.draw = {
      base: row.amount.base,
      ...(row.amount.upgraded !== undefined
        ? { upgraded: row.amount.upgraded }
        : {}),
      conditioned: true,
      trigger: trig,
    };
  } else {
    const ifDraw = parseIfConditionalDraw(base, upgraded);
    if (ifDraw) {
      ex.draw = {
        base: ifDraw.base,
        ...(ifDraw.upgraded !== undefined
          ? { upgraded: ifDraw.upgraded }
          : {}),
        conditioned: true,
        trigger: ifDraw.trigger,
      };
    } else {
      const drawPair =
        skipStandaloneDrawTokens
          ? undefined
          : pairApply(
              base,
              upgraded,
              /\bDraw (\d+) \((\d+)\) cards?\b/i,
            );
      const drawOne =
        skipStandaloneDrawTokens
          ? null
          : base.match(/\bDraw (\d+) cards?\b\.?/i);
      const drawOneUp =
        !skipStandaloneDrawTokens && upgraded !== base
          ? upgraded.match(/\bDraw (\d+) cards?\b\.?/i)
          : null;
      if (drawPair) {
        const up = drawPair.upgraded ?? drawPair.base;
        ex.draw =
          up !== drawPair.base
            ? { base: drawPair.base, upgraded: up }
            : { base: drawPair.base };
      } else if (drawOne) {
        const b = Number(drawOne[1]);
        const upN = drawOneUp ? Number(drawOneUp[1]) : b;
        ex.draw =
          upN !== b ? { base: b, upgraded: upN } : { base: b };
      }
    }
  }

  if (
    /discard \d+/i.test(base)
    &&
    !/shuffle\s+your\s+discard\s+pile/i.test(base.slice(0, Math.min(base.length, 80)))
    &&
    /\bshuffle\s+/i.exec(base)?.index !== 0
  ) {
    const rnd = /\bDiscard (\d+) \((\d+)\) cards? at random\b/i.exec(base);
    if (rnd) {
      const pair = pairApply(
        base,
        upgraded,
        /\bDiscard (\d+) \((\d+)\) cards? at random\b/i,
      );
      const p = pair ?? {
        base: Number(rnd[1]),
        upgraded: Number(rnd[2]),
      };
      const up = p.upgraded ?? p.base;
      ex.discardEffect = {
        base: p.base,
        ...(up !== p.base ? { upgraded: up } : {}),
        random: true,
        fromHand: true,
      };
    } else {
      const dn = /\bDiscard (\d+) \((\d+)\)/i.exec(base);
      const dnPlain = /\bDiscard (\d+) cards?\b/i.exec(base);
      if (dn) {
        const p =
          pairApply(base, upgraded, /\bDiscard (\d+) \((\d+)\)/) ?? {
            base: Number(dn[1]),
            upgraded: Number(dn[2]),
          };
        const up2 = p.upgraded ?? p.base;
        ex.discardEffect = {
          base: p.base,
          ...(up2 !== p.base ? { upgraded: up2 } : {}),
          random: /\brandom\b/i.test(
            base.slice(base.indexOf("Discard")),
          ),
          fromHand: true,
        };
      } else if (dnPlain?.[1]) {
        const b = Number(dnPlain[1]);
        let up = b;
        if (upgraded !== base) {
          const mu = upgraded.match(/\bDiscard (\d+) cards?\b/i);
          if (mu) up = Number(mu[1]);
        }
        ex.discardEffect = {
          base: b,
          ...(up !== b ? { upgraded: up } : {}),
          random: false,
          fromHand: true,
        };
      }
    }
  }

  const actions: Record<string, unknown>[] = [];

  /** e.g. Channel 2 (3) Lightning — base/upgraded orb amounts (Electrodynamics, Static Discharge). */
  const tierChannelRe =
    /\bChannel (\d+) \((\d+)\) (Lightning|Frost|Dark|Plasma)(?: Orb)?\b/gi;
  let tm: RegExpExecArray | null;
  tierChannelRe.lastIndex = 0;
  while ((tm = tierChannelRe.exec(base)) !== null) {
    const oz = orbKw(tm[3]);
    const b = Number(tm[1]);
    const u = Number(tm[2]);
    actions.push({
      verb: "channel",
      orbIcon: oz,
      presentation: `${oz} ${b} (${u})`,
      amount: { base: b, upgraded: u },
    });
  }

  /** Every plain "Channel N Type" segment (Rainbow: three separate channels). */
  const plainChannelRe =
    /\bChannel (\d+) (Lightning|Frost|Dark|Plasma)(?: Orb)?\b/gi;
  let pm: RegExpExecArray | null;
  plainChannelRe.lastIndex = 0;
  while ((pm = plainChannelRe.exec(base)) !== null) {
    const oz = orbKw(pm[2]);
    const n = Number(pm[1]);
    actions.push({
      verb: "channel",
      orbIcon: oz,
      presentation: `${oz} ${n}`,
      amount: { base: n },
    });
  }

  if (/Evoke your next Orb twice/i.test(base))
    actions.push({
      verb: "evokeNextRepeated",
      orbIcon: "ANY_ORB",
      presentation: "Evoke next Orb — ×2",
      times: { base: 2 },
    });

  else if (/Evoke your next Orb X/i.test(base))
    actions.push({
      verb: "evokeNextRepeated",
      timesEnergyScaling: true,
      energyScalingLabel: "X",
      presentation:
        /\bEvoke[^\n]+\+?(\d+)/i.exec(upgraded)?.[1] !== undefined
          ? `Evoke next Orb X (+${/\bEvoke[^\n]+X\+\s*(\d+)/i.exec(upgraded)?.[1] ?? "?"} upgraded)`
          : "Evoke next Orb X times",
    });
  else if (/Evoke your next Orb\b/i.test(base)) {
    actions.push({
      verb: "evokeNext",
      presentation: "Evoke next Orb",
    });
    if (/Channel the Orb that was just Evoked/i.test(base))
      actions.push({
        verb: "channelReturned",
        orbIcon: "SAME_ORB_AS_EVOKED",
        presentation: "Channel orb evoked previously",
      });
  }

  if (actions.length) ex.orbInteractions = actions;

  const mh2 = /\bDeal (\d+) damage (\d+) \((\d+)\) times\b/i.exec(base);
  if (mh2)
    ex.multiHit = {
      damageUsesMainField: true,
      multiHitCount: {
        base: Number(mh2[2]),
        upgraded: Number(mh2[3]),
        energyScalingColumn: false,
      },
    };

  else if (hasXCost && /[Xx] times/i.test(base))
    ex.multiHit = {
      damageUsesMainField: true,
      multiHitEnergyScaling: true,
      formulaPresentation: {
        template: "[DMG] × X hits",
        energySymbol: "X",
      },
    };

  if (
    /\b[Ee]xhaust\.?\s*$/im.test(base.trim())
    &&
    !/exhaust it\b|exhaust them\b|exhaust \d+ card\b|exhaust up to\b/i.test(base)
  )
    ex.selfExhaustOnPlay = { base: true, upgraded: true };

  const deb: Record<string, Pair> = {};
  const v = /\bApply (\d+) \((\d+)\) Vulnerable\b/i.exec(base);
  const vu = /\bApply (\d+) \((\d+)\) Vulnerable\b/i.exec(upgraded);
  if (v)
    deb.vulnerable = {
      base: Number(v[1]),
      upgraded: vu?.[2] !== undefined ? Number(vu[2]) : Number(v[2]),
    };

  const w = /\bApply (\d+) \((\d+)\) Weak\b/i.exec(base);
  const wu = /\bApply (\d+) \((\d+)\) Weak\b/i.exec(upgraded);
  if (w)
    deb.weak = {
      base: Number(w[1]),
      upgraded: wu?.[2] !== undefined ? Number(wu[2]) : Number(w[2]),
    };

  const p = /\bApply (\d+) \((\d+)\) Poison\b/i.exec(base);
  const pu = /\bApply (\d+) \((\d+)\) Poison\b/i.exec(upgraded);
  if (p)
    deb.poison = {
      base: Number(p[1]),
      upgraded: pu?.[2] !== undefined ? Number(pu[2]) : Number(p[2]),
    };

  if (Object.keys(deb).length) ex.appliesDebuffs = deb;

  return ex;
}
