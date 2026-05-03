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

const CARD_WORKBENCH_UI_STATE_STORAGE_KEY =
  "spire-card-workbench-cards-ui-state-v1";
import { RunthroughCardReference } from "@/lib/runthrough-card-preview";
import {
  globalPathCatalog,
  renameLeafAtPath,
  setLeafValue,
  setPathPresent,
} from "@/lib/sts-field-paths";
import { enrichFromDescriptions } from "@/lib/sts-description-enrichment";
import { AddFieldForm, FieldEditorTree } from "../../field-manager/field-schema-editors";

const EDITOR_ANCHOR_ID = "cw-field-editor-anchor";

function isTypingTarget(t: EventTarget | null): boolean {
  return (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement ||
    (t instanceof HTMLElement && t.isContentEditable)
  );
}

type EditorsBlockProps = {
  pathCatalog: string[];
  filteredPathCatalog: string[];
  tagListFilter: string;
  onTagFilter: (v: string) => void;
  pathFilters: Set<string>;
  onTogglePathFilter: (pathStr: string) => void;
  onClearPathFilters: () => void;
  selectedRaw: Record<string, unknown>;
  collapsedBranches: Set<string>;
  onToggleBranch: (pathStr: string) => void;
  onAddField: (fullPath: string, value: unknown) => void;
  onSetPath: (pathStr: string, present: boolean) => void;
  onSetValue: (pathStr: string, value: unknown) => void;
  onRenameLeaf: (pathStr: string, newLeaf: string) => void;
  jsonText: string;
  onJsonText: (v: string) => void;
  jsonErr: string | null;
  onApplyJson: () => void;
  /** Wider split for tree + JSON when inline on large screens */
  wideJsonSplit: boolean;
};

type CardWorkbenchUiState = {
  selectedIndex?: number;
  tagListFilter?: string;
  pathFilters?: string[];
  fieldBranchesCollapsed?: string[];
  editorsInline?: boolean;
  rightRailOpen?: boolean;
  editorDrawerOpen?: boolean;
};

