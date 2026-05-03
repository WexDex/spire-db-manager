import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Glyphs · Card workbench",
  description:
    "Glyph tooling for the STS card DB (coming soon — use Glyph atlas meanwhile)",
};

export default function CardWorkbenchGlyphsPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-500/80">
          Card workbench — Glyphs
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
          Glyph reference hub
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Dedicated glyph workflows under this route are not wired yet. The{" "}
          <Link
            href="/glyph-atlas"
            className="font-medium text-teal-400 underline-offset-2 hover:underline"
          >
            Glyph atlas
          </Link>{" "}
          page has the catalog and previews today.
        </p>
      </div>
    </main>
  );
}
