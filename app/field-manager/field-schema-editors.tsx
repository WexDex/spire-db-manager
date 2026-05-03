"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  childKeysMerged,
  getAtPath,
  hasPath,
  isPlainObject,
} from "@/lib/sts-field-paths";

function typeLabel(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "object") return "object";
  return typeof v;
}

/** Row matches filter if equal, or one path extends the other (ancestor/descendant). */
function pathMatchesAnyFilter(pathStr: string, filters: Set<string>): boolean {
  if (filters.size === 0) return false;
  for (const f of filters) {
    if (
      pathStr === f ||
      pathStr.startsWith(`${f}.`) ||
      f.startsWith(`${pathStr}.`)
    )
      return true;
  }
  return false;
}

function LeafValueEditor({
  pathStr,
  value,
  disabled,
  onCommit,
}: {
  pathStr: string;
  value: unknown;
  disabled: boolean;
  onCommit: (v: unknown) => void;
}) {
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"auto" | "json">("auto");

  /* eslint-disable react-hooks/set-state-in-effect -- sync draft when path/value changes */
  useEffect(() => {
    if (value === null) setDraft("null");
    else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    )
      setDraft(String(value));
    else setDraft(JSON.stringify(value, null, 2));
  }, [pathStr, value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (disabled) {
    return (
      <span className="text-xs text-zinc-600">
        {value === undefined ? "—" : JSON.stringify(value)}
      </span>
    );
  }

  if (value === null) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-zinc-800 px-2 py-1 font-mono text-[10px] text-zinc-400">
          null
        </span>
        <button
          type="button"
          onClick={() => onCommit(false)}
          className="text-[10px] text-teal-500 hover:text-teal-400"
        >
          → false
        </button>
        <button
          type="button"
          onClick={() => onCommit("")}
          className="text-[10px] text-teal-500 hover:text-teal-400"
        >
          → &quot;&quot;
        </button>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onCommit(!value)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          value ? "bg-emerald-600" : "bg-zinc-700"
        } disabled:opacity-40`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            value ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    );
  }

  if (typeof value === "number" && mode === "auto") {
    return (
      <input
        type="number"
        value={draft === "" ? String(value) : draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const n = Number(draft);
          if (!Number.isNaN(n) && n !== value) onCommit(n);
        }}
        className="h-8 w-full min-w-[5rem] max-w-[10rem] rounded-md border border-zinc-600/80 bg-zinc-900/90 px-2 font-mono text-xs text-zinc-100 focus:border-teal-500/70 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
      />
    );
  }

  if (typeof value === "string" && mode === "auto" && value.length < 120) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onCommit(draft);
        }}
        className="h-8 w-full min-w-0 flex-1 rounded-md border border-zinc-600/80 bg-zinc-900/90 px-2 font-mono text-xs text-zinc-100 focus:border-teal-500/70 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
      />
    );
  }

  if (
    typeof value === "string" &&
    mode === "auto" &&
    value.length >= 120
  ) {
    return (
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onCommit(draft);
        }}
        rows={3}
        className="w-full min-w-0 resize-y rounded-md border border-zinc-600/80 bg-zinc-900/90 px-2 py-1.5 font-mono text-xs text-zinc-100 focus:border-teal-500/70 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode(mode === "json" ? "auto" : "json")}
          className="rounded-md border border-zinc-600 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400 hover:text-zinc-200"
        >
          {mode === "json" ? "Simple" : "JSON"}
        </button>
        {value === null ? (
          <button
            type="button"
            onClick={() => onCommit("")}
            className="text-[10px] text-zinc-500 hover:text-zinc-300"
          >
            Set to empty string
          </button>
        ) : null}
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={mode === "json" ? 5 : 3}
        spellCheck={false}
        className="w-full min-w-0 resize-y rounded-md border border-zinc-600/80 bg-zinc-950/90 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-zinc-200 focus:border-teal-500/70 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
      />
      <button
        type="button"
        onClick={() => {
          try {
            const parsed = JSON.parse(draft) as unknown;
            onCommit(parsed);
          } catch {
            onCommit(draft);
          }
        }}
        className="self-start rounded-md bg-teal-700/90 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-teal-600"
      >
        Apply value
      </button>
    </div>
  );
}

export function FieldEditorTree({
  parentPath,
  depth,
  pathCatalog,
  selectedRaw,
  onSetPath,
  onSetValue,
  onRenameLeaf,
  collapsedBranches,
  onToggleBranch,
  pathFilters,
}: {
  parentPath: string;
  depth: number;
  pathCatalog: string[];
  selectedRaw: Record<string, unknown>;
  onSetPath: (pathStr: string, present: boolean) => void;
  onSetValue: (pathStr: string, value: unknown) => void;
  onRenameLeaf: (pathStr: string, newLeaf: string) => void;
  collapsedBranches: Set<string>;
  onToggleBranch: (pathStr: string) => void;
  pathFilters: Set<string>;
}) {
  const childKeys = useMemo(
    () => childKeysMerged(parentPath, pathCatalog, selectedRaw),
    [parentPath, pathCatalog, selectedRaw],
  );

  const [renameOpen, setRenameOpen] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  if (childKeys.length === 0) return null;

  return (
    <ul
      className={
        depth > 0
          ? "mt-2 space-y-1 border-l border-teal-900/40 pl-3"
          : "space-y-2"
      }
    >
      {childKeys.map((key) => {
        const pathStr = parentPath ? `${parentPath}.${key}` : key;
        const parts = pathStr.split(".").filter(Boolean);
        const value = getAtPath(selectedRaw, parts);
        const exists = value !== undefined;
        const isNestedObject = isPlainObject(value) && !Array.isArray(value);
        const isArr = Array.isArray(value);
        const protectedPath = pathStr === "id";
        const hasChildren =
          childKeysMerged(pathStr, pathCatalog, selectedRaw).length > 0;
        const showBranchToggle = exists && hasChildren;
        const branchCollapsed = collapsedBranches.has(pathStr);
        const canEditValue =
          exists &&
          !isNestedObject &&
          !isArr &&
          (typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean");

        const showJsonEditor =
          exists &&
          (isNestedObject ||
            isArr ||
            value === null ||
            (!canEditValue && !protectedPath));

        const filterHighlight =
          pathFilters.size > 0 && pathMatchesAnyFilter(pathStr, pathFilters);

        return (
          <li key={pathStr}>
            <div
              className={`rounded-lg border px-3 py-2.5 transition-colors ${
                filterHighlight
                  ? "border-sky-500/55 bg-sky-950/35 ring-1 ring-sky-500/30"
                  : exists
                    ? "border-zinc-700/80 bg-zinc-900/35"
                    : "border-zinc-800/60 border-dashed bg-zinc-950/20"
              }`}
            >
              <div className="flex flex-wrap items-start gap-2 sm:gap-3">
                {showBranchToggle ? (
                  <button
                    type="button"
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-600/80 bg-zinc-800/60 text-zinc-400 transition-colors hover:border-teal-700/50 hover:bg-zinc-800 hover:text-teal-200/90"
                    aria-expanded={!branchCollapsed}
                    aria-label={
                      branchCollapsed
                        ? `Expand fields under ${pathStr}`
                        : `Collapse fields under ${pathStr}`
                    }
                    onClick={() => onToggleBranch(pathStr)}
                  >
                    <span
                      className={`inline-block text-[10px] leading-none transition-transform ${
                        branchCollapsed ? "-rotate-90" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                ) : (
                  <span
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0"
                    aria-hidden
                  />
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={exists}
                  disabled={protectedPath}
                  onClick={() => onSetPath(pathStr, !exists)}
                  className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
                    exists ? "bg-teal-600" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      exists ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="break-all text-xs font-medium text-zinc-200">
                      {pathStr}
                    </code>
                    {exists ? (
                      <span className="rounded-md bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                        {typeLabel(value)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-600">off</span>
                    )}
                    {protectedPath ? (
                      <span className="text-[10px] text-amber-600/90">
                        locked
                      </span>
                    ) : null}
                  </div>

                  {exists && !protectedPath ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {renameOpen === pathStr ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            className="h-7 w-32 rounded border border-zinc-600 bg-zinc-950 px-2 font-mono text-xs text-zinc-100"
                            placeholder="new name"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onRenameLeaf(pathStr, renameDraft);
                              setRenameOpen(null);
                            }}
                            className="rounded-md bg-zinc-700 px-2 py-1 text-[10px] text-zinc-100 hover:bg-zinc-600"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenameOpen(null)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRenameOpen(pathStr);
                            setRenameDraft(parts[parts.length - 1] ?? "");
                          }}
                          className="text-[10px] font-medium text-teal-500/90 hover:text-teal-400"
                        >
                          Rename key
                        </button>
                      )}
                    </div>
                  ) : null}

                  {exists && canEditValue ? (
                    <LeafValueEditor
                      pathStr={pathStr}
                      value={value}
                      disabled={protectedPath}
                      onCommit={(v) => onSetValue(pathStr, v)}
                    />
                  ) : null}

                  {exists && showJsonEditor && !protectedPath ? (
                    <div className="rounded-md border border-zinc-800/80 bg-black/20 p-2">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                        Value (JSON)
                      </p>
                      <LeafValueEditor
                        pathStr={pathStr}
                        value={value}
                        disabled={false}
                        onCommit={(v) => onSetValue(pathStr, v)}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {exists && hasChildren && !branchCollapsed ? (
                <FieldEditorTree
                  parentPath={pathStr}
                  depth={depth + 1}
                  pathCatalog={pathCatalog}
                  selectedRaw={selectedRaw}
                  onSetPath={onSetPath}
                  onSetValue={onSetValue}
                  onRenameLeaf={onRenameLeaf}
                  collapsedBranches={collapsedBranches}
                  onToggleBranch={onToggleBranch}
                  pathFilters={pathFilters}
                />
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function allParentPrefixesFromCatalog(paths: string[]): string[] {
  const set = new Set<string>();
  for (const p of paths) {
    const parts = p.split(".").filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      set.add(parts.slice(0, i).join("."));
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function immediateChildSegments(parent: string, paths: string[]): string[] {
  const p = parent.trim();
  const prefix = p ? `${p}.` : "";
  const seen = new Set<string>();
  for (const path of paths) {
    if (prefix) {
      if (!path.startsWith(prefix)) continue;
      const rest = path.slice(prefix.length);
      const seg = rest.split(".")[0];
      if (seg) seen.add(seg);
    } else {
      const seg = path.split(".")[0];
      if (seg) seen.add(seg);
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

function frequentTopLevelParents(paths: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const p of paths) {
    const top = p.split(".")[0];
    if (top) counts.set(top, (counts.get(top) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([k]) => k);
}

function keysAtParentInRaw(
  raw: Record<string, unknown>,
  parent: string,
): string[] {
  const p = parent.trim();
  if (!p) return Object.keys(raw).sort((a, b) => a.localeCompare(b));
  const parts = p.split(".").filter(Boolean);
  const v = getAtPath(raw, parts);
  if (isPlainObject(v) && !Array.isArray(v))
    return Object.keys(v).sort((a, b) => a.localeCompare(b));
  return [];
}

export function AddFieldForm({
  onAdd,
  pathCatalog,
  selectedRaw,
}: {
  onAdd: (fullPath: string, value: unknown) => void;
  pathCatalog: string[];
  selectedRaw: Record<string, unknown>;
}) {
  const parentListId = useId();
  const keyListId = useId();
  const parentInputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  const [parentPath, setParentPath] = useState("");
  const [keyName, setKeyName] = useState("");
  const [kind, setKind] = useState<
    "string" | "number" | "boolean" | "object" | "array" | "null"
  >("string");
  const [strVal, setStrVal] = useState("");
  const [numVal, setNumVal] = useState("0");

  const parentSuggestions = useMemo(
    () => allParentPrefixesFromCatalog(pathCatalog),
    [pathCatalog],
  );

  const quickParents = useMemo(
    () => frequentTopLevelParents(pathCatalog, 10),
    [pathCatalog],
  );

  const keySuggestions = useMemo(() => {
    const fromCatalog = immediateChildSegments(parentPath, pathCatalog);
    const fromRaw = keysAtParentInRaw(selectedRaw, parentPath);
    return [...new Set([...fromCatalog, ...fromRaw])].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [parentPath, pathCatalog, selectedRaw]);

  const trimmedKey = keyName.trim().replace(/\./g, "");
  const previewFull = trimmedKey
    ? parentPath.trim()
      ? `${parentPath.trim()}.${trimmedKey}`
      : trimmedKey
    : "—";

  const pathAlreadyPresent =
    trimmedKey.length > 0 &&
    hasPath(
      selectedRaw,
      (parentPath.trim() ? `${parentPath.trim()}.${trimmedKey}` : trimmedKey)
        .split(".")
        .filter(Boolean),
    );

  const submit = useCallback(() => {
    const k = keyName.trim().replace(/\./g, "");
    if (!k) return;
    const parent = parentPath.trim();
    let v: unknown;
    switch (kind) {
      case "string":
        v = strVal;
        break;
      case "number":
        v = Number(numVal);
        if (Number.isNaN(v)) v = 0;
        break;
      case "boolean":
        v = strVal === "true" || strVal === "1";
        break;
      case "object":
        v = {};
        break;
      case "array":
        v = [];
        break;
      case "null":
        v = null;
        break;
      default:
        v = strVal;
    }
    const full = parent ? `${parent}.${k}` : k;
    onAdd(full, v);
    setKeyName("");
    setStrVal("");
    setNumVal("0");
    requestAnimationFrame(() => keyInputRef.current?.focus());
  }, [keyName, parentPath, kind, strVal, numVal, onAdd]);

  return (
    <div className="rounded-xl border border-dashed border-teal-800/50 bg-gradient-to-br from-teal-950/20 to-zinc-950/40 p-4 shadow-inner shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-zinc-200">Add field</h4>
          <p className="mt-1 max-w-prose text-[11px] leading-relaxed text-zinc-500">
            Pick a parent from suggestions or type a path. The field name is one
            segment (no dots).{" "}
            <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px] text-zinc-400">
              Enter
            </kbd>{" "}
            in the parent box focuses the name; in the name box it adds the
            field.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 text-right">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-600">
            Preview path
          </p>
          <p className="mt-0.5 font-mono text-xs text-teal-200/90 break-all">
            {previewFull}
          </p>
          {pathAlreadyPresent ? (
            <p className="mt-1 text-[10px] text-amber-400/95">
              Already on this card — add will replace / merge that path.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Parent path
            </span>
            <input
              ref={parentInputRef}
              type="text"
              name="add-field-parent"
              autoComplete="off"
              list={parentListId}
              value={parentPath}
              onChange={(e) => setParentPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  keyInputRef.current?.focus();
                }
              }}
              placeholder="Leave empty for root"
              className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-2.5 py-2.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-teal-600/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <datalist id={parentListId}>
              {parentSuggestions
                .filter((p) => p.length > 0)
                .map((p) => (
                  <option key={p} value={p} />
                ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Field name
            </span>
            <input
              ref={keyInputRef}
              type="text"
              name="add-field-key"
              autoComplete="off"
              list={keyListId}
              value={keyName}
              onChange={(e) => setKeyName(e.target.value.replace(/\./g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="e.g. notes, baseDamage"
              className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-2.5 py-2.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-teal-600/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <datalist id={keyListId}>
              {keySuggestions.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </label>
        </div>

        {quickParents.length > 0 ? (
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
              Quick parent
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setParentPath("");
                  parentInputRef.current?.focus();
                }}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  parentPath.trim() === ""
                    ? "border-teal-600/60 bg-teal-950/50 text-teal-100"
                    : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                Root
              </button>
              {quickParents.map((seg) => (
                <button
                  key={seg}
                  type="button"
                  onClick={() => {
                    setParentPath(seg);
                    requestAnimationFrame(() => keyInputRef.current?.focus());
                  }}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium transition-colors ${
                    parentPath.trim() === seg
                      ? "border-teal-600/60 bg-teal-950/50 text-teal-100"
                      : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  {seg}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-zinc-800/60 pt-4">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Type
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 focus:border-teal-600/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Empty object</option>
            <option value="array">Empty array</option>
            <option value="null">Null</option>
          </select>
        </label>
        {kind === "string" || kind === "boolean" ? (
          <label className="flex min-w-[8rem] flex-1 flex-col gap-1 sm:max-w-xs">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {kind === "boolean" ? "True / false" : "Value"}
            </span>
            {kind === "boolean" ? (
              <select
                value={strVal}
                onChange={(e) => setStrVal(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 focus:border-teal-600/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            ) : (
              <input
                value={strVal}
                onChange={(e) => setStrVal(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 focus:border-teal-600/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            )}
          </label>
        ) : null}
        {kind === "number" ? (
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Value
            </span>
            <input
              type="number"
              value={numVal}
              onChange={(e) => setNumVal(e.target.value)}
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 focus:border-teal-600/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </label>
        ) : null}
        <button
          type="button"
          onClick={submit}
          disabled={!trimmedKey}
          title={!trimmedKey ? "Enter a field name" : undefined}
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          Add to card
        </button>
      </div>
    </div>
  );
}
