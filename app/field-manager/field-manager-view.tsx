"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CodexCard } from "@/lib/codex-card-types";
import { charactersListFromRow } from "@/lib/sts-characters-parse";
import { formatCostBadge } from "@/lib/sts-card-format";
import {
  globalPathCatalog,
  hasPath,
  renameLeafAtPath,
  setLeafValue,
  setPathPresent,
} from "@/lib/sts-field-paths";
import {
  characterCardShellExplorer,
  characterColorBadgeExplorer,
  rarityBadgeExplorer,
} from "@/lib/field-explorer-card-chrome";
import { enrichFromDescriptions } from "@/lib/sts-description-enrichment";
import { AddFieldForm, FieldEditorTree } from "./field-schema-editors";

const STORAGE_KEY = "spire-field-manager-card-data-v2";

function costRawFromCard(raw: Record<string, unknown>): string {
  if (raw.unplayable === true) return "";
  if (raw.xCost === true) return "X";
  const cost = raw.cost as { base?: number; upgraded?: number } | undefined;
  if (cost?.base !== undefined) return String(cost.base);
  return "";
}

function baselineMapFromEntries(entries: CodexCard[]) {
  return Object.fromEntries(
    entries.map((e) => [e.id, { ...e.raw, id: e.id } as Record<string, unknown>]),
  );
}

/** Per-card overlay from localStorage, then canonical row wins on every shared key */
function hydrateFromBaselineAndStorage(
  base: Record<string, Record<string, unknown>>,
  saved: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const [id, baseRow] of Object.entries(base)) {
    const s = saved[id];
    const overlay =
      typeof s === "object" && s !== null && !Array.isArray(s)
        ? (s as Record<string, unknown>)
        : {};
    out[id] = { ...overlay, ...baseRow };
  }
  return out;
}

function codexRowFromRaw(
  template: CodexCard,
  raw: Record<string, unknown>,
): CodexCard {
  const list = charactersListFromRow(raw);
  const primary = list[0] ?? "";

  return {
    ...template,
    raw,
    character: primary,
    charactersList: list,
    type: typeof raw.type === "string" ? raw.type : undefined,
    rarity: typeof raw.rarity === "string" ? raw.rarity : undefined,
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    descriptionUpgraded:
      typeof raw.descriptionUpgraded === "string"
        ? raw.descriptionUpgraded
        : undefined,
    costLabel: formatCostBadge(raw),
  };
}

type Props = {
  entries: CodexCard[];
  galleryFieldKeys: string[];
};

