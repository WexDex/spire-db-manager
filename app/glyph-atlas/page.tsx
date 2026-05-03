import type { Metadata } from "next";
import { readStsCanonicalBundleText } from "@/lib/load-sts-cards-db";
import { GlyphAtlasRouteClient } from "./glyph-atlas-route-client";

export const metadata: Metadata = {
  title: "Glyph atlas",
  description:
    "STS icon catalog glyphs, semantic effect icons, planner-only keys, exports for sts-planner-reworked",
};

export default async function GlyphAtlasPage() {
  const serverBundleText = await readStsCanonicalBundleText();
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <GlyphAtlasRouteClient serverBundleText={serverBundleText} />
    </div>
  );
}
