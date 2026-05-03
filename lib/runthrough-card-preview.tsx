"use client";

import { useEffect, useRef, useState } from "react";
import type { CodexCard } from "@/lib/codex-card-types";

function characterCardShellFm(character: string): string {
  const c = character.toLowerCase();
  const map: Record<string, string> = {
    ironclad:
      "border-red-900/50 bg-gradient-to-br from-red-950/55 to-zinc-950/90 hover:border-red-700/55",
    silent:
      "border-emerald-900/50 bg-gradient-to-br from-emerald-950/45 to-zinc-950/90 hover:border-emerald-700/50",
    defect:
      "border-sky-900/50 bg-gradient-to-br from-sky-950/45 to-zinc-950/90 hover:border-sky-700/50",
    watcher:
      "border-violet-900/50 bg-gradient-to-br from-violet-950/45 to-zinc-950/90 hover:border-violet-700/50",
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

function characterColorBadgeFm(character: string): string {
  const c = character.toLowerCase();
  const map: Record<string, string> = {
    ironclad: "bg-red-900/45 text-red-100 border-red-700/50",
    silent: "bg-emerald-900/45 text-emerald-100 border-emerald-700/50",
    defect: "bg-sky-900/45 text-sky-100 border-sky-700/50",
    watcher: "bg-violet-900/45 text-violet-100 border-violet-700/50",
    colorless: "bg-zinc-800/60 text-zinc-100 border-zinc-600/55",
    curse: "bg-black/70 text-zinc-200 border-zinc-700/70",
    status: "bg-zinc-700/55 text-zinc-200 border-zinc-600/55",
  };
  return map[c] ?? "bg-zinc-800/55 text-zinc-200 border-zinc-700/60";
}

function rarityBadgeFm(rarity: string): string {
  const r = rarity.toLowerCase();
  const map: Record<string, string> = {
    basic: "text-zinc-300 border-zinc-600 bg-zinc-800/50",
    common: "text-zinc-200 border-zinc-600 bg-zinc-800/50",
    uncommon: "text-green-300 border-green-800/50 bg-green-950/40",
    rare: "text-blue-300 border-blue-800/50 bg-blue-950/40",
    special: "text-amber-300 border-amber-800/50 bg-amber-950/35",
    curse: "text-zinc-500 border-zinc-700 bg-zinc-900/50",
  };
  return map[r] ?? "text-zinc-300 border-zinc-600 bg-zinc-800/50";
}

type RunthroughCardReferenceProps = {
  liveCodexRow: CodexCard;
  desc: string;
  descUp: string;
  onMergeFromDescriptions: () => void;
  variant: "rail" | "compact" | "hero";
  /** Anchor id for jump link (rail variant); default field manager anchor */
  editorAnchorId?: string;
};

export function RunthroughCardReference({
  liveCodexRow,
  desc,
  descUp,
  onMergeFromDescriptions,
  variant,
  editorAnchorId = "fm-field-editor-anchor",
}: RunthroughCardReferenceProps) {
  const copyTimerRef = useRef<number | null>(null);
  const [copyBanner, setCopyBanner] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const flash = (msg: string) => {
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    setCopyBanner(msg);
    copyTimerRef.current = window.setTimeout(() => setCopyBanner(null), 1600);
  };

  const runCopy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${label} copied`);
    } catch {
      flash("Could not copy (browser blocked clipboard)");
    }
  };

  const distinctUpgraded = descUp.length > 0 && descUp !== desc;
  const descBoxMax =
    variant === "hero"
      ? "max-h-[min(62vh,32rem)]"
      : "max-h-[min(50vh,24rem)]";
  const upBoxMax =
    variant === "hero"
      ? "max-h-[min(52vh,28rem)]"
      : "max-h-[min(40vh,20rem)]";
  const bodyClass =
    variant === "rail"
      ? "text-[13px] leading-relaxed tracking-wide text-zinc-200"
      : variant === "hero"
        ? "text-sm leading-relaxed tracking-wide text-zinc-200"
        : "text-xs leading-relaxed text-zinc-300";
  const headerPad = variant === "compact" ? "px-4 pt-4" : "px-5 pt-5";
  const footerPad = variant === "compact" ? "p-4" : "p-5";
  const titleClass =
    variant === "hero"
      ? "mt-3 text-xl font-semibold text-zinc-50 sm:text-2xl"
      : "mt-2.5 font-semibold text-zinc-50 sm:text-lg";

  return (
    <div
      className={`flex flex-col rounded-xl border ${characterCardShellFm(liveCodexRow.character ?? "")}`}
    >
      <div className={headerPad}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${characterColorBadgeFm(liveCodexRow.character ?? "")}`}
          >
            {liveCodexRow.character ?? "—"}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] ${rarityBadgeFm(liveCodexRow.rarity ?? "")}`}
          >
            {liveCodexRow.rarity ?? "—"}
          </span>
          <span className="ml-auto rounded-md bg-zinc-950/95 px-2 py-0.5 font-mono text-[11px] text-zinc-300 ring-1 ring-zinc-800/80">
            {liveCodexRow.costLabel ?? "cost"}
          </span>
        </div>
        <h2 className={titleClass}>{liveCodexRow.name}</h2>
        <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
          {liveCodexRow.displayKey}
        </p>

        {copyBanner ? (
          <p className="mt-2 rounded-md bg-emerald-950/40 px-2 py-1 font-mono text-[10px] text-emerald-200/95 ring-1 ring-emerald-800/45">
            {copyBanner}
          </p>
        ) : null}
      </div>

      <div
        className={`${footerPad} flex flex-col gap-3 border-t border-white/5 pt-4`}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-2 border-b border-zinc-700/35 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Description
            </span>
            <span className="ml-auto text-[10px] tabular-nums text-zinc-600">
              {desc.length.toLocaleString()} chars
            </span>
            <button
              type="button"
              title="Copy base description"
              className="shrink-0 rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium text-zinc-300 hover:border-teal-800/55 hover:bg-zinc-900 hover:text-teal-100/90 disabled:opacity-35"
              disabled={desc.length === 0}
              onClick={() => runCopy("Description", desc)}
            >
              Copy
            </button>
          </div>
          <div
            className={`fm-scrollbar ${descBoxMax} overflow-y-auto rounded-lg border border-black/35 bg-black/25 px-3 py-2.5 ${bodyClass}`}
          >
            {desc.length ? desc : "—"}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-2 border-b border-zinc-700/35 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Upgraded
            </span>
            {!distinctUpgraded ? (
              <span className="text-[10px] text-zinc-600">Same as base</span>
            ) : null}
            <span className="ml-auto text-[10px] tabular-nums text-zinc-600">
              {distinctUpgraded
                ? `${descUp.length.toLocaleString()} chars`
                : "—"}
            </span>
            <button
              type="button"
              title="Copy upgraded description"
              className="shrink-0 rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium text-zinc-300 hover:border-teal-800/55 hover:bg-zinc-900 hover:text-teal-100/90 disabled:opacity-35"
              disabled={!distinctUpgraded}
              onClick={() =>
                runCopy("Upgraded", distinctUpgraded ? descUp : desc)
              }
            >
              Copy
            </button>
          </div>
          <div
            className={`fm-scrollbar ${upBoxMax} overflow-y-auto rounded-lg border border-black/35 bg-black/22 px-3 py-2.5 ${
              distinctUpgraded ? "" : "opacity-80"
            } ${bodyClass} ${distinctUpgraded ? "text-zinc-300" : "text-zinc-500"}`}
          >
            {!distinctUpgraded
              ? "No separate upgraded text on this card."
              : descUp}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-zinc-800/65 pt-3">
          <button
            type="button"
            className="rounded-lg border border-zinc-700/80 bg-zinc-900/50 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-35"
            disabled={desc.length === 0 && !distinctUpgraded}
            onClick={() =>
              runCopy(
                "Both",
                `${desc}${distinctUpgraded ? `\n\n— Upgraded —\n\n${descUp}` : ""}`,
              )
            }
          >
            Copy both
          </button>
          <button
            type="button"
            onClick={() => onMergeFromDescriptions()}
            className="rounded-lg bg-teal-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-teal-500"
          >
            Merge from descriptions
          </button>
        </div>

        {variant === "rail" ? (
          <a
            href={`#${editorAnchorId}`}
            className="inline-flex text-[10px] font-medium text-teal-500/90 underline-offset-2 hover:underline"
          >
            Jump to field editor ↓
          </a>
        ) : variant === "hero" ? (
          <a
            href={`#${editorAnchorId}`}
            className="inline-flex text-[10px] font-medium text-teal-500/90 underline-offset-2 hover:underline"
          >
            Open editor panel ↓
          </a>
        ) : null}
      </div>
    </div>
  );
}
