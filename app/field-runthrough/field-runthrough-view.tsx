"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CodexCard } from "@/lib/codex-card-types";
import { FIELD_MANAGER_CARD_DATA_STORAGE_KEY } from "@/lib/field-manager-card-storage-key";
import {
  baselineMapFromEntries,
  codexRowFromRaw,
  costRawFromCard,
} from "@/lib/runthrough-card-helpers";
import {
  globalPathCatalog,
  renameLeafAtPath,
  setLeafValue,
  setPathPresent,
} from "@/lib/sts-field-paths";
import { enrichFromDescriptions } from "@/lib/sts-description-enrichment";
import { RunthroughCardReference } from "@/lib/runthrough-card-preview";
import { AddFieldForm, FieldEditorTree } from "../field-manager/field-schema-editors";

export function FieldRunthroughView({
  entries,
  galleryFieldKeys,
}: {
  entries: CodexCard[];
  galleryFieldKeys: string[];
}) {
  const baselineOrder = useMemo(() => entries.map((e) => e.id), [entries]);
  const templateById = useMemo(() => {
    const m = new Map<string, CodexCard>();
    for (const e of entries) m.set(e.id, e);
    return m;
  }, [entries]);

  const [cardData, setCardData] = useState<Record<
    string,
    Record<string, unknown>
  > | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const base = baselineMapFromEntries(entries);
    let merged = base as Record<string, Record<string, unknown>>;
    try {
      const raw = localStorage.getItem(FIELD_MANAGER_CARD_DATA_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Record<
          string,
          Record<string, unknown>
        >;
        merged = { ...base, ...saved };
      }
    } catch {
      merged = base;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client hydrate from localStorage
    setCardData(merged);
    setHydrated(true);
  }, [entries]);

  useEffect(() => {
    if (!cardData || !hydrated) return;
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(
          FIELD_MANAGER_CARD_DATA_STORAGE_KEY,
          JSON.stringify(cardData),
        );
      } catch {
        /* quota */
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [cardData, hydrated]);

  const [runMode, setRunMode] = useState(false);
  const [index, setIndex] = useState(0);
  const [tagListFilter, setTagListFilter] = useState("");
  const [pathFilters, setPathFilters] = useState<Set<string>>(
    () => new Set(),
  );
  const [jsonText, setJsonText] = useState("");
  const [jsonErr, setJsonErr] = useState<string | null>(null);
  const [fieldBranchesCollapsed, setFieldBranchesCollapsed] = useState<
    Set<string>
  >(() => new Set());

  const toggleFieldBranch = useCallback((pathStr: string) => {
    setFieldBranchesCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(pathStr)) next.delete(pathStr);
      else next.add(pathStr);
      return next;
    });
  }, []);

  const n = baselineOrder.length;
  const selectedId =
    n > 0 ? baselineOrder[Math.min(Math.max(0, index), n - 1)] : "";

  /* eslint-disable react-hooks/set-state-in-effect -- reset tree collapse when switching card */
  useEffect(() => {
    setFieldBranchesCollapsed(new Set());
  }, [selectedId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const pathCatalog = useMemo(() => {
    if (!cardData) return [] as string[];
    return globalPathCatalog(cardData, baselineOrder, galleryFieldKeys);
  }, [cardData, galleryFieldKeys, baselineOrder]);

  const filteredPathCatalog = useMemo(() => {
    const q = tagListFilter.trim().toLowerCase();
    if (!q) return pathCatalog;
    return pathCatalog.filter((p) => p.toLowerCase().includes(q));
  }, [pathCatalog, tagListFilter]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (n === 0) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => Math.min(n - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n]);

  const selectedTemplate =
    selectedId ? templateById.get(selectedId) : undefined;
  const selectedRaw =
    selectedId && cardData ? cardData[selectedId] : null;

  /* eslint-disable react-hooks/set-state-in-effect -- keep JSON textarea in sync */
  useEffect(() => {
    if (!selectedId || !selectedRaw) {
      setJsonText("");
      return;
    }
    setJsonText(JSON.stringify(selectedRaw, null, 2));
    setJsonErr(null);
  }, [selectedId, selectedRaw]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updatePathForCard = useCallback(
    (cardId: string, pathStr: string, present: boolean) => {
      const parts = pathStr.split(".").filter(Boolean);
      if (parts.length === 0) return;
      if (parts[0] === "id" && parts.length === 1) return;
      setCardData((prev) => {
        if (!prev) return prev;
        const cur = prev[cardId];
        if (!cur) return prev;
        const nextRow = setPathPresent(
          cur,
          parts,
          present,
          prev,
          baselineOrder,
        );
        return { ...prev, [cardId]: nextRow };
      });
    },
    [baselineOrder],
  );

  const setValueForPath = useCallback(
    (cardId: string, pathStr: string, value: unknown) => {
      const parts = pathStr.split(".").filter(Boolean);
      if (parts.length === 0) return;
      if (parts[0] === "id" && parts.length === 1) return;
      setCardData((prev) => {
        if (!prev) return prev;
        const cur = prev[cardId];
        if (!cur) return prev;
        const nextRow = setLeafValue(cur, parts, value);
        return { ...prev, [cardId]: nextRow };
      });
    },
    [],
  );

  const renamePathForCard = useCallback(
    (cardId: string, pathStr: string, newLeaf: string) => {
      const parts = pathStr.split(".").filter(Boolean);
      if (parts.length === 0) return;
      if (parts[0] === "id") return;
      setCardData((prev) => {
        if (!prev) return prev;
        const cur = prev[cardId];
        if (!cur) return prev;
        const nextRow = renameLeafAtPath(cur, parts, newLeaf);
        return { ...prev, [cardId]: nextRow };
      });
    },
    [],
  );

  const addFieldForCard = useCallback(
    (cardId: string, fullPath: string, value: unknown) => {
      const parts = fullPath.split(".").filter(Boolean);
      if (parts.length === 0) return;
      if (parts[0] === "id" && parts.length === 1) return;
      setCardData((prev) => {
        if (!prev) return prev;
        const cur = prev[cardId];
        if (!cur) return prev;
        const nextRow = setLeafValue(cur, parts, value);
        return { ...prev, [cardId]: nextRow };
      });
    },
    [],
  );

  const togglePathFilter = useCallback((pathStr: string) => {
    setPathFilters((prev) => {
      const next = new Set(prev);
      if (next.has(pathStr)) next.delete(pathStr);
      else next.add(pathStr);
      return next;
    });
  }, []);

  const clearPathFilters = useCallback(() => {
    setPathFilters(new Set());
  }, []);

  const applyEnrichment = useCallback(() => {
    if (!selectedId || !cardData) return;
    const raw = cardData[selectedId];
    const desc = typeof raw.description === "string" ? raw.description : "";
    const descUp =
      typeof raw.descriptionUpgraded === "string"
        ? raw.descriptionUpgraded
        : desc;
    const enriched = enrichFromDescriptions({
      description: desc,
      descriptionUpgraded: descUp,
      costRaw: costRawFromCard(raw),
    });
    setCardData((prev) => {
      if (!prev) return prev;
      const cur = prev[selectedId];
      if (!cur) return prev;
      const merged = { ...cur, ...enriched, id: selectedId };
      return { ...prev, [selectedId]: merged };
    });
  }, [selectedId, cardData]);

  const applyJson = useCallback(() => {
    if (!selectedId) return;
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      parsed.id = selectedId;
      setJsonErr(null);
      setCardData((prev) =>
        prev ? { ...prev, [selectedId]: parsed } : prev,
      );
    } catch (e) {
      setJsonErr(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, [selectedId, jsonText]);

  const resetCard = useCallback(() => {
    if (!selectedId) return;
    const t = templateById.get(selectedId);
    if (!t) return;
    setCardData((prev) =>
      prev
        ? {
            ...prev,
            [selectedId]: { ...t.raw, id: selectedId },
          }
        : prev,
    );
  }, [selectedId, templateById]);

  const resetAll = useCallback(() => {
    const base = baselineMapFromEntries(entries);
    setCardData(base);
    try {
      localStorage.removeItem(FIELD_MANAGER_CARD_DATA_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [entries]);

  const exportEditedBlob = useCallback(() => {
    if (!cardData) return;
    const blob = new Blob(
      ["{\n \"cards\": ", JSON.stringify(cardData, null, 2), "\n}"],
      {
        type: "application/json",
      },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "field-manager-cards-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [cardData]);

  const startRunThrough = () => {
    setRunMode(true);
    setIndex(0);
  };

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setIndex((i) =>
      Math.min(
        Math.max(0, n - 1),
        i + 1,
      ),
    );

  const liveCodexRow = useMemo(() => {
    if (!selectedTemplate || !selectedRaw)
      return null;
    return codexRowFromRaw(selectedTemplate, selectedRaw);
  }, [selectedTemplate, selectedRaw]);

  const descriptionStr = useMemo(() => {
    if (!selectedRaw) return "";
    return typeof selectedRaw.description === "string"
      ? selectedRaw.description
      : "";
  }, [selectedRaw]);

  const upgradedStr = useMemo(() => {
    if (!selectedRaw) return "";
    return typeof selectedRaw.descriptionUpgraded === "string"
      ? selectedRaw.descriptionUpgraded
      : "";
  }, [selectedRaw]);

  if (!cardData || !hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-20 text-sm text-zinc-500">
        Loading card data…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/80 lg:max-h-[calc(100dvh-3.5rem)] lg:flex-row lg:items-stretch lg:overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-5 sm:px-6 lg:min-w-0 lg:px-8">
        <header className="shrink-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-500/80">
            Field manager — Run through
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
            One-by-one field review
          </h1>
          <p className="max-w-2xl text-xs leading-relaxed text-zinc-500">
            Same workflow as Field Manager. On wide screens your card descriptions
            stay on the right while you scroll fields. Collapse Path catalog unless
            you need quick path highlights. Use{" "}
            <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 py-px font-mono">
              Prev
            </kbd>{" "}
            /{" "}
            <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 py-px font-mono">
              Next
            </kbd>{" "}
            or ← → when not typing in a field.{" "}
            <strong className="text-zinc-300">Run through</strong> focuses the run
            list. Edits sync with Field Manager.
          </p>
        </header>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={startRunThrough}
            className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
              runMode
                ? "bg-teal-600 text-white hover:bg-teal-500"
                : "border border-teal-800 bg-teal-950/60 text-teal-100 hover:bg-teal-900/55"
            }`}
          >
            Run through
          </button>
          <button
            type="button"
            onClick={goPrev}
            disabled={n === 0}
            className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={n === 0}
            className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
          >
            Next
          </button>
          <span className="text-[11px] tabular-nums text-zinc-500">
            {n ? index + 1 : 0} / {n}
          </span>
          <button
            type="button"
            onClick={exportEditedBlob}
            className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-white"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => resetCard()}
            className="rounded-lg border border-amber-900/45 bg-amber-950/20 px-3 py-2 text-xs font-medium text-amber-100/95 hover:bg-amber-950/35"
          >
            Reset card
          </button>
          <button
            type="button"
            onClick={() => resetAll()}
            className="rounded-lg border border-red-900/50 bg-red-950/25 px-3 py-2 text-xs font-medium text-red-200/90 hover:bg-red-950/40"
          >
            Reset all
          </button>
        </div>

        {pathFilters.size > 0 ? (
          <div className="shrink-0 space-y-1.5 rounded-lg bg-teal-950/25 px-2 py-2 ring-1 ring-teal-900/40">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-200/80">
                Path filters (highlight in tree)
              </span>
              <button
                type="button"
                className="shrink-0 text-[10px] font-medium text-teal-400 underline-offset-2 hover:underline"
                onClick={clearPathFilters}
              >
                Clear all
              </button>
            </div>
            <ul className="fm-scrollbar flex max-h-20 flex-wrap gap-1 overflow-y-auto overscroll-contain">
              {[...pathFilters].sort().map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    title={`Remove filter ${p}`}
                    onClick={() => togglePathFilter(p)}
                    className="inline-flex max-w-full items-center gap-1 rounded-md border border-teal-800/60 bg-teal-950/50 px-1.5 py-0.5 text-left font-mono text-[9px] text-teal-100/95 hover:bg-teal-900/40"
                  >
                    <span className="min-w-0 truncate">{p}</span>
                    <span className="text-teal-400/90" aria-hidden>
                      ×
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row lg:items-stretch lg:gap-0">
          <div className="fm-scrollbar flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain lg:max-w-none lg:min-h-0 lg:pr-3">
            {selectedTemplate && selectedRaw && selectedId ? (
              <>
                {liveCodexRow ? (
                  <div className="sticky top-0 z-[5] border-b border-zinc-900/95 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-950/90 pb-2 pt-0.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.65)] lg:hidden">
                    <RunthroughCardReference
                      liveCodexRow={liveCodexRow}
                      desc={descriptionStr}
                      descUp={upgradedStr}
                      onMergeFromDescriptions={applyEnrichment}
                      variant="compact"
                    />
                  </div>
                ) : null}

                <details className="shrink-0 rounded-xl border border-zinc-800/80 bg-zinc-950/40">
                  <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-zinc-300 marker:content-none sm:px-4 [&::-webkit-details-marker]:hidden">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Path catalog
                    </span>
                    <span className="ml-2 font-normal text-zinc-600">
                      — click paths to highlight in the tree (
                      {filteredPathCatalog.length}/{pathCatalog.length} shown)
                    </span>
                  </summary>
                  <div className="border-t border-zinc-800/80 px-3 pb-3 pt-2 sm:px-4">
                    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/60 pb-3">
                      {pathFilters.size > 0 ? (
                        <button
                          type="button"
                          onClick={clearPathFilters}
                          className="shrink-0 rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-[10px] font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                        >
                          Clear filters ({pathFilters.size})
                        </button>
                      ) : null}
                      <input
                        type="search"
                        value={tagListFilter}
                        onChange={(e) => setTagListFilter(e.target.value)}
                        placeholder="Filter path list…"
                        className="min-w-[12rem] flex-1 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-teal-700/50 focus:outline-none"
                      />
                    </div>
                    <ul className="fm-scrollbar mt-2 max-h-56 space-y-0.5 overflow-y-auto overscroll-contain lg:max-h-72">
                      {filteredPathCatalog.map((pathStr) => {
                        const active = pathFilters.has(pathStr);
                        return (
                          <li key={pathStr}>
                            <button
                              type="button"
                              title={pathStr}
                              aria-pressed={active}
                              onClick={() => togglePathFilter(pathStr)}
                              className={`flex w-full items-start rounded-lg px-2 py-1.5 text-left font-mono text-[10px] leading-snug transition-colors ${
                                active
                                  ? "bg-teal-950/80 text-teal-100 ring-1 ring-teal-600/40"
                                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                              }`}
                            >
                              <span className="min-w-0 break-all">{pathStr}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </details>

                <AddFieldForm
                  pathCatalog={pathCatalog}
                  selectedRaw={selectedRaw}
                  onAdd={(fullPath, value) =>
                    addFieldForCard(selectedId, fullPath, value)
                  }
                />

                <div id="fm-field-editor-anchor">
                  <h3 className="scroll-mt-28 text-sm font-semibold text-zinc-200">
                    Fields
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Toggle paths, rename, edit values. On wide screens descriptions
                    stay in the pinned panel on the right while you scroll here.
                  </p>
                  <div className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3 sm:p-4">
                    <FieldEditorTree
                      parentPath=""
                      depth={0}
                      pathCatalog={pathCatalog}
                      selectedRaw={selectedRaw}
                      onSetPath={(pathStr, present) =>
                        updatePathForCard(selectedId, pathStr, present)
                      }
                      onSetValue={(pathStr, v) =>
                        setValueForPath(selectedId, pathStr, v)
                      }
                      onRenameLeaf={(pathStr, newLeaf) =>
                        renamePathForCard(selectedId, pathStr, newLeaf)
                      }
                      collapsedBranches={fieldBranchesCollapsed}
                      onToggleBranch={toggleFieldBranch}
                      pathFilters={pathFilters}
                    />
                  </div>
                </div>

                <details className="shrink-0 rounded-xl border border-zinc-800/60 bg-zinc-900/20">
                  <summary className="cursor-pointer select-none px-4 py-3 text-xs font-medium text-zinc-500 hover:text-zinc-400">
                    Advanced · full card JSON
                  </summary>
                  <div className="border-t border-zinc-800/60 px-4 pb-4 pt-2">
                    <textarea
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      spellCheck={false}
                      rows={12}
                      className="w-full resize-y rounded-lg border border-zinc-800 bg-black/40 p-3 font-mono text-[11px] text-zinc-300 focus:border-zinc-600 focus:outline-none"
                    />
                    {jsonErr ? (
                      <p className="mt-2 text-xs text-red-400">{jsonErr}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => applyJson()}
                      className="mt-2 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-600"
                    >
                      Replace card from JSON
                    </button>
                  </div>
                </details>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 py-16 text-center text-sm text-zinc-500">
                No card selected.
              </div>
            )}
          </div>

          {liveCodexRow &&
          selectedTemplate &&
          selectedRaw &&
          selectedId ? (
            <aside className="fm-scrollbar hidden max-w-full shrink-0 overflow-y-auto overscroll-contain lg:sticky lg:top-0 lg:flex lg:max-h-[calc(100dvh-5rem)] lg:h-fit lg:w-[min(418px,36vw)] lg:min-w-[280px] lg:flex-col lg:self-start xl:max-w-md">
              <div className="flex flex-col border-zinc-800/95 bg-[radial-gradient(ellipse_at_top,_rgba(20,184,166,0.07),transparent_52%)] bg-zinc-950/96 px-2 py-4 sm:px-3 lg:border-l lg:px-5 lg:py-6">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                  Always visible — card preview
                </p>
                <RunthroughCardReference
                  liveCodexRow={liveCodexRow}
                  desc={descriptionStr}
                  descUp={upgradedStr}
                  onMergeFromDescriptions={applyEnrichment}
                  variant="rail"
                />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
