import type { Metadata } from "next";
import { loadStsCardsFinal } from "@/lib/load-sts-cards-db";
import { FieldManagerView } from "./field-manager-view";

export const metadata: Metadata = {
  title: "Field manager",
  description: "Edit structured card fields against descriptions (canonical STS_CARDS_DB)",
};

/**
 * Server snapshot from the real STS_CARDS_DB bundle (`resolveStsCardsDbPath` —
 * sts-planner-reworked sibling or `STS_CARDS_DB_PATH`).
 */
export default async function FieldManagerPage() {
  const { entries, galleryFieldKeys } = await loadStsCardsFinal();
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col">
      <FieldManagerView entries={entries} galleryFieldKeys={galleryFieldKeys} />
    </main>
  );
}
