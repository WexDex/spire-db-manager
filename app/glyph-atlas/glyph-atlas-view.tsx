"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Bookmark,
  Coins,
  ChevronsUp,
  Droplets,
  Ghost,
  Layers,
  Orbit,
  ScanSearch,
  SquarePlus,
  Star,
  TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GlyphAtlasSerializable } from "@/lib/glyph-registry";
import {
  stsLucideOverridesFromLucideByIconKey,
  resolveStsIconDisplay,
} from "@/lib/sts-icon-glyph";
import {
  formatEffectIconsTsPlanner,
  formatIconCatalogJson,
  formatLucideByIconKeyJson,
  formatPlannerMergeBundle,
  formatStsVisualDefaultsJson,
} from "@/lib/glyph-export";

const PLANNER_ICONS: Record<string, LucideIcon> = {
  SCRY_ICON: ScanSearch,
  LOSE_STRENGTH: TrendingDown,
  KEY_INNATE: Star,
  KEY_ETHEREAL: Ghost,
  KEY_RETAIN: Bookmark,
  KEY_UNPLAYABLE: Ban,
  COST_MANIP: Coins,
  UPGRADE_CARD: ChevronsUp,
  ADD_CARD: SquarePlus,
  HP_COST: Droplets,
  GAIN_ENERGY_ICON: Orbit,
};

type Section = "sts" | "effects" | "planner";

type Props = {
  atlas: GlyphAtlasSerializable;
};

function badgeTone(tone: "sky" | "amber" | "zinc"): string {
  const t =
    tone === "sky" ? "border-sky-800/70 bg-sky-950/50 text-sky-300"
    : tone === "amber" ? "border-amber-700/70 bg-amber-950/40 text-amber-200"
    : "border-zinc-700/80 bg-zinc-900/50 text-zinc-400";
  return `rounded-md border px-2 py-0.5 text-xs font-medium ${t}`;
}

function matchesQuery(haystack: string, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return haystack.toLowerCase().includes(t);
}

async function writeClipboard(text: string, onOk: () => void, onFail: () => void) {
  try {
    await navigator.clipboard.writeText(text);
    onOk();
  } catch {
    onFail();
  }
}

type AtlasExportRowProps = {
  label: string;
  body: string;
  fileBase: string;
  ext: string;
  hint?: string;
  onNotify: (msg: string) => void;
};

