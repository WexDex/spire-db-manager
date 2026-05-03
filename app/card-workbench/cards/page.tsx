import type { Metadata } from "next";
import { loadStsCardsFinal } from "@/lib/load-sts-cards-db";
import { CardWorkbenchCardsView } from "./card-workbench-cards-view";

export const metadata: Metadata = {
  title: "Cards · Card workbench",
  description:
    "Fast STS card correction: collapse chrome, browse cards, edit fields and full JSON (syncs with Field Manager storage)",
};

export default async function CardWorkbenchCardsPage() {
  const { entries, galleryFieldKeys } = await loadStsCardsFinal();
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col">
      <CardWorkbenchCardsView entries={entries} galleryFieldKeys={galleryFieldKeys} />
    </main>
  );
}
