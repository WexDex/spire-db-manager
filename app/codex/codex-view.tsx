"use client";

import { useMemo, useState } from "react";
import type { CodexCard } from "@/lib/codex-card-types";
import { CodexDetailPanel } from "./codex-detail-panel";

function previewText(text: string): string {
  if (!text) return "";
  return text.replace(/\n/g, " ").trim();
}

/** Collect JSON field names (shallow + one nested level + array item keys) for tag search. */
function collectRawFieldKeys(obj: unknown, depth = 0): string[] {
  if (obj === null || obj === undefined) return [];
  if (depth > 3) return [];
  if (typeof obj !== "object") return [];
  if (Array.isArray(obj)) {
    const keys: string[] = [];
    for (const item of obj) keys.push(...collectRawFieldKeys(item, depth + 1));
    return keys;
  }
  const o = obj as Record<string, unknown>;
  const keys: string[] = [];
  for (const k of Object.keys(o)) {
    keys.push(k);
    const v = o[k];
    if (v && typeof v === "object") {
      if (Array.isArray(v)) {
        for (const item of v) keys.push(...collectRawFieldKeys(item, depth + 1));
      } else {
        keys.push(...Object.keys(v as Record<string, unknown>));
      }
    }
  }
  return keys;
}

function parseFieldTagTokens(tagQuery: string): string[] {
  return tagQuery
    .split(/[,;]+|\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function cardMatchesFieldTags(raw: Record<string, unknown>, tagQuery: string): boolean {
  const tokens = parseFieldTagTokens(tagQuery);
  if (tokens.length === 0) return true;
  const keys = collectRawFieldKeys(raw);
  const keyHay = keys.map((k) => k.toLowerCase());

  const tokenMatches = (token: string) =>
    keyHay.some((k) => k.includes(token.toLowerCase()));

  return tokens.every(tokenMatches);
}

function uniqSortedFieldKeys(entries: CodexCard[]): string[] {
  const s = new Set<string>();
  for (const e of entries) {
    for (const k of collectRawFieldKeys(e.raw)) s.add(k);
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

function toggleFieldTagToken(prev: string, key: string): string {
  const tokens = parseFieldTagTokens(prev);
  const lower = key.toLowerCase();
  const i = tokens.findIndex((t) => t.toLowerCase() === lower);
  if (i >= 0) {
    tokens.splice(i, 1);
  } else {
    tokens.push(key);
  }
  return tokens.join(" ");
}

function tokenListHasExactField(tokens: string[], key: string): boolean {
  const lower = key.toLowerCase();
  return tokens.some((t) => t.toLowerCase() === lower);
}

/** Top-level JSON keys for card chips (hide long text fields already in the body). */
const SKIP_CARD_FIELD_CHIP_KEYS = new Set([
  "description",
  "descriptionUpgraded",
]);

function cardDisplayFieldKeys(raw: Record<string, unknown>): string[] {
  return Object.keys(raw)
    .filter((k) => !SKIP_CARD_FIELD_CHIP_KEYS.has(k))
    .sort((a, b) => a.localeCompare(b));
}

function fieldKeyMatchesFilterToken(key: string, token: string): boolean {
  return key.toLowerCase().includes(token.toLowerCase());
}

const toggleInactive =
  "border border-transparent bg-zinc-900/70 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200";

const toggleActive =
  "border border-zinc-500 bg-zinc-800 text-zinc-100 shadow-inner";

/** Outer card shell tint by character (Ironclad, Silent, … section). */
function characterCardShell(character: string): string {
  const c = character.toLowerCase();
  const map: Record<string, string> = {
    ironclad:
      "border-red-900/50 bg-gradient-to-br from-red-950/55 to-zinc-950/90 hover:border-red-700/55 hover:from-red-950/70",
    silent:
      "border-emerald-900/50 bg-gradient-to-br from-emerald-950/45 to-zinc-950/90 hover:border-emerald-700/50 hover:from-emerald-950/60",
    defect:
      "border-sky-900/50 bg-gradient-to-br from-sky-950/45 to-zinc-950/90 hover:border-sky-700/50 hover:from-sky-950/60",
    watcher:
      "border-violet-900/50 bg-gradient-to-br from-violet-950/45 to-zinc-950/90 hover:border-violet-700/50 hover:from-violet-950/60",
    colorless:
      "border-zinc-600/50 bg-gradient-to-br from-zinc-900/60 to-zinc-950/90 hover:border-zinc-500/60",
    curse:
      "border-zinc-900/80 bg-gradient-to-br from-black via-zinc-950 to-black/90 hover:border-zinc-600/90",
    status:
      "border-zinc-600/40 bg-gradient-to-br from-zinc-800/80 to-zinc-950/95 hover:border-zinc-500/50",
  };
  return (
    map[c] ??
    "border-zinc-700/60 bg-gradient-to-br from-zinc-900/50 to-zinc-950/90 hover:border-zinc-600"
  );
}

function characterBadgeStyles(character: string): string {
  const c = character.toLowerCase();
  const map: Record<string, string> = {
    ironclad: "bg-red-900/35 text-red-200 border-red-800/55",
    silent: "bg-emerald-900/35 text-emerald-200 border-emerald-800/55",
    defect: "bg-sky-900/35 text-sky-200 border-sky-800/55",
    watcher: "bg-violet-900/35 text-violet-200 border-violet-800/55",
    colorless: "bg-zinc-800/55 text-zinc-200 border-zinc-600/60",
    curse: "bg-black/60 text-zinc-300 border-zinc-700/80",
    status: "bg-zinc-700/50 text-zinc-300 border-zinc-600/55",
  };
  return map[c] ?? "bg-zinc-800/55 text-zinc-300 border-zinc-700/60";
}

function formatCharacterLabel(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function rarityStyles(rarity: string): string {
  const r = rarity.toLowerCase();
  const map: Record<string, string> = {
    basic: "text-zinc-400",
    common: "text-zinc-300",
    uncommon: "text-green-400",
    rare: "text-blue-400",
    special: "text-amber-400",
    curse: "text-zinc-500",
  };
  return map[r] ?? "text-zinc-400";
}

type Props = { entries: CodexCard[] };

const FIELD_TAGS_DATALIST_ID = "codex-field-tags-datalist";

export function CodexView({ entries }: Props) {
  const [query, setQuery] = useState("");
  const [fieldTags, setFieldTags] = useState("");
  const [tagListFilter, setTagListFilter] = useState("");
  const [type, setType] = useState<string>("all");
  const [rarity, setRarity] = useState<string>("all");
  const [character, setCharacter] = useState<string>("all");
  const [selected, setSelected] = useState<CodexCard | null>(null);

  const { types, rarities, characters } = useMemo(() => {
    const t = new Set<string>();
    const r = new Set<string>();
    const ch = new Set<string>();
    for (const e of entries) {
      if (e.type) t.add(e.type);
      if (e.rarity) r.add(e.rarity);
      for (const pool of e.charactersList.length
        ? e.charactersList
        : e.character
          ? [e.character]
          : [])
        ch.add(pool);
    }
    return {
      types: [...t].sort((a, b) => a.localeCompare(b)),
      rarities: [...r].sort((a, b) => a.localeCompare(b)),
      characters: [...ch].sort((a, b) => a.localeCompare(b)),
    };
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (type !== "all" && e.type !== type) return false;
      if (rarity !== "all" && e.rarity !== rarity) return false;
      if (character !== "all") {
        const pools = e.charactersList.length
          ? e.charactersList
          : e.character
            ? [e.character]
            : [];
        if (!pools.includes(character)) return false;
      }
      if (!cardMatchesFieldTags(e.raw, fieldTags)) return false;
      if (q) {
        const hay = [
          e.name,
          e.id,
          e.displayKey,
          e.description,
          e.descriptionUpgraded,
          e.costLabel,
          JSON.stringify(e.raw),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, query, fieldTags, type, rarity, character]);

  const byType = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      const k = e.type ?? "?";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const maxType = byType[0]?.[1] ?? 1;

  const allFieldKeys = useMemo(() => uniqSortedFieldKeys(entries), [entries]);

  const filteredFieldKeys = useMemo(() => {
    const q = tagListFilter.trim().toLowerCase();
    if (!q) return allFieldKeys;
    return allFieldKeys.filter((k) => k.toLowerCase().includes(q));
  }, [allFieldKeys, tagListFilter]);

  const fieldTagTokens = useMemo(
    () => parseFieldTagTokens(fieldTags),
    [fieldTags],
  );

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Spire codex
          </h1>
          <p className="max-w-xl text-sm text-zinc-500">
            {entries.length} cards from{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-300">
              sts-planner-reworked/app/data/STS_CARDS_DB.json
            </code>
            . Click a card for full structured data.
          </p>
        </header>

        <section className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 sm:p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Cards by type
          </h2>
          <div className="flex flex-col gap-2">
            {byType.map(([label, count]) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-zinc-400">{label}</span>
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-sky-600/90"
                    style={{ width: `${(count / maxType) * 100}%` }}
                    title={`${label}: ${count}`}
                  />
                </div>
                <span className="w-10 shrink-0 text-right tabular-nums text-zinc-500">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-5">
              <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium text-zinc-500">Search</span>
                <input
                  type="search"
                  value={query}
                  onChange={(ev) => setQuery(ev.target.value)}
                  placeholder="Name, id, text, cost…"
                  className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600/40"
                />
              </label>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium text-zinc-500">
                  Fields / tags{" "}
                  <span className="font-normal text-zinc-600">
                    (substring match on JSON keys)
                  </span>
                </span>
                <input
                  type="search"
                  value={fieldTags}
                  onChange={(ev) => setFieldTags(ev.target.value)}
                  placeholder="draw exhaust discardEffect…"
                  list={FIELD_TAGS_DATALIST_ID}
                  autoComplete="off"
                  className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600/40"
                />
                <datalist id={FIELD_TAGS_DATALIST_ID}>
                  {allFieldKeys.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>
              </div>
              <div className="shrink-0 border-t border-zinc-800/80 pt-2 lg:border-t-0 lg:pt-0 lg:text-right">
                <p className="text-sm tabular-nums text-zinc-400">
                  Found{" "}
                  <span className="font-semibold text-zinc-100">
                    {filtered.length}
                  </span>{" "}
                  out of{" "}
                  <span className="font-medium text-zinc-300">
                    {entries.length}
                  </span>{" "}
                  cards
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950/80">
              <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 px-2 py-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
                  Field list
                </span>
                <input
                  type="search"
                  value={tagListFilter}
                  onChange={(ev) => setTagListFilter(ev.target.value)}
                  placeholder="Filter list…"
                  aria-label="Filter field name list"
                  className="min-w-[8rem] flex-1 rounded border border-zinc-800 bg-zinc-900/90 px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
                <span className="text-[11px] tabular-nums text-zinc-600">
                  {filteredFieldKeys.length}/{allFieldKeys.length} fields
                </span>
              </div>
              <div
                role="listbox"
                aria-label="Select field keys to require"
                aria-multiselectable
                className="max-h-44 overflow-y-auto p-2"
              >
                <ul className="grid grid-cols-1 gap-0.5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredFieldKeys.map((key) => {
                    const on = tokenListHasExactField(fieldTagTokens, key);
                    return (
                      <li key={key} className="min-w-0">
                        <button
                          type="button"
                          role="option"
                          aria-selected={on}
                          title={key}
                          onClick={() =>
                            setFieldTags((prev) =>
                              toggleFieldTagToken(prev, key),
                            )
                          }
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left font-mono text-xs transition-colors ${
                            on
                              ? "bg-sky-950/60 text-sky-100 ring-1 ring-inset ring-sky-700/50"
                              : "text-zinc-400 hover:bg-zinc-900/90 hover:text-zinc-200"
                          }`}
                        >
                          <span
                            className={`h-3.5 w-3.5 shrink-0 rounded border ${
                              on
                                ? "border-sky-500 bg-sky-600"
                                : "border-zinc-600 bg-zinc-900"
                            }`}
                            aria-hidden
                          />
                          <span className="min-w-0 truncate">{key}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {filteredFieldKeys.length === 0 && (
                  <p className="py-4 text-center text-xs text-zinc-500">
                    No field names match this filter.
                  </p>
                )}
              </div>
            </div>

            <span className="text-[11px] leading-snug text-zinc-600">
              Tokens are AND&apos;ed; each matches a substring on a JSON key. The
              list toggles whole keys onto the query. Quick:{" "}
              <button
                type="button"
                className="text-sky-500/90 underline-offset-2 hover:underline"
                onClick={() => setFieldTags("draw discard")}
              >
                draw discard
              </button>
              ,{" "}
              <button
                type="button"
                className="text-sky-500/90 underline-offset-2 hover:underline"
                onClick={() => setFieldTags("exhaust")}
              >
                exhaust
              </button>
              , orb.
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Filters
            </p>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-zinc-500">Type</span>
                <div
                  role="group"
                  aria-label="Filter by card type"
                  className="flex min-w-0 flex-1 flex-wrap gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setType("all")}
                    aria-pressed={type === "all"}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      type === "all" ? toggleActive : toggleInactive
                    }`}
                  >
                    All
                  </button>
                  {types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      aria-pressed={type === t}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        type === t ? toggleActive : toggleInactive
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-zinc-500">
                  Rarity
                </span>
                <div
                  role="group"
                  aria-label="Filter by rarity"
                  className="flex min-w-0 flex-1 flex-wrap gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setRarity("all")}
                    aria-pressed={rarity === "all"}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      rarity === "all" ? toggleActive : toggleInactive
                    }`}
                  >
                    All
                  </button>
                  {rarities.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRarity(r)}
                      aria-pressed={rarity === r}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        rarity === r ? toggleActive : toggleInactive
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-zinc-500">Pool</span>
                <div
                  role="group"
                  aria-label="Filter by character pool"
                  className="flex min-w-0 flex-1 flex-wrap gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setCharacter("all")}
                    aria-pressed={character === "all"}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      character === "all" ? toggleActive : toggleInactive
                    }`}
                  >
                    All
                  </button>
                  {characters.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCharacter(c)}
                      aria-pressed={character === c}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        character === c ? toggleActive : toggleInactive
                      }`}
                    >
                      {formatCharacterLabel(c)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((card) => {
            const ch = card.character ?? "";
            const isOpen = selected?.id === card.id;
            const schemaKeys = cardDisplayFieldKeys(card.raw);
            const maxChips = 14;
            const chipKeys = schemaKeys.slice(0, maxChips);
            const extraKeys = schemaKeys.length - chipKeys.length;
            return (
              <li key={card.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setSelected(card)}
                  className={`cursor-pointer flex w-full flex-col gap-2 rounded-xl border p-4 text-left shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${characterCardShell(ch)} ${
                    isOpen
                      ? "ring-2 ring-sky-500/90 ring-offset-2 ring-offset-zinc-950"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-zinc-100">{card.name}</h3>
                      <p className="truncate font-mono text-xs text-zinc-500">
                        {card.displayKey}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border border-zinc-700/80 bg-black/20 px-2 py-0.5 text-xs tabular-nums text-zinc-200">
                      {card.costLabel || "—"}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400">
                    {previewText(card.description ?? "") || "—"}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {card.character ? (
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs ${characterBadgeStyles(card.character)}`}
                      >
                        {formatCharacterLabel(card.character)}
                      </span>
                    ) : null}
                    {card.rarity ? (
                      <span
                        className={`text-xs font-medium capitalize ${rarityStyles(card.rarity)}`}
                      >
                        {card.rarity}
                      </span>
                    ) : null}
                    {card.type ? (
                      <span className="text-xs text-zinc-500">{card.type}</span>
                    ) : null}
                  </div>
                  {chipKeys.length > 0 ? (
                    <div
                      className="flex flex-wrap gap-1 border-t border-zinc-800/30 pt-2"
                      title={schemaKeys.join(", ")}
                    >
                      {chipKeys.map((fk) => {
                        const matchesQuery = fieldTagTokens.some((t) =>
                          fieldKeyMatchesFilterToken(fk, t),
                        );
                        return (
                          <span
                            key={fk}
                            className={`max-w-full truncate rounded border px-1.5 py-0.5 font-mono text-[10px] leading-tight ${
                              matchesQuery
                                ? "border-sky-600/55 bg-sky-950/50 text-sky-100 ring-1 ring-sky-600/35"
                                : "border-zinc-700/60 bg-black/25 text-zinc-500"
                            }`}
                          >
                            {fk}
                          </span>
                        );
                      })}
                      {extraKeys > 0 ? (
                        <span className="rounded border border-zinc-700/50 px-1.5 py-0.5 font-mono text-[10px] leading-tight text-zinc-500">
                          +{extraKeys}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-500">
            No cards match your filters.
          </p>
        )}
      </div>

      <CodexDetailPanel card={selected} onClose={() => setSelected(null)} />
    </>
  );
}