function AtlasExportRow({
  label,
  body,
  fileBase,
  ext,
  hint,
  onNotify,
}: AtlasExportRowProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/35 p-4">
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <span className="font-medium text-zinc-200">{label}</span>
        {hint ? (
          <span className="text-xs text-zinc-500">{hint}</span>
        ) : null}
      </div>
      <pre className="mb-3 max-h-40 overflow-auto rounded border border-zinc-800/80 bg-zinc-950/80 p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
        {body.slice(0, 720)}
        {body.length > 720 ? `\n… ${body.length - 720} more chars …` : ""}
      </pre>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-sky-800/70 px-3 py-1.5 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-700/90"
          onClick={() =>
            writeClipboard(
              body,
              () => onNotify(`${label}: copied`),
              () => onNotify(`Copy failed: ${label}`),
            )
          }
        >
          Copy
        </button>
        <button
          type="button"
          className="rounded-md border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
          onClick={() => {
            const blob = new Blob([body], {
              type: "text/plain;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileBase}.${ext}`;
            a.click();
            URL.revokeObjectURL(url);
            onNotify(`${fileBase}.${ext} downloaded`);
          }}
        >
          Download
        </button>
      </div>
    </div>
  );
}

export function GlyphAtlasView({ atlas }: Props) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<Section>("sts");
  const [flash, setFlash] = useState<string | null>(null);

  const overrides = useMemo(
    () => stsLucideOverridesFromLucideByIconKey(atlas.lucideByIconKey),
    [atlas.lucideByIconKey],
  );

  const showFlash = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2200);
  };

  const stsFiltered = useMemo(() => {
    return atlas.stsRows.filter((r) => {
      const needle = `${r.iconKey} ${r.shortLabel} ${r.description} ${(atlas.stsAttachments[r.iconKey] ?? []).map((a) => a.text).join(" ")}`;
      return matchesQuery(needle, query);
    });
  }, [atlas.stsAttachments, atlas.stsRows, query]);

  const effectFiltered = useMemo(() => {
    return atlas.effectRows.filter((r) =>
      matchesQuery(`${r.effectKey} ${r.lucideName} ${r.paths.join(" ")}`, query),
    );
  }, [atlas.effectRows, query]);

  const plannerFiltered = useMemo(() => {
    return atlas.plannerRows.filter((r) =>
      matchesQuery(`${r.iconKey} ${r.shortLabel} ${r.description}`, query),
    );
  }, [atlas.plannerRows, query]);

  const exportMerge = formatPlannerMergeBundle(atlas);
  const exportIconCatalog = formatIconCatalogJson(atlas.mergedIconCatalog);
  const exportLucide = formatLucideByIconKeyJson(atlas.lucideByIconKey);
  const exportVisualDefaults = formatStsVisualDefaultsJson();
  const exportEffectTs = formatEffectIconsTsPlanner();

  return (
    <>
      <div className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-5">
        <div className="mx-auto max-w-6xl space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
              Glyph atlas
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-400">
              STS icon catalog keys (bundle defaults), semantic effect glyphs
              (field-icons / planner stat strip), and planner-only glyphs
              present in <code className="text-zinc-300">sts-planner-reworked</code>{" "}
              but not bundled here. Use exports to merge prose and Lucide
              defaults into the planner repo.
            </p>
          </div>
          {flash ? (
            <p className="rounded-md bg-emerald-950/70 px-3 py-2 text-sm text-emerald-200 ring-1 ring-emerald-800/60">
              {flash}
            </p>
          ) : null}
          <label className="block max-w-xl">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Filter
            </span>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
              placeholder="Search keys, labels, paths, descriptions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
              }}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["sts", "STS catalog"],
                ["effects", "Semantic effects"],
                ["planner", "Planner-only"],
              ] as const
            ).map(([id, lab]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={
                  section === id ?
                    "rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-zinc-600"
                  : "rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                }
              >
                {lab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        {section === "sts" ? (
          <ul className="space-y-3">
            {stsFiltered.map((row) => {
              const display = resolveStsIconDisplay(row.iconKey, overrides);
              const Icon = display.Icon;
              const atts = atlas.stsAttachments[row.iconKey] ?? [];
              return (
                <li
                  key={row.iconKey}
                  className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap gap-4">
                    <div
                      className={`flex size-14 shrink-0 items-center justify-center rounded-lg border border-zinc-700/70 bg-zinc-900/70 ${display.iconClass}`}
                    >
                      <Icon aria-hidden className="size-7" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 gap-y-1">
                        <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-sm text-sky-300">
                          {row.iconKey}
                        </code>
                        <span
                          className={badgeTone(
                            row.sectionBadge === "derived_ui" ? "amber" : "sky",
                          )}
                        >
                          {row.sectionBadge === "derived_ui" ?
                            "Derived / UI hint"
                          : "Database"}
                        </span>
                        <span className={badgeTone("zinc")}>
                          Lucide:{display.shapeId}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-zinc-100">
                        {row.shortLabel}
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-500">
                        {row.description}
                      </p>
                      {atts.length > 0 ? (
                        <ul className="list-inside space-y-1 border-t border-zinc-800/80 pt-2 text-xs text-zinc-400">
                          {atts.map((a, i) => (
                            <li key={i}>
                              <span className="mr-2 font-semibold text-zinc-500">
                                {a.kind}:
                              </span>
                              {a.text}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {section === "effects" ? (
          <ul className="space-y-3">
            {effectFiltered.map((row) => (
              <li
                key={row.effectKey}
                className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-4 py-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2 font-mono text-sm text-emerald-300">
                  <span>{row.effectKey}</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-amber-200">{row.lucideName}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-zinc-500">
                  paths:{" "}
                  {row.paths.map((p) => `"${p}"`).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        {section === "planner" ? (
          <ul className="space-y-3">
            {plannerFiltered.map((row) => {
              const Icon = PLANNER_ICONS[row.iconKey] ?? Layers;
              return (
                <li
                  key={row.iconKey}
                  className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap gap-4">
                    <div
                      className={`flex size-14 shrink-0 items-center justify-center rounded-lg border border-amber-900/50 bg-amber-950/30 ${row.iconClass}`}
                    >
                      <Icon aria-hidden className="size-7" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-sm text-amber-200">
                        {row.iconKey}
                      </code>
                      <span className="ml-2 text-sm font-medium text-zinc-200">
                        {row.shortLabel}
                      </span>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                        {row.description}
                      </p>
                      <p className="mt-1 font-mono text-xs text-zinc-600">
                        Lucide export: {row.lucideExportName}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        <section className="space-y-4 border-t border-zinc-800 pt-8">
          <h2 className="text-lg font-semibold text-zinc-100">
            Export to sts-planner-reworked
          </h2>
          <p className="max-w-3xl text-sm text-zinc-500">
            Copy or download JSON / TypeScript snippets. Full merge bundle
            includes <code className="text-zinc-400">iconCatalog</code>,{" "}
            <code className="text-zinc-400">lucideByIconKey</code>, and{" "}
            <code className="text-zinc-400">stsVisualDefaults</code> (shapeId +
            Tailwind + shortLabel for each bundled STS key).
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <AtlasExportRow
              label="Full merge bundle (JSON)"
              body={exportMerge}
              fileBase="spire-glyph-export"
              ext="json"
              hint="Highest-signal artifact for tooling"
              onNotify={showFlash}
            />
            <AtlasExportRow
              label="iconCatalog only"
              body={exportIconCatalog}
              fileBase="iconCatalog"
              ext="json"
              onNotify={showFlash}
            />
            <AtlasExportRow
              label="lucideByIconKey"
              body={exportLucide}
              fileBase="lucideByIconKey"
              ext="json"
              onNotify={showFlash}
            />
            <AtlasExportRow
              label="stsVisualDefaults (manager STS_ICON_GLYPH)"
              body={exportVisualDefaults}
              fileBase="stsVisualDefaults"
              ext="json"
              onNotify={showFlash}
            />
            <AtlasExportRow
              label="EffectType → Lucide (planner ICONS snippet)"
              body={exportEffectTs}
              fileBase="effect-icons-export"
              ext="txt"
              hint="Aligns DEFAULT_EFFECT_ICONS → effectDisplay ICONS shape"
              onNotify={showFlash}
            />
          </div>
        </section>
      </div>
    </>
  );
}
