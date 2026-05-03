"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CodexCard } from "@/lib/codex-card-types";
import {
  characterCardShellExplorer,
  characterColorBadgeExplorer,
  rarityBadgeExplorer,
} from "@/lib/field-explorer-card-chrome";
import {
  DEFAULT_EFFECT_ICONS,
  formatEffectIconsAsTypeScript,
  orderedEffectKeys,
} from "@/lib/sts-effect-type-icons";
import {
  cardMatchesEffectPaths,
  pathsForEffectPreview,
} from "@/lib/sts-effect-to-card-paths";
import {
  collectDottedPathsFromCard,
  getAtPath,
} from "@/lib/sts-field-paths";
import {
  LUCIDE_SHAPE_IDS,
  getLucideShape,
} from "@/lib/sts-icon-glyph";

/** One-line preview for field list sidebar. */
function shortValuePreview(val: unknown, maxLen = 96): string {
  if (val === undefined) return "undefined";
  if (val === null) return "null";
  const t = typeof val;
  if (t === "string") {
    const s = val as string;
    const flat = s.includes("\n") ? `${s.split("\n")[0]}…` : s;
    return flat.length <= maxLen ?
        flat
      : `${flat.slice(0, maxLen - 1)}…`;
  }
  if (t === "number" || t === "boolean") return String(val);
  try {
    const s = JSON.stringify(val);
    return s.length <= maxLen ? s : `${s.slice(0, maxLen - 1)}…`;
  } catch {
    return "…";
  }
}

const STORAGE_KEY = "spire-effect-icons-v1";

type Props = {
  entries: CodexCard[];
};

