/** Shared card-shell classes for explorer sidebars (field manager, field icons). */

export function characterCardShellExplorer(character: string): string {
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

export function characterColorBadgeExplorer(character: string): string {
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

export function rarityBadgeExplorer(rarity: string): string {
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
