import type { Metadata } from "next";
import designGallery from "@/app/data/card_design_gallery.json";

export const metadata: Metadata = {
  title: "Card design gallery data",
};

export default function CardDesignGalleryPage() {
  const cardKeys = Object.keys(designGallery).filter((k) => k !== "_meta");
  const meta = "_meta" in designGallery ? designGallery._meta : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
        Card design gallery (data stub)
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        UI later. Structured fields live in{" "}
        <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs text-zinc-300">
          app/data/card_design_gallery.json
        </code>
        ; merge overlays onto{" "}
        <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs text-zinc-300">
          sts-planner-reworked/…/STS_CARDS_DB.json
        </code>{" "}
        by card name ({cardKeys.length} overlays).
      </p>
      {meta && (
        <pre className="mt-6 max-h-80 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/90 p-4 text-xs text-zinc-400">
          {JSON.stringify(meta, null, 2)}
        </pre>
      )}
      <ul className="mt-6 flex flex-wrap gap-2 font-mono text-xs text-zinc-500">
        {cardKeys.sort((a, b) => a.localeCompare(b)).map((k) => (
          <li key={k} className="rounded border border-zinc-800 px-2 py-1 text-zinc-400">
            {k}
          </li>
        ))}
      </ul>
    </main>
  );
}