export function FieldIconsView({ entries }: Props) {
  const [effectIcons, setEffectIcons] = useState<Record<string, string>>(() => ({
    ...DEFAULT_EFFECT_ICONS,
  }));
  const [hydrated, setHydrated] = useState(false);
  const [pickerEffect, setPickerEffect] = useState<string | null>(null);
  const [pickerFilter, setPickerFilter] = useState("");
  const [newEffectKey, setNewEffectKey] = useState("");
  const [exportNote, setExportNote] = useState("");
  const [previewEffectKey, setPreviewEffectKey] = useState<string | null>(null);
  const [codexMultiColumn, setCodexMultiColumn] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          effectIcons?: Record<string, string>;
          codexMultiColumn?: boolean;
        };
        if (parsed.effectIcons !== null && typeof parsed.effectIcons === "object") {
          setEffectIcons({ ...parsed.effectIcons });
        }
        if (typeof parsed.codexMultiColumn === "boolean") {
          setCodexMultiColumn(parsed.codexMultiColumn);
        }
      } catch {
        /* ignore corrupt draft */
      } finally {
        setHydrated(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ effectIcons, codexMultiColumn }),
      );
    } catch {
      /* quota */
    }
  }, [hydrated, effectIcons, codexMultiColumn]);

  const orderedKeys = useMemo(
    () => orderedEffectKeys(effectIcons),
    [effectIcons],
  );

  const sortedCodexCards = useMemo(() => {
    const key = previewEffectKey?.trim();
    if (!key) return entries;
    const rows = entries.map((c) => ({
      card: c,
      match: cardMatchesEffectPaths(c.raw, key),
    }));
    rows.sort((a, b) => {
      if (a.match !== b.match) return a.match ? -1 : 1;
      return a.card.displayKey.localeCompare(b.card.displayKey);
    });
    return rows.map((r) => r.card);
  }, [entries, previewEffectKey]);

  const matchCount = useMemo(() => {
    const key = previewEffectKey?.trim();
    if (!key) return null;
    return entries.reduce(
      (n, c) =>
        n + (cardMatchesEffectPaths(c.raw, key) ? 1 : 0),
      0,
    );
  }, [entries, previewEffectKey]);

  const selectedCard = useMemo(
    () =>
      selectedCardId ?
        entries.find((c) => c.id === selectedCardId)
      : undefined,
    [entries, selectedCardId],
  );

  const selectedCardFieldRows = useMemo(() => {
    if (!selectedCard) return [];
    const raw = selectedCard.raw;
    const paths = collectDottedPathsFromCard(raw);
    paths.sort((a, b) => a.localeCompare(b));
    return paths.map((pathStr) => ({
      path: pathStr,
      preview: shortValuePreview(
        getAtPath(raw, pathStr.split(".")),
      ),
    }));
  }, [selectedCard]);

  const filteredPickerIds = useMemo(() => {
    const q = pickerFilter.trim().toLowerCase();
    if (!q) return LUCIDE_SHAPE_IDS;
    return LUCIDE_SHAPE_IDS.filter((id) => id.toLowerCase().includes(q));
  }, [pickerFilter]);

  const jsonExport = useMemo(
    () => `${JSON.stringify(effectIcons, null, 2)}\n`,
    [effectIcons],
  );

  const tsExport = useMemo(
    () => formatEffectIconsAsTypeScript(effectIcons),
    [effectIcons],
  );

  const resetToExample = useCallback(() => {
    setEffectIcons({ ...DEFAULT_EFFECT_ICONS });
    setPreviewEffectKey(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setExportNote("Reset to bundled example defaults (DEFAULT_EFFECT_ICONS).");
  }, []);

  const copyJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonExport);
      setExportNote("Copied JSON mapping to clipboard.");
    } catch {
      setExportNote("Copy failed.");
    }
  }, [jsonExport]);

  const copyTs = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(tsExport);
      setExportNote("Copied TypeScript module to clipboard.");
    } catch {
      setExportNote("Copy failed.");
    }
  }, [tsExport]);

  const downloadJson = useCallback(() => {
    const blob = new Blob([jsonExport], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "effect-icons.json";
    a.click();
    URL.revokeObjectURL(url);
    setExportNote("Downloaded effect-icons.json");
  }, [jsonExport]);

  const downloadTs = useCallback(() => {
    const blob = new Blob([tsExport], { type: "text/typescript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "effect-icons.ts";
    a.click();
    URL.revokeObjectURL(url);
    setExportNote("Downloaded effect-icons.ts");
  }, [tsExport]);

  const pickLucide = (effectKey: string, shapeId: string) => {
    setEffectIcons((prev) => ({
      ...prev,
      [effectKey]: shapeId.trim(),
    }));
    setPickerEffect(null);
    setPickerFilter("");
  };

  const addEffectRow = () => {
    const k = newEffectKey.trim();
    if (!k || k in effectIcons) return;
    setEffectIcons((prev) => ({
      ...prev,
      [k]: "Layers",
    }));
    setNewEffectKey("");
  };

  const removeEffect = (k: string) => {
    if (k in DEFAULT_EFFECT_ICONS) {
      setExportNote(
        `Removed "${k}". Reset restores it from DEFAULT_EFFECT_ICONS.`,
      );
    }
    setPreviewEffectKey((prev) => (prev === k ? null : prev));
    setEffectIcons((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };

  const moveEffect = (key: string, dir: -1 | 1) => {
    setEffectIcons((prev) => {
      const keys = orderedEffectKeys(prev);
      const idx = keys.indexOf(key);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= keys.length) return prev;
      const nextKeys = [...keys];
      [nextKeys[idx], nextKeys[j]] = [nextKeys[j], nextKeys[idx]];
      const next: Record<string, string> = {};
      for (const nk of nextKeys) next[nk] = prev[nk] ?? "";
      return next;
    });
  };

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col gap-8 px-4 py-6 xl:flex-row xl:items-start xl:gap-8">
      <aside
        className="order-3 flex min-h-0 w-full shrink-0 flex-col gap-3 xl:order-1 xl:w-[min(280px,100%)] xl:sticky xl:top-20 xl:z-10 xl:max-h-[calc(100vh-8rem)]"
        aria-label="Selected card fields"
      >
        <div className="shrink-0 space-y-2 xl:rounded-xl xl:border xl:border-zinc-800/70 xl:bg-zinc-950/95 xl:p-4 xl:shadow-xl xl:shadow-black/25 xl:ring-1 xl:ring-zinc-800/50">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Card fields
          </h3>
          {!selectedCard ?
            <p className="max-w-none text-[10px] leading-relaxed text-zinc-600">
              Select a card in the codex to list dotted paths and leaf values from
              its JSON payload.
            </p>
          : (
            <>
              <p className="text-[13px] font-semibold leading-snug text-zinc-100">
                {selectedCard.name}
              </p>
              <p className="truncate font-mono text-[10px] text-zinc-500">
                {selectedCard.displayKey}
              </p>
            </>
          )}
        </div>
        <div
          className={`fm-scrollbar flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/30 xl:max-h-none ${
            selectedCardFieldRows.length > 0 ?
              "max-h-[min(48vh,26rem)] xl:max-h-none"
            : "max-h-32 xl:max-h-none"
          }`}
        >
          {!selectedCard ?
            null
          : selectedCardFieldRows.length === 0 ?
            <p className="p-4 text-[11px] text-zinc-500">No enumerated paths.</p>
          : (
            <ul className="list-none divide-y divide-zinc-800/80 overflow-y-auto overscroll-contain px-2 py-1">
              {selectedCardFieldRows.map(({ path: pathStr, preview }) => (
                <li
                  key={pathStr}
                  className="min-w-0 py-2.5 first:pt-2 last:pb-2"
                >
                  <span className="break-all font-mono text-[10px] leading-snug text-teal-200/95">
                    {pathStr}
                  </span>
                  <p className="mt-1 break-all font-mono text-[10px] leading-snug text-zinc-400">
                    {preview}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col gap-8 xl:order-2">
        <header className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            Field icons (effect → Lucide)
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">
            Edit a semantic{" "}
            <code className="rounded bg-zinc-800/80 px-1 font-mono text-[11px]">
              EffectType
            </code>{" "}
            → Lucide mapping. Starts from{" "}
            <code className="rounded bg-zinc-800/80 px-1 font-mono text-[11px]">
              lib/sts-effect-type-icons.ts
            </code>
            . Drafts persist as{" "}
            <code className="rounded bg-zinc-800/80 px-1 font-mono text-[11px]">
              {STORAGE_KEY}
            </code>
            . Click a Mapping row (or focus its Lucide input) to sort the codex
            list: matching cards glow and float to the top. Click a codex card to
            select it — dotted paths and leaf previews appear in the Card fields
            column (left on wide layouts).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-700"
              onClick={resetToExample}
            >
              Reset to example defaults
            </button>
            <button
              type="button"
              className="rounded-md border border-emerald-800/70 bg-emerald-950/50 px-3 py-1.5 text-sm font-medium text-emerald-200 transition hover:bg-emerald-900/55"
              onClick={() => void copyTs()}
            >
              Copy TypeScript
            </button>
            <button
              type="button"
              className="rounded-md border border-emerald-800/70 bg-emerald-950/50 px-3 py-1.5 text-sm font-medium text-emerald-200 transition hover:bg-emerald-900/55"
              onClick={() => void copyJson()}
            >
              Copy JSON
            </button>
            <button
              type="button"
              className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700"
              onClick={downloadTs}
            >
              Download .ts
            </button>
            <button
              type="button"
              className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700"
              onClick={downloadJson}
            >
              Download .json
            </button>
          </div>
          {exportNote ? (
            <p className="text-sm text-zinc-500">{exportNote}</p>
          ) : null}
        </header>

        <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-sm font-semibold text-zinc-200">Add effect key</h2>
          <div className="flex flex-wrap gap-2">
            <input
              className="min-h-[2.875rem] min-w-[10rem] flex-1 rounded-xl border border-zinc-600/80 bg-black/35 px-3.5 py-2.5 font-mono text-sm text-zinc-200 shadow-inner outline-none ring-1 ring-zinc-800 placeholder:text-zinc-600 transition focus:border-teal-800/55 focus:ring-teal-500/20"
              placeholder="e.g. evade"
              value={newEffectKey}
              onChange={(e) => setNewEffectKey(e.target.value)}
            />
            <button
              type="button"
              className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-40"
              disabled={
                !newEffectKey.trim() || newEffectKey.trim() in effectIcons
              }
              onClick={addEffectRow}
            >
              Add
            </button>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <button
            type="button"
            className="block w-full rounded-lg px-1 text-left outline-none transition hover:bg-zinc-900/55"
            onClick={() => setPreviewEffectKey(null)}
          >
            <h2 className="text-sm font-semibold text-zinc-200">Mapping</h2>
            <p className="mt-1 text-[11px] leading-snug text-zinc-500">
              Click anywhere on an effect row to spotlight matching cards (
              <span className="text-zinc-400">hint: click this header to clear)</span>.
              Paths:{" "}
              <code className="rounded bg-zinc-900 px-1 font-mono text-zinc-400">
                lib/sts-effect-to-card-paths.ts
              </code>{" "}
              (fallback: top-level{" "}
              <code className="font-mono text-zinc-400">/&lt;key&gt;</code>
              ).
            </p>
          </button>
          {previewEffectKey ?
            <p className="text-[11px] font-mono leading-relaxed text-teal-300/95">
              <span className="text-teal-500/80">
                Spotlight <span className="text-teal-200">{previewEffectKey}</span>{" "}
                → paths:{` `}
              </span>
              {pathsForEffectPreview(previewEffectKey).join(" · ")}
            </p>
          : (
            <p className="text-[11px] text-zinc-600">
              No spotlight — codex sidebar is in natural bundle order.
            </p>
          )}
          <div className="space-y-3">
            {orderedKeys.map((ek) => {
              const lucideName = effectIcons[ek] ?? "";
              const Comp =
                lucideName.trim() ? getLucideShape(lucideName.trim()) : undefined;
              const typo = !!(lucideName.trim() && !Comp);
              const pickerOpen = pickerEffect === ek;
              const idx = orderedKeys.indexOf(ek);
              const spotlight = previewEffectKey === ek;
              return (
                <div
                  key={ek}
                  onClick={() => setPreviewEffectKey(ek)}
                  className={`rounded-xl border border-zinc-700/90 bg-gradient-to-br from-zinc-900/95 via-zinc-950/90 to-black/40 p-4 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] outline-none transition cursor-pointer hover:border-teal-900/50 hover:from-zinc-900/90 ${
                    spotlight ?
                      "ring-2 ring-teal-500/60 ring-offset-2 ring-offset-zinc-950"
                    : ""
                  }`}
                >
                  <div className="flex flex-wrap items-stretch gap-3">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        className="rounded-lg border border-zinc-600/80 bg-zinc-900/80 px-1.5 py-0.5 text-[11px] text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
                        disabled={idx <= 0}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveEffect(ek, -1);
                        }}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-zinc-600/80 bg-zinc-900/80 px-1.5 py-0.5 text-[11px] text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
                        disabled={idx >= orderedKeys.length - 1}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveEffect(ek, 1);
                        }}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </div>
                    <div className="flex min-h-[3.25rem] min-w-[6.5rem] flex-none flex-col justify-center rounded-lg border border-cyan-900/35 bg-black/25 px-2.5 py-2 ring-1 ring-cyan-500/10">
                      <span className="font-mono text-[13px] font-semibold leading-tight tracking-tight text-cyan-100/95">
                        {ek}
                      </span>
                      {typo ? (
                        <span className="mt-1 w-fit rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200/90 ring-1 ring-amber-800/70">
                          unknown glyph
                        </span>
                      ) : null}
                    </div>
                    <div className="flex h-[3.25rem] min-w-[2.75rem] flex-none shrink-0 items-center justify-center self-center rounded-lg border border-zinc-700/80 bg-black/30">
                      {Comp ?
                        <Comp className="h-6 w-6 text-teal-200/90 drop-shadow-[0_0_8px_rgba(45,212,191,0.15)]" aria-hidden />
                      : <span className="text-sm text-zinc-600">—</span>}
                    </div>
                    <input
                      className="min-h-[3.25rem] min-w-[11rem] flex-1 cursor-text rounded-xl border border-zinc-600/80 bg-black/35 px-3.5 py-3 font-mono text-[13px] text-zinc-100 shadow-inner shadow-black/40 placeholder:text-zinc-600 outline-none ring-1 ring-zinc-800/90 transition hover:border-teal-800/55 focus:border-teal-600/50 focus:ring-teal-500/25"
                      placeholder="Lucide export name"
                      value={lucideName}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => setPreviewEffectKey(ek)}
                      onChange={(e) =>
                        setEffectIcons((prev) => ({
                          ...prev,
                          [ek]: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="min-h-[3.25rem] self-center rounded-xl border border-zinc-600/70 bg-zinc-800/70 px-3.5 text-xs font-medium text-teal-100/95 shadow-sm transition hover:border-teal-800/55 hover:bg-zinc-800"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerEffect(pickerOpen ? null : ek);
                      }}
                    >
                      {pickerOpen ? "Close picker" : "Pick…"}
                    </button>
                    <button
                      type="button"
                      className="min-h-[3.25rem] self-center rounded-xl border border-rose-900/40 bg-rose-950/20 px-3.5 text-xs font-medium text-rose-300/95 transition hover:border-rose-800/65 hover:bg-rose-950/45"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEffect(ek);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  {pickerOpen ?
                    <div
                      className="mt-3 space-y-2 border-t border-zinc-800 pt-3"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        className="w-full rounded-xl border border-zinc-700/90 bg-black/40 px-3 py-2.5 font-mono text-xs text-zinc-200 shadow-inner outline-none ring-1 ring-zinc-800 placeholder:text-zinc-600 focus:border-teal-800/55 focus:ring-teal-500/20"
                        placeholder="Filter icons…"
                        value={pickerFilter}
                        onChange={(e) => setPickerFilter(e.target.value)}
                      />
                      <div className="grid max-h-44 grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-5 md:grid-cols-6">
                        {filteredPickerIds.map((id) => {
                          const Ico = getLucideShape(id);
                          if (!Ico) return null;
                          return (
                            <button
                              key={id}
                              type="button"
                              className="flex flex-col items-center gap-1 rounded border border-zinc-800 bg-zinc-900/50 px-1 py-2 text-[10px] text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800"
                              onClick={() => pickLucide(ek, id)}
                            >
                              <Ico className="h-4 w-4 text-zinc-200" />
                              <span className="truncate font-mono">{id}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
            <h2 className="mb-2 text-sm font-semibold text-zinc-200">JSON</h2>
            <pre className="max-h-56 overflow-auto rounded border border-zinc-800 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
              {jsonExport.trimEnd()}
            </pre>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
            <h2 className="mb-2 text-sm font-semibold text-zinc-200">
              TypeScript
            </h2>
            <pre className="max-h-56 overflow-auto rounded border border-zinc-800 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
              {tsExport.trimEnd()}
            </pre>
          </div>
        </section>
      </div>

      <aside className="order-2 flex min-h-0 w-full shrink-0 flex-col gap-3 xl:order-3 xl:w-[min(420px,100%)] xl:sticky xl:top-20 xl:z-10 xl:max-h-[calc(100vh-8rem)]">
        <div className="shrink-0 space-y-3 xl:rounded-xl xl:border xl:border-zinc-800/70 xl:bg-zinc-950/95 xl:p-4 xl:shadow-xl xl:shadow-black/25 xl:ring-1 xl:ring-zinc-800/50">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Codex
              </h3>
              <p className="max-w-[16rem] text-[10px] leading-relaxed text-zinc-600">
                Click a card to select (sky ring); fields list on the left. Spotlight
                reorders matches first; matches get an amber ring unless selected.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                disabled={!previewEffectKey}
                className="rounded-lg border border-zinc-600/70 bg-zinc-800/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 shadow-sm ring-1 ring-zinc-700/35 transition hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-zinc-600 disabled:hover:bg-zinc-800/80"
                onClick={() => setPreviewEffectKey(null)}
              >
                Clear filter
              </button>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700/80 bg-black/28 px-2.5 py-1.5 text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 text-teal-500 focus:ring-teal-500/40"
                  checked={codexMultiColumn}
                  onChange={(e) =>
                    setCodexMultiColumn(e.target.checked)
                  }
                />
                <span>More per row</span>
              </label>
            </div>
          </div>
          {previewEffectKey && matchCount !== null ?
            <p className="text-[11px] text-zinc-400">
              <span className="font-semibold text-amber-200/95">{matchCount}</span>{" "}
              / {entries.length} cards match spotlight
            </p>
          : (
            <p className="text-[11px] text-zinc-600">No spotlight filter active.</p>
          )}
        </div>
        <ul
          className={`fm-scrollbar list-none min-h-0 max-h-[min(56vh,32rem)] flex-1 gap-2.5 overflow-y-auto overscroll-contain rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-2.5 xl:max-h-none ${
            codexMultiColumn ?
              "grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:items-start"
            : "flex flex-col gap-2.5"
          }`}
        >
          {sortedCodexCards.map((c) => {
            const char = (c.character ?? "").trim() || "—";
            const typ = (c.type ?? "").trim() || "—";
            const rar = (c.rarity ?? "").trim() || "—";
            const key = previewEffectKey?.trim();
            const match =
              key ? cardMatchesEffectPaths(c.raw, key) : false;
            const selected = selectedCardId === c.id;
            return (
              <li key={c.id} className="min-w-0 max-w-full self-start">
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Select ${c.displayKey}`}
                  onClick={() => {
                    setSelectedCardId((prev) =>
                      prev === c.id ? null : c.id,
                    );
                  }}
                  className={`flex h-full min-h-[5rem] w-full cursor-pointer flex-col justify-center gap-1.5 rounded-xl px-3.5 py-3.5 text-left shadow-inner shadow-black/15 outline-none transition hover:brightness-[1.06] focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${characterCardShellExplorer(c.character ?? "")} ${
                    selected ?
                      "ring-2 ring-sky-500/90 ring-offset-2 ring-offset-zinc-950"
                    : previewEffectKey && match ?
                      "ring-2 ring-amber-400/75 ring-offset-2 ring-offset-zinc-950"
                    : ""
                  }`}
                >
                  <span className="text-[15px] font-semibold leading-snug tracking-tight text-zinc-100">
                    {c.name}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${characterColorBadgeExplorer(c.character ?? "")}`}
                    >
                      {char.toUpperCase()}
                    </span>
                    <span className="rounded border border-zinc-600/60 bg-zinc-800/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-300">
                      {typ.toUpperCase()}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${rar !== "—" ? rarityBadgeExplorer(rar) : "border-zinc-600/60 bg-zinc-800/50 text-zinc-400"}`}
                    >
                      {rar.toUpperCase()}
                    </span>
                  </div>
                  <span className="truncate font-mono text-[10px] text-zinc-500">
                    {c.displayKey}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