export function FieldManagerView({ entries, galleryFieldKeys }: Props) {
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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, unknown>;
        merged = hydrateFromBaselineAndStorage(base, saved);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cardData));
      } catch {
        /* quota */
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [cardData, hydrated]);

  const [query, setQuery] = useState("");
  const [tagListFilter, setTagListFilter] = useState("");
  const [pathFilters, setPathFilters] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const liveRows = useMemo(() => {
    if (!cardData) return [];
    return entries.map((e) => codexRowFromRaw(e, cardData[e.id] ?? e.raw));
  }, [entries, cardData]);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return liveRows.filter((e) => {
      if (pathFilters.size > 0) {
        const raw = cardData?.[e.id];
        if (!raw) return false;
        for (const f of pathFilters) {
          if (!hasPath(raw, f.split(".").filter(Boolean))) return false;
        }
      }
      if (!q) return true;
      const hay = [
        e.name,
        e.id,
        e.displayKey,
        e.description,
        e.descriptionUpgraded,
        e.costLabel,
        JSON.stringify(cardData?.[e.id] ?? {}),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [liveRows, query, pathFilters, cardData]);

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

  const selectedTemplate = selectedId ? templateById.get(selectedId) : undefined;
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
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [entries]);

  const exportEditedBlob = useCallback(() => {
    if (!cardData) return;
    const blob = new Blob(["{\n \"cards\": ", JSON.stringify(cardData, null, 2), "\n}"], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "field-manager-cards-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [cardData]);

  if (!cardData || !hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-20 text-sm text-zinc-500">
        Loading card data…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/80 lg:max-h-[calc(100dvh-3.5rem)] lg:flex-row lg:items-stretch lg:overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-hidden px-4 py-6 sm:px-6 lg:min-w-0 lg:px-8 xl:px-10">
        <header className="shrink-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-500/80">
            Field manager
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Card schema editor
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-500">
            Toggle fields, edit values, rename keys, or add new ones — all in
            one place. Data maps to{" "}
            <code className="rounded-md bg-zinc-900/90 px-1.5 py-0.5 font-mono text-xs text-teal-200/90">
              sts-planner-reworked …/STS_CARDS_DB.json
            </code>
            ; changes persist in this browser until you export.
          </p>
        </header>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={exportEditedBlob}
            className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-white"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="rounded-lg border border-red-900/50 bg-red-950/25 px-3 py-2 text-xs font-medium text-red-200/90 hover:bg-red-950/40"
          >
            Reset all
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 overflow-hidden lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col gap-3 lg:z-20 lg:overflow-hidden lg:rounded-xl lg:border lg:border-zinc-800/70 lg:bg-zinc-950/95 lg:p-3 lg:shadow-xl lg:shadow-black/25 lg:ring-1 lg:ring-zinc-800/50 lg:backdrop-blur-md">
            <div className="shrink-0 space-y-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-zinc-500">
                  Search cards
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, pool, text…"
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-teal-600/40 focus:outline-none focus:ring-2 focus:ring-teal-500/15 lg:bg-zinc-900/80"
                />
              </label>
              {pathFilters.size > 0 ? (
                <div className="space-y-1.5 rounded-lg bg-teal-950/25 px-2 py-2 ring-1 ring-teal-900/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-200/80">
                      Path filters (all must match)
                    </span>
                    <button
                      type="button"
                      className="shrink-0 text-[10px] font-medium text-teal-400 underline-offset-2 hover:underline"
                      onClick={clearPathFilters}
                    >
                      Clear all
                    </button>
                  </div>
                  <ul className="fm-scrollbar flex max-h-24 flex-wrap gap-1 overflow-y-auto overscroll-contain">
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
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                {filteredCards.length} cards
              </p>
            </div>
            <ul className="fm-scrollbar mt-1 max-h-[min(52vh,26rem)] min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-2 lg:max-h-none lg:min-h-0">
              {filteredCards.map((c) => {
                const on = c.id === selectedId;
                const char = (c.character ?? "").trim() || "—";
                const typ = (c.type ?? "").trim() || "—";
                const rar = (c.rarity ?? "").trim() || "—";
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-all ${characterCardShellExplorer(c.character ?? "")} ${
                        on
                          ? "ring-2 ring-teal-500/70 ring-offset-2 ring-offset-zinc-950"
                          : ""
                      }`}
                    >
                      <span className="font-medium text-zinc-100">{c.name}</span>
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`rounded border px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${characterColorBadgeExplorer(c.character ?? "")}`}
                        >
                          {char.toUpperCase()}
                        </span>
                        <span className="rounded border border-zinc-600/60 bg-zinc-800/50 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-zinc-300">
                          {typ.toUpperCase()}
                        </span>
                        <span
                          className={`rounded border px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${rar !== "—" ? rarityBadgeExplorer(rar) : "border-zinc-600/60 bg-zinc-800/50 text-zinc-400"}`}
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
          </div>

          <div className="flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto overscroll-contain pr-1 fm-scrollbar lg:min-h-0 lg:pl-0.5">
            {selectedTemplate && selectedRaw && selectedId ? (
              <>
                <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5 shadow-xl shadow-black/20">
                  <h2 className="text-lg font-semibold text-zinc-50">
                    {selectedTemplate.name}
                  </h2>
                  <p className="mt-0.5 font-mono text-xs text-zinc-500">
                    {selectedTemplate.displayKey}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                    {typeof selectedRaw.description === "string"
                      ? selectedRaw.description
                      : "—"}
                  </p>
                  {typeof selectedRaw.descriptionUpgraded === "string" &&
                  selectedRaw.descriptionUpgraded !==
                    selectedRaw.description ? (
                    <p className="mt-3 border-t border-zinc-800/80 pt-3 text-sm text-zinc-500">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                        Upgraded
                      </span>
                      <br />
                      {selectedRaw.descriptionUpgraded}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={applyEnrichment}
                      className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500"
                    >
                      Merge from descriptions
                    </button>
                    <button
                      type="button"
                      onClick={resetCard}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                    >
                      Reset card
                    </button>
                  </div>
                </div>

                <AddFieldForm
                  pathCatalog={pathCatalog}
                  selectedRaw={selectedRaw}
                  onAdd={(fullPath, value) =>
                    addFieldForCard(selectedId, fullPath, value)
                  }
                />

                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Fields
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Use the switch to include or remove a path.{" "}
                    <span className="text-zinc-600">
                      ▼ collapses nested fields.
                    </span>{" "}
                    Edit scalars inline; objects and arrays use the JSON editor.
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

                <details className="rounded-xl border border-zinc-800/60 bg-zinc-900/20">
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
                      onClick={applyJson}
                      className="mt-2 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-600"
                    >
                      Replace card from JSON
                    </button>
                  </div>
                </details>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 py-24 text-center text-sm text-zinc-500">
                Select a card to edit fields.
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className="flex max-h-[min(52vh,28rem)] w-full shrink-0 flex-col overflow-hidden border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm sm:border-t lg:max-h-none lg:min-h-0 lg:w-52 lg:self-stretch lg:border-l lg:border-t-0 xl:w-56">
        <div className="shrink-0 space-y-2 border-b border-zinc-800/80 p-3 lg:pt-6">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Path catalog
            </h2>
            {pathFilters.size > 0 ? (
              <button
                type="button"
                onClick={clearPathFilters}
                className="shrink-0 rounded-md border border-zinc-700 bg-zinc-900/80 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              >
                Clear ({pathFilters.size})
              </button>
            ) : null}
          </div>
          <input
            type="search"
            value={tagListFilter}
            onChange={(e) => setTagListFilter(e.target.value)}
            placeholder="Filter paths…"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-2 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-teal-700/50 focus:outline-none"
          />
        </div>
        <ul className="fm-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2 pb-2">
          {filteredPathCatalog.map((pathStr) => {
            const active = pathFilters.has(pathStr);
            return (
              <li key={pathStr}>
                <button
                  type="button"
                  title={pathStr}
                  aria-pressed={active}
                  onClick={() => togglePathFilter(pathStr)}
                  className={`flex w-full items-start rounded-lg px-2 py-2 text-left font-mono text-[10px] leading-snug transition-colors ${
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
        <p className="shrink-0 border-t border-zinc-800/80 p-2 text-[10px] text-zinc-600">
          {filteredPathCatalog.length} / {pathCatalog.length}
        </p>
      </aside>
    </div>
  );
}

