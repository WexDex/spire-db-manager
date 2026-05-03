import type { Metadata } from "next";
import { loadStsCardsFinal } from "@/lib/load-sts-cards-db";
import { buildGlyphAtlasData } from "@/lib/glyph-registry";
import { GlyphAtlasView } from "./glyph-atlas-view";

export const metadata: Metadata = {
  title: "Glyph atlas",
  description:
    "STS icon catalog glyphs, semantic effect icons, planner-only keys, exports for sts-planner-reworked",
};

export default async function GlyphAtlasPage() {
  const data = await loadStsCardsFinal();
  const atlas = buildGlyphAtlasData({
    iconCatalog: data.iconCatalog,
    attributeIconLinks: data.attributeIconLinks,
    lucideByIconKey: data.lucideByIconKey,
  });

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-auto bg-zinc-950">
      <GlyphAtlasView atlas={atlas} />
    </main>
  );
}
