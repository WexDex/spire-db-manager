import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-4 py-16">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
          Spire DB manager
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">
          Choose a tool. The codex, field tools, and glyph atlas read the same canonical
          STS card bundle from sts-planner-reworked.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <li>
          <Link
            href="/codex"
            className="flex min-h-[8.5rem] flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-sm transition-colors hover:border-sky-700/50 hover:bg-zinc-900/40"
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-zinc-100">Codex</h2>
              <p className="text-sm leading-relaxed text-zinc-500">
                Search and filter cards from{" "}
                <code className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-xs text-zinc-300">
                  sts-planner-reworked …/STS_CARDS_DB.json
                </code>
                — type, rarity, pool, field tags, full detail panel.
              </p>
            </div>
            <span className="text-sm font-medium text-sky-400">
              Open codex →
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/glyph-atlas"
            className="flex min-h-[8.5rem] flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-sm transition-colors hover:border-indigo-700/50 hover:bg-zinc-900/40"
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-zinc-100">
                Glyph atlas
              </h2>
              <p className="text-sm leading-relaxed text-zinc-500">
                STS icon keys, semantic effect glyphs, which JSON fields attach,
                planner-only deltas — exports for sts-planner-reworked.
              </p>
            </div>
            <span className="text-sm font-medium text-indigo-400">
              Open atlas →
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/field-manager"
            className="flex min-h-[8.5rem] flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-sm transition-colors hover:border-emerald-700/50 hover:bg-zinc-900/40"
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-zinc-100">
                Field manager
              </h2>
              <p className="text-sm leading-relaxed text-zinc-500">
                Edit structured fields per card from the canonical{" "}
                <code className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-xs text-zinc-300">
                  STS_CARDS_DB.json
                </code>{" "}
                (planner) bundle — tags, toggles, description merge, raw JSON.
              </p>
            </div>
            <span className="text-sm font-medium text-emerald-400">
              Open field manager →
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/field-runthrough"
            className="flex min-h-[8.5rem] flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-sm transition-colors hover:border-teal-700/50 hover:bg-zinc-900/40"
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-zinc-100">
                Field runthrough
              </h2>
              <p className="text-sm leading-relaxed text-zinc-500">
                Walk cards one-by-one — gameplay-linked fields first, compact rows.
                Shares saved edits with the field manager.
              </p>
            </div>
            <span className="text-sm font-medium text-teal-400">
              Open runthrough →
            </span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