function CardWorkbenchEditorBlock({
  pathCatalog,
  filteredPathCatalog,
  tagListFilter,
  onTagFilter,
  pathFilters,
  onTogglePathFilter,
  onClearPathFilters,
  selectedRaw,
  collapsedBranches,
  onToggleBranch,
  onAddField,
  onSetPath,
  onSetValue,
  onRenameLeaf,
  jsonText,
  onJsonText,
  jsonErr,
  onApplyJson,
  wideJsonSplit,
}: EditorsBlockProps) {
  return (
    <>
      <details className="shrink-0 rounded-xl border border-zinc-800/80 bg-zinc-950/40">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-zinc-300 marker:content-none sm:px-4 [&::-webkit-details-marker]:hidden">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Path catalog
          </span>
          <span className="ml-2 font-normal text-zinc-600">
            — click paths to highlight (
            {filteredPathCatalog.length}/{pathCatalog.length} shown)
          </span>
        </summary>
        <div className="border-t border-zinc-800/80 px-3 pb-3 pt-2 sm:px-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/60 pb-3">
            {pathFilters.size > 0 ? (
              <button
                type="button"
                onClick={onClearPathFilters}
                className="shrink-0 rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-[10px] font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              >
                Clear filters ({pathFilters.size})
              </button>
            ) : null}
            <input
              type="search"
              value={tagListFilter}
              onChange={(e) => onTagFilter(e.target.value)}
              placeholder="Filter path list…"
              className="min-w-[12rem] flex-1 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-teal-700/50 focus:outline-none"
            />
          </div>
          <ul className="fm-scrollbar mt-2 max-h-52 space-y-0.5 overflow-y-auto overscroll-contain">
            {filteredPathCatalog.map((pathStr) => {
              const active = pathFilters.has(pathStr);
              return (
                <li key={pathStr}>
                  <button
                    type="button"
                    title={pathStr}
                    aria-pressed={active}
                    onClick={() => onTogglePathFilter(pathStr)}
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
        onAdd={(fullPath, value) => onAddField(fullPath, value)}
      />

      <div
        className={
          wideJsonSplit ?
            "xl:grid xl:min-h-0 xl:grid-cols-[1fr_minmax(280px,1fr)] xl:gap-4 xl:items-start"
          : ""
        }
      >
        <div id={EDITOR_ANCHOR_ID} className={wideJsonSplit ? "min-h-0" : ""}>
          <h3 className="scroll-mt-36 text-sm font-semibold text-zinc-200">
            Fields
          </h3>
          <p className="mt-1 text-[11px] text-zinc-500">
            Tree edits apply immediately.
          </p>
          <div className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3 sm:p-4">
            <FieldEditorTree
              parentPath=""
              depth={0}
              pathCatalog={pathCatalog}
              selectedRaw={selectedRaw}
              onSetPath={onSetPath}
              onSetValue={onSetValue}
              onRenameLeaf={onRenameLeaf}
              collapsedBranches={collapsedBranches}
              onToggleBranch={onToggleBranch}
              pathFilters={pathFilters}
            />
          </div>
        </div>

        <div
          className={
            wideJsonSplit ?
              "mt-6 space-y-2 xl:sticky xl:top-4 xl:mt-0 xl:max-h-[min(78dvh,calc(100dvh-8rem))] xl:flex xl:min-h-0 xl:flex-col"
            : "mt-6 space-y-2"
          }
        >
          <h3 className="text-sm font-semibold text-zinc-200">
            Full card JSON
          </h3>
          <textarea
            value={jsonText}
            spellCheck={false}
            rows={wideJsonSplit ? 18 : 12}
            className={`w-full shrink-0 rounded-lg border border-zinc-800 bg-black/45 p-3 font-mono text-[11px] text-zinc-300 focus:border-teal-800/55 focus:outline-none ${
              wideJsonSplit
                ? "xl:min-h-[14rem] xl:flex-1 xl:resize-none"
                : ""
            }`}
            onChange={(e) => onJsonText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onApplyJson();
              }
            }}
          />
          {jsonErr ?
            <p className="text-xs text-red-400">{jsonErr}</p>
          : null}
          <button
            type="button"
            onClick={onApplyJson}
            className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-600"
          >
            Apply JSON · Ctrl↵
          </button>
        </div>
      </div>
    </>
  );
}

export function CardWorkbenchCardsView({
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
    }, 280);
    return () => window.clearTimeout(t);
  }, [cardData, hydrated]);

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

  const [editorsInline, setEditorsInline] = useState(true);
  const [rightRailOpen, setRightRailOpen] = useState(true);
  const [editorDrawerOpen, setEditorDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CARD_WORKBENCH_UI_STATE_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as CardWorkbenchUiState;
      if (typeof saved.selectedIndex === "number") {
        setIndex(
          Math.min(Math.max(0, saved.selectedIndex), baselineOrder.length - 1),
        );
      }
      if (typeof saved.tagListFilter === "string") {
        setTagListFilter(saved.tagListFilter);
      }
      if (Array.isArray(saved.pathFilters)) {
        setPathFilters(new Set(saved.pathFilters));
      }
      if (Array.isArray(saved.fieldBranchesCollapsed)) {
        setFieldBranchesCollapsed(new Set(saved.fieldBranchesCollapsed));
      }
      if (typeof saved.editorsInline === "boolean") {
        setEditorsInline(saved.editorsInline);
      }
      if (typeof saved.rightRailOpen === "boolean") {
        setRightRailOpen(saved.rightRailOpen);
      }
      if (typeof saved.editorDrawerOpen === "boolean") {
        setEditorDrawerOpen(saved.editorDrawerOpen);
      }
    } catch {
      /* ignore malformed UI state */
    }
  }, [baselineOrder.length]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(
          CARD_WORKBENCH_UI_STATE_STORAGE_KEY,
          JSON.stringify({
            selectedIndex: index,
            tagListFilter,
            pathFilters: [...pathFilters],
            fieldBranchesCollapsed: [...fieldBranchesCollapsed],
            editorsInline,
            rightRailOpen,
            editorDrawerOpen,
          }),
        );
      } catch {
        /* quota */
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [index, tagListFilter, pathFilters, fieldBranchesCollapsed, editorsInline, rightRailOpen, editorDrawerOpen]);

  useEffect(() => {
    if (!editorsInline) return;
    queueMicrotask(() => {
      setEditorDrawerOpen(false);
    });
  }, [editorsInline]);

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

  const goPrev = useCallback(
    () => setIndex((i) => Math.max(0, i - 1)),
    [],
  );
  const goNext = useCallback(
    () => setIndex((i) => Math.min(Math.max(0, n - 1), i + 1)),
    [n],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (n === 0) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "[") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "]") {
        e.preventDefault();
        goNext();
      } else if (e.key === "e" || e.key === "E") {
        if (!editorsInline) {
          e.preventDefault();
          setEditorDrawerOpen(true);
        }
      } else if (e.key.toLowerCase() === "f" && !e.shiftKey) {
        e.preventDefault();
        setRightRailOpen(false);
        setEditorsInline(false);
        setEditorDrawerOpen(false);
      } else if (e.key.toLowerCase() === "f" && e.shiftKey) {
        e.preventDefault();
        setRightRailOpen(true);
        setEditorsInline(true);
        setEditorDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, goNext, goPrev, editorsInline]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (editorDrawerOpen) {
        e.preventDefault();
        setEditorDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [editorDrawerOpen]);

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

  const editorProps: EditorsBlockProps | null =
    selectedId && selectedRaw ?
      {
        pathCatalog,
        filteredPathCatalog,
        tagListFilter,
        onTagFilter: setTagListFilter,
        pathFilters,
        onTogglePathFilter: togglePathFilter,
        onClearPathFilters: clearPathFilters,
        selectedRaw,
        collapsedBranches: fieldBranchesCollapsed,
        onToggleBranch: toggleFieldBranch,
        onAddField: (fullPath, value) =>
          addFieldForCard(selectedId, fullPath, value),
        onSetPath: (pathStr, present) =>
          updatePathForCard(selectedId, pathStr, present),
        onSetValue: (pathStr, v) =>
          setValueForPath(selectedId, pathStr, v),
        onRenameLeaf: (pathStr, newLeaf) =>
          renamePathForCard(selectedId, pathStr, newLeaf),
        jsonText,
        onJsonText: setJsonText,
        jsonErr,
        onApplyJson: applyJson,
        wideJsonSplit: editorsInline,
      }
    : null;

  if (!cardData || !hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-20 text-sm text-zinc-500">
        Loading card data…
      </div>
    );
  }

  const pathFilterRibbon =
    pathFilters.size > 0 ?
      <div className="mb-3 shrink-0 space-y-1.5 rounded-lg bg-teal-950/25 px-2 py-2 ring-1 ring-teal-900/40">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-200/80">
            Path highlights
          </span>
          <button
            type="button"
            className="shrink-0 text-[10px] font-medium text-teal-400 underline-offset-2 hover:underline"
            onClick={clearPathFilters}
          >
            Clear all
          </button>
        </div>
        <ul className="fm-scrollbar flex max-h-14 flex-wrap gap-1 overflow-y-auto overscroll-contain">
          {[...pathFilters].sort().map((p) => (
            <li key={p}>
              <button
                type="button"
                title={`Remove ${p}`}
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
    : null;

  function renderPreview(
    variant: "compact" | "rail" | "hero",
  ) {
    if (!liveCodexRow) return null;
    return (
      <RunthroughCardReference
        editorAnchorId={EDITOR_ANCHOR_ID}
        liveCodexRow={liveCodexRow}
        desc={descriptionStr}
        descUp={upgradedStr}
        onMergeFromDescriptions={applyEnrichment}
        variant={variant}
      />
    );
  }

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/80 lg:max-h-[calc(100dvh-3.5rem)]">
      <div className="fm-scrollbar mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5 lg:flex-row lg:items-stretch lg:gap-5 lg:overflow-hidden lg:px-6 lg:pb-5">
        <div
          className={`flex min-h-0 flex-col gap-3 lg:min-h-0 ${
            !editorsInline ?
              "flex-1 shrink-0"
            : `${rightRailOpen ? "flex-1" : "w-full flex-1 lg:max-w-none"} lg:overflow-hidden`
          }`}
        >
          <header className="shrink-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-500/80">
              Card workbench
            </p>
            <p className="text-xs text-zinc-500">
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px]">
                ←→
              </kbd>{" "}
              /{" "}
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px]">
                [ ]
              </kbd>
              Next/prev ·{" "}
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px]">
                f
              </kbd>
              Focus ·{" "}
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px]">
                Shift+f
              </kbd>
              Split ·{" "}
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px]">
                e
              </kbd>
              Drawer · Ctrl+Enter apply JSON · Esc close · localStorage ·{" "}
              <span className="font-mono text-zinc-400">
                {FIELD_MANAGER_CARD_DATA_STORAGE_KEY}
              </span>
            </p>
          </header>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setRightRailOpen(false);
                setEditorsInline(false);
                setEditorDrawerOpen(false);
              }}
              className="rounded-lg border border-amber-800/55 bg-amber-950/30 px-3 py-1.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-950/50"
              title="Card only (+ quick bar). Press e for editor drawer."
            >
              Focus <span className="font-mono text-[10px] opacity-75">f</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRightRailOpen(true);
                setEditorsInline(true);
                setEditorDrawerOpen(false);
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-900/85 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-zinc-800"
              title="Split preview rail + inline editors"
            >
              Split{" "}
              <span className="font-mono text-[10px] text-zinc-500">
                Shift+F
              </span>
            </button>
            <button
              type="button"
              onClick={goPrev}
              disabled={n === 0}
              className="rounded-lg border border-zinc-700 bg-zinc-900/85 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={n === 0}
              className="rounded-lg border border-zinc-700 bg-zinc-900/85 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
            >
              Next
            </button>
            <span className="text-[11px] tabular-nums text-zinc-500">
              {n ? index + 1 : 0}/{n}
            </span>

            {!editorsInline ?
              <button
                type="button"
                onClick={() => setEditorDrawerOpen((o) => !o)}
                className={
                  editorDrawerOpen
                    ? "rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-500"
                    : "rounded-lg border border-teal-800 bg-teal-950/55 px-3 py-1.5 text-[11px] font-semibold text-teal-50 hover:bg-teal-900/55"
                }
              >
                Editor <span className="font-mono text-[10px] opacity-80">e</span>
              </button>
            : null}

            {editorsInline ?
              <>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-400">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-600 accent-teal-600"
                    checked={editorsInline}
                    onChange={(e) => {
                      const on = e.target.checked;
                      if (on) {
                        setEditorsInline(true);
                      } else {
                        setEditorsInline(false);
                        setRightRailOpen(false);
                        setEditorDrawerOpen(true);
                      }
                    }}
                  />
                  Inline editors
                </label>
                <label
                  className={`inline-flex items-center gap-1.5 text-[11px] ${
                    editorsInline ?
                      "cursor-pointer text-zinc-400"
                    : "cursor-not-allowed text-zinc-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-zinc-600 accent-teal-600"
                    disabled={!editorsInline}
                    checked={editorsInline && rightRailOpen}
                    onChange={(e) =>
                      editorsInline ?
                        setRightRailOpen(e.target.checked)
                      : undefined
                    }
                  />
                  Preview rail
                </label>
              </>
            : (
              <button
                type="button"
                className="rounded-lg border border-zinc-700 bg-zinc-900/70 px-2.5 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800"
                onClick={() => {
                  setEditorsInline(true);
                  setEditorDrawerOpen(false);
                  setRightRailOpen(true);
                }}
              >
                Show inline editors
              </button>
            )}

            <button
              type="button"
              onClick={() => exportEditedBlob()}
              className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-900 hover:bg-white"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => resetCard()}
              className="rounded-lg border border-amber-900/45 bg-amber-950/20 px-2.5 py-1.5 text-[11px] font-medium text-amber-100/95 hover:bg-amber-950/35"
            >
              Reset card
            </button>
            <button
              type="button"
              onClick={() => resetAll()}
              className="rounded-lg border border-red-900/50 bg-red-950/25 px-2.5 py-1.5 text-[11px] font-medium text-red-200/90 hover:bg-red-950/40"
            >
              Reset all
            </button>
          </div>

          {!editorsInline && liveCodexRow ?
            <div
              className={`flex min-h-[36vh] flex-1 flex-col items-center justify-center gap-6 px-1 py-6 ${
                editorDrawerOpen ? "pointer-events-none opacity-[0.42]" : ""
              }`}
            >
              <div className="w-full max-w-lg">{renderPreview("hero")}</div>
            </div>
          : editorsInline && !rightRailOpen && liveCodexRow ?
            <div className="shrink-0 lg:hidden">{renderPreview("compact")}</div>
          : null}

          {editorsInline ?
            <div
              className={`flex min-h-0 flex-col gap-4 lg:min-h-0 ${
                rightRailOpen ?
                  "lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1"
                : "lg:flex-1 lg:overflow-y-auto"
              }`}
            >
                  {pathFilterRibbon}

                  {!rightRailOpen && liveCodexRow ?
                    <div className="hidden shrink-0 lg:block">{renderPreview("compact")}</div>
                  : null}

                  {editorProps ?
                    <CardWorkbenchEditorBlock {...editorProps} />
                  : (
                    <div className="py-16 text-center text-sm text-zinc-500">
                      No card selected.
                    </div>
                  )}
                </div>
          : null}

        </div>

        {editorsInline && rightRailOpen && liveCodexRow ?
          <aside className="fm-scrollbar hidden max-h-[calc(100dvh-5.5rem)] min-h-0 shrink-0 overflow-y-auto overscroll-contain lg:flex lg:w-[min(400px,36vw)] lg:min-w-[260px] lg:flex-col xl:max-w-md">
            <div className="rounded-xl bg-[radial-gradient(ellipse_at_top,_rgba(20,184,166,0.07),transparent_52%)] bg-zinc-950/96 px-1 py-2 sm:px-2">
              <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                Card preview · rail
              </p>
              {renderPreview("rail")}
            </div>
          </aside>
        : null}
      </div>

      {editorDrawerOpen && editorProps ?
        <>
          <button
            type="button"
            aria-label="Close editor drawer"
            className="fixed inset-0 z-40 bg-black/55 lg:bg-black/40"
            onClick={() => setEditorDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-[min(100vw,620px)] flex-col border-l border-zinc-800 bg-zinc-950 shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
              <span className="text-xs font-semibold text-zinc-200">
                Editors · Esc to close · Ctrl↵ applies JSON
              </span>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                onClick={() => setEditorDrawerOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="fm-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-10">
              {pathFilterRibbon}
              <CardWorkbenchEditorBlock
                {...editorProps}
                wideJsonSplit={false}
              />
            </div>
          </div>
        </>
      : null}
    </div>
  );
}
