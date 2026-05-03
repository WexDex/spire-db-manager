"use client";

import { useMemo } from "react";
import { StsCardsDbManagedLayout } from "@/app/components/sts-cards-db-managed-layout";
import type { StsFinalLoadResult } from "@/lib/sts-cards-db-parse-document";
import { buildGlyphAtlasData } from "@/lib/glyph-registry";
import { GlyphAtlasView } from "./glyph-atlas-view";

type Props = {
  serverBundleText: string;
};

export function GlyphAtlasRouteClient({ serverBundleText }: Props) {
  return (
    <StsCardsDbManagedLayout
      serverBundleText={serverBundleText}
      toolbarClassName="sticky top-0 z-20 shrink-0 border-zinc-800/90 shadow-sm shadow-black/20"
    >
      {(bundle) => <GlyphAtlasFromBundle bundle={bundle} />}
    </StsCardsDbManagedLayout>
  );
}

function GlyphAtlasFromBundle({ bundle }: { bundle: StsFinalLoadResult }) {
  const atlas = useMemo(
    () =>
      buildGlyphAtlasData({
        iconCatalog: bundle.iconCatalog,
        attributeIconLinks: bundle.attributeIconLinks,
        lucideByIconKey: bundle.lucideByIconKey,
      }),
    [bundle.attributeIconLinks, bundle.iconCatalog, bundle.lucideByIconKey],
  );
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-auto bg-zinc-950">
      <GlyphAtlasView atlas={atlas} />
    </main>
  );
}
